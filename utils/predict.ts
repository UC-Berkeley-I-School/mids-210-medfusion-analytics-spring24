import { getImageTensorFromPath } from './imageHelper';
import { runSqueezenetModel, runTextClassificationModel } from './modelHelper';
import { nlpTokenizer } from './tokenizer';

export async function inferenceSqueezenet(path: string): Promise<[any, number]> {
  // 1. Convert image to tensor
  const imageTensor = await getImageTensorFromPath(path);
  // 2. Run model
  const [predictions, inferenceTime] = await runSqueezenetModel(imageTensor);
  // 3. Return predictions and the amount of time it took to inference.
  return [predictions, inferenceTime];
}

export async function inferenceBioclinicalBert(input: string): Promise<[any, number]> {
  // 1. Tokenize input
  const preprocessedData = await nlpTokenizer(input);
  console.log('preprocessedData: ', preprocessedData);
  // 2. Run model
  const [predictions, inferenceTime] = await runTextClassificationModel(preprocessedData);
  // 3. Return predictions and the amount of time it took to inference.
  return [predictions, inferenceTime];
}