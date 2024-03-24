import * as ort from 'onnxruntime-web';
import { BertTokenizer, softmax } from '@xenova/transformers';
import tokenizerJSON from '@/model/bio_clinical_bert_tokenizer/tokenizer.json';
import tokenizerConfig from '@/model/bio_clinical_bert_tokenizer/tokenizer_config.json';
import { ModelWebWorkerSendMessage } from './worker-types';
import { NLP_MODEL_URL } from '@/utils/constants';
import { classificationMap } from '@/data/classification-map';

console.log('webworker initialized');

class TokenizerSingleton {
  private static instance: BertTokenizer;
  private constructor() {
    console.log('TokenizerSingleton created');
  }
  public static async getInstance() {
    if (!this.instance) {
      this.instance = new BertTokenizer(tokenizerJSON, tokenizerConfig);
    }
    return TokenizerSingleton.instance;
  }
}

const nlpTokenizer = async (input: string) => {
  const tokenizer = await TokenizerSingleton.getInstance();
  return tokenizer(input, { add_special_tokens: true, padding: 'max_length', max_length: 512, truncation: true });
};

class InferenceSessionSingleton {
  private static instance = new Map<string, ort.InferenceSession>();
  private constructor() {
    console.log('InferenceSessionSingleton created');
  }
  public static async getInstance(model: string) {
    if (!this.instance.has(model)) {
      const session = await ort.InferenceSession.create(model, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
      this.instance.set(model, session);
      return session;
    }
    return InferenceSessionSingleton.instance.get(model) as ort.InferenceSession;
  }
}

function inverseLogit(x: number) {
  return 1 / (1 + Math.exp(-x));
}

export async function classificationClasses(classProbabilities: number[], logits: ort.Tensor) {
  const data = await logits.getData();
  return classProbabilities.map((prob, index) => {
    return { label: classificationMap[index], probability: prob, logits: data[index], odds_ratio: inverseLogit(data[index] as number) };
  });
}

const runTextClassificationInference = async (input: string) => {
  // 1. Tokenize input
  self.postMessage({ type: 'update', model: 'text', payload: 'Tokenizing input' });
  const preprocessedData = await nlpTokenizer(input);
  // 2. Run model
  let session: ort.InferenceSession;
  try {
    self.postMessage({ type: 'update', model: 'text', payload: 'Creating inference session' });
    session = await InferenceSessionSingleton.getInstance(NLP_MODEL_URL);
  } catch (error) {
    console.error(error);
    self.postMessage({ type: 'error', model: 'text', payload: error });
    return;
  }

  self.postMessage({ type: 'update', model: 'text', payload: 'Running inference' });

  // 3. Return predictions and the amount of time it took to inference.
  const start = performance.now();

  const feeds: Record<string, ort.Tensor> = {};
  for (const inputName of session.inputNames) {
    const tensor = preprocessedData[inputName];
    feeds[inputName] = new ort.Tensor('int64', tensor.data, tensor.dims);
  }

  const outputData = await session.run(feeds);
  const end = performance.now();

  const inferenceTime = (end - start) / 1000;
  const output = outputData[session.outputNames[0]];
  console.log(outputData);
  const outputSoftmax = softmax(Array.prototype.slice.call(output.data));
  console.log('outputSoftmax: ', outputSoftmax);
  const results = await classificationClasses(outputSoftmax, output);

  self.postMessage({ type: 'inference', model: 'text', payload: { results, inferenceTime } });
};

self.addEventListener('message', (event: MessageEvent<ModelWebWorkerSendMessage>) => {
  console.log(event.data);
  const { type, payload } = event.data;
  switch (type) {
    case 'textOnly':
      runTextClassificationInference(payload);
      break;
    default:
      break;
  }
});