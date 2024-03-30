export const textClassificationMap: { [index: number]: string; } = {
  0: 'no_finding',
  1: 'atelectasis',
  2: 'cardiomegaly',
  3: 'lung_opacity',
  4: 'pleural_effusion',
};

export const categoryToName: { [index: string]: string; } = {
  'no_finding': 'No Finding',
  'atelectasis': 'Atelectasis',
  'cardiomegaly': 'Cardiomegaly',
  'lung_opacity': 'Lung Opacity',
  'pleural_effusion': 'Pleural Effusion',
};

export const categoryColors: { [index: string]: string; } = {
  'no_finding': '#1f77b4',
  'atelectasis': '#ff7f0e',
  'cardiomegaly': '#2ca02c',
  'lung_opacity': '#d62728',
  'pleural_effusion': '#9467bd',
};

export const presets = [
  {
    patient_id: 10577202,
    visit_id: 28246165,
    study_id: 51512850,
    temperature: 98.1,
    heartrate: 61,
    resprate: 18,
    o2sat: 95,
    sbp: 154,
    dbp: 85,
    pain: 0,
    acuity: 2,
    positive_label_total: 1,
    finding_names: "no_finding",
    chief_complaint: "hand pain",
    major_surgical_or_invasive_procedure: "None",
    history_of_present_illness: "___ w/HIV, HCV cirrhosis, recent C.Diff presents with abdominal pain and hand errosions. Pt reports he went to routine PCP follow up yesterday to meet new resident and was sent to BI ED for evaluation of hand infection. He reports that hand pain and swelling over dorsum of both hands has been present for 8 months. Right worse than left. No fever, no other lesions. States he saw a hand specialist for this previously, does not recall diagnosis but was told to keep hands wrapped and use A&D ointment. States hands are improving.Also with chronic RLQ abd pain, dull, constant, for several months, nonradiating, associated w/nausea and intermittent loose nonbloody, stools once a day. Also with depression, again chronic for ___ months, worsening apathy, fatigue, decreased appetite, 60lb weight loss over 4 months, denies SI/HI. Self discontinued all anti-depressants and has not follow up with psych. In ED hand surgery consulted. Pt given cefepime, vanco, morphine. ROS: +as above, otherwise reviewed and negative",
    atelectasis: 0,
    cardiomegaly: 0,
    lung_opacity: 0,
    pleural_effusion: 0,
    image_max_res: "/mids-210-medfusion-analytics-spring24/data/3d2bae29-7504f8f4-4c6aaa8f-694ced3f-bb470179_max.jpg",
    image_min_res: "/mids-210-medfusion-analytics-spring24/data/3d2bae29-7504f8f4-4c6aaa8f-694ced3f-bb470179_min.jpg",
  }
];

export type InferenceDatum = {
  label: string;
  probability: number;
  logits: number;
  odds_ratio: number;
};