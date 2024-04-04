export type ModelWebWorkerSendMessage = {
  type: string;
  payload: any;
};

export type ModelWebWorkerReceiveMessage = {
  type: string;
  model: string;
  payload: any;
};

export type FusionModelInputs = {
  pain: number;
  acuity: number;
  temperature: number;
  heartrate: number;
  resprate: number;
  o2sat: number;
  sbp: number;
  dbp: number;
  no_findings_prob_img: number;
  atelectasis_prob_img: number;
  cardiomegaly_prob_img: number;
  lung_opacity_prob_img: number;
  plueral_effusion_prob_img: number;
  no_findings_prob_txt: number;
  atelectasis_prob_txt: number;
  cardiomegaly_prob_txt: number;
  lung_opacity_prob_txt: number;
  plueral_effusion_prob_txt: number;
};