import * as ort from 'onnxruntime-web';
import { BertTokenizer, ImageFeatureExtractor, RawImage, softmax } from '@xenova/transformers';
import tokenizerJSON from '@/model/bio_clinical_bert_tokenizer/tokenizer.json';
import tokenizerConfig from '@/model/bio_clinical_bert_tokenizer/tokenizer_config.json';
import { ModelWebWorkerSendMessage } from './worker-types';
import { IMAGE_MODEL_URL, NLP_MODEL_URL, TABULAR_MODEL_URL } from '@/utils/constants';
import { textClassificationMap } from '@/data/classification-map';

console.log('webworker initialized');

const isIOS = typeof navigator !== 'undefined' && /iP(hone|od|ad)/.test(navigator.userAgent);
if (isIOS) {
  ort.env.wasm.numThreads = 1;
}
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
    return { label: textClassificationMap[index], probability: prob, logits: data[index], odds_ratio: inverseLogit(data[index] as number) };
  });
}

const runTabularClassificationInference = async (input: { [key: string]: number; }) => {
  let session: ort.InferenceSession;
  try {
    self.postMessage({ type: 'update', model: 'tabular', payload: 'Creating inference session' });
    session = await InferenceSessionSingleton.getInstance(TABULAR_MODEL_URL);
  } catch (error) {
    console.error(error);
    self.postMessage({ type: 'error', model: 'tabular', payload: error });
    return;
  }

  console.log(session);
  self.postMessage({ type: 'update', model: 'tabular', payload: 'Running inference' });

  const start = performance.now();
  const feeds: Record<string, ort.Tensor> = {};
  const float32_inputs = ['temperature', 'heartrate', 'resprate', 'o2sat', 'sbp', 'dbp'];
  const int64_inputs = ['pain', 'acuity'];
  for (const inputName of session.inputNames) {
    if (float32_inputs.includes(inputName)) {
      feeds[inputName] = new ort.Tensor('float32', [input[inputName]], [1]);
    } else if (int64_inputs.includes(inputName)) {
      feeds[inputName] = new ort.Tensor('int64', [input[inputName]], [1]);
    }
  }
  console.log(feeds, session.outputNames);

  const outputData = await session.run(feeds);
  const end = performance.now();

  const inferenceTime = (end - start) / 1000;
  console.log(outputData, session.outputNames);
  const output = outputData.probabilities;
  const outputSoftmax = softmax(Array.prototype.slice.call(output.data));
  console.log('outputSoftmax: ', outputSoftmax);
  const results = await classificationClasses(outputSoftmax, output);

  self.postMessage({ type: 'tabularInference', model: 'tabular', payload: { results, inferenceTime } });

};

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

  self.postMessage({ type: 'textInference', model: 'text', payload: { results, inferenceTime } });
};

async function imagePreprocessor(url: string | URL) {
  const image = await RawImage.fromURL(url);
  const preprocessor = new ImageFeatureExtractor({
    image_mean: [0.485, 0.456, 0.406],
    image_std: [0.229, 0.224, 0.225],
    do_rescale: true,
    rescale_factor: 1 / 255,
    do_normalize: true,
    do_resize: true,
    resample: 2,
    size: {
      width: 256,
      height: 256,
    },
  });
  const res = await preprocessor([image]);
  return res.pixel_values;
}

const runImageClassificationInference = async (input: string) => {
  self.postMessage({ type: 'update', model: 'image', payload: 'Preprocessing Image' });
  const val = await imagePreprocessor(input);
  const tensor = new ort.Tensor(val.type, val.data as any, val.dims);
  console.log(tensor);

  let session: ort.InferenceSession;
  try {
    self.postMessage({ type: 'update', model: 'image', payload: 'Creating inference session' });
    session = await InferenceSessionSingleton.getInstance(IMAGE_MODEL_URL);
  } catch (error) {
    console.error(error);
    self.postMessage({ type: 'error', model: 'image', payload: error });
    return;
  }
  self.postMessage({ type: 'update', model: 'image', payload: 'Running inference' });
  const start = performance.now();
  const feeds: Record<string, ort.Tensor> = {};
  feeds[session.inputNames[0]] = new ort.Tensor(val.type, val.data as any, val.dims);
  const outputData = await session.run(feeds);
  const end = performance.now();
  console.log(outputData);
  const output = outputData[session.outputNames[0]];
  const inferenceTime = (end - start) / 1000;
  const outputSoftmax = softmax(Array.prototype.slice.call(output.data));
  console.log('outputSoftmax: ', outputSoftmax);
  const results = await classificationClasses(outputSoftmax, output);

  self.postMessage({ type: 'imageInference', model: 'image', payload: { results, inferenceTime } });
};

self.addEventListener('message', (event: MessageEvent<ModelWebWorkerSendMessage>) => {
  console.log(event.data);
  const { type, payload } = event.data;
  switch (type) {
    case 'textOnly':
      runTextClassificationInference(payload);
      break;
    case 'imageOnly':
      runImageClassificationInference(payload);
      break;
    case 'tabularOnly':
      runTabularClassificationInference(payload);
      break;
    default:
      break;
  }
});