export const classificationMap: { [index: number]: string; } = {
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
    patient_id: 12362515,
    temperature: 100.3,
    heartrate: 148.0,
    resprate: 16.0,
    o2sat: 92.0,
    sbp: 117.0,
    dbp: 72.0,
    pain: 0,
    acuity: 1.0,
    history_of_present_illness: 'Pt is a ___ y.o male with h.o aggressive, hormone refractory metastatic prostate cancer with known spinal mets, back pain, HTN, anxiety, GERD who presents to the ER with tachycardia and fever.  He was admitted from ___ to ___ for fever and hematuria.  No infectious source was found; he also had transient hematuria of unclear etiology, probably from metastatic disease.  The patient was given steroids from capsular (abdominal) pain from mets to the liver. Atrius oncology and Palliative Care followed him during his last admission as well.',
    image: "/mids-210-medfusion-analytics-spring24/data/4eaea495-116e27f8-cb8820c6-b3ce0144-c8db0e28.jpg"
  },
  {
    patient_id: 14019365,
    temperature: 98.2,
    heartrate: 58.0,
    resprate: 18.0,
    o2sat: 98.0,
    sbp: 204.0,
    dbp: 97.0,
    pain: 0,
    acuity: 2.0,
    history_of_present_illness: "___ w/HTN, hx of CVA w/mild dementia, afib on coumadin BIBEMS for AMS. Per pt's daughter, pt has hx of AMS ___ hyponatremia and HTN. pt's son went to have lunch with him earlier today, noticed that she was not acting herself-described as babbling, c/o ha, drowsy. Pt unable to give any hx. Per daughter, at baseline is AAox2, can walk with a walker ~1 block, can go to BR on her own but cant wash herself. able to feed herself and call daughter on her own. is not very social, goes to 1x meal in ALF daily.",
    image: "/mids-210-medfusion-analytics-spring24/data/cd3d501b-de63e62b-5e47a192-fbb079f6-e77c266a.jpg"
  },
  {
    patient_id: 16861916,
    temperature: 97.4,
    heartrate: 49.0,
    resprate: 16.0,
    o2sat: 94.0,
    sbp: 159.0,
    dbp: 59.0,
    pain: 6,
    acuity: 2.0,
    history_of_present_illness: 'Ms. ___ is a ___ y/o female with a past medical history of HTN, HLD, hypothyroidism, asthma, and diastolic CHF who presents with a 1 week history of DOE, cough, and ___ swelling (R>L). Patient was in her usual state of health until about 1 week ago at which point she developed dyspnea on exertion. Per the family, patient is extremely active. She is able to go to church regularly, walk up and down stairs, and perform daily ADLs. She lives with her son, daughter-in-law, and grandaughter. Last week she was downstairs and was more short of breath when walking up stairs. She denied any CP, palpitations, diaphoresis. Throughout the week, she developed a nonproductive cough, wheezes, and lower extremity swelling in her right leg. Endorses orthopnea. Denies any change in pillow quantity at night, denies PND. Denies h/o DVT or PE, recent surgeries/travel, hemoptysis. Denies fevers, chills, nausea, vomiting, diarhea, dysuria. Has not been using her albuterol inhaler more frequently. Family was concerned about her symptoms and the possibility of a DVT, and thus she was sent to the ED. In the ED, VS T 97.4, HR 49, BP 159/59, RR 16, sats 94-99% RA. WBC 8.2. BNP 229. Troponin negative x1. Right ___ doppler was negative. CXR with small bilateral pleural effusions.   On the floor, T 97.8, BP 182/61, HR 49, RR 22, 94% RA. Patient was without complaints, sitting comfortably in bed in no respiratory distress.',
    image: "/mids-210-medfusion-analytics-spring24/data/02c6e4a9-144b7d90-fdbbb221-1b40fd43-ba173a86_min.jpg"
  },
  {
    patient_id: 12117907,
    temperature: 98.8,
    heartrate: 111.0,
    resprate: 24.0,
    o2sat: 95.0,
    sbp: 97.0,
    dbp: 72.0,
    pain: 7,
    acuity: 2.0,
    history_of_present_illness: 'Mr. ___ is a ___ gentleman, prior smoker, with recently diagnosed lung ca (metastatic lung ca diagnosed from pleural fluid ___ who is being admitted for an expedited work up of his underlying malignancy. He is being followed by the Interventional Pulmonologists and was seen in clinic on ___ with discussion regarding potential thoracoscopy, pleural catheter drainage, and pleurodesis. He recently had a MRI head on ___ which demonstrated multiple brain mets with surrounding vasogenic edema consistent with metastatic disease. As a result, Mr. ___ was encouraged to come to the ED for further workup. Patient reports no new change in symptoms, has some difficulty breathing but no chest pain. Denies any headache, peripheral numbness or weakness, change in sensation, blurry or double vision. No nausea, vomiting, or abdominal pain.',
    image: "/mids-210-medfusion-analytics-spring24/data/8606e522-c1f6b6c7-bccfccea-a98f219b-8b81176e_min.jpg",
  }
];

export type InferenceDatum = {
  label: string;
  probability: number;
  logits: number;
  odds_ratio: number;
};