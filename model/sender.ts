import { ModelWebWorkerSendMessage } from './worker-types';

// Enforce message type format to match ModelWebWorkerMessage
export const sendMessage = (worker: Worker, message: ModelWebWorkerSendMessage) => {
  worker.postMessage(message);
};