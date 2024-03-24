export type ModelWebWorkerSendMessage = {
  type: string;
  payload: any;
};

export type ModelWebWorkerReceiveMessage = {
  type: string;
  model: string;
  payload: any;
};

