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
    name: "Patient A (Atelectasis)",
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
    name: "Patient B (Cardiomegaly)",
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
    name: "Patient C (Pleural Effusion)",
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
  },
  {
    name: "Patient D (Cardiomegaly)",
    temperature: 97.3,
    heartrate: 70,
    resprate: 25,
    o2sat: 98,
    sbp: 204,
    dbp: 73,
    pain: 0,
    acuity: 2,
    history_of_present_illness: 'Pt complained of shortness of breath after waking up or lying down and dizziness. Family history of hypertension. Swelling in lower extremities. Arrhythmia observed when heart rate taken.',
    image: "/mids-210-medfusion-analytics-spring24/data/cardiomegaly-3.jpeg",
  },
  {
    name: "Patient E (Pleural Effusion)",
    temperature: 100.4,
    heartrate: 98,
    resprate: 29,
    o2sat: 96,
    sbp: 132,
    dbp: 73,
    pain: 5,
    acuity: 2,
    history_of_present_illness: 'Pt presented with fever, chest pain, and hiccups. Breathing rapidly and appeared short of breath. Patient has type II diabetes. Family history of kidney disease.',
    image: "/mids-210-medfusion-analytics-spring24/data/f69b9ba15aa08e02024c4dc168ab80aa0dfc09c8bde1662cd7ce62d13c7b016d_big_gallery.png",
  },
  {
    name: "Patient F (Lung Opacity)",
    temperature: 98.4,
    heartrate: 148,
    resprate: 26,
    o2sat: 92,
    sbp: 154,
    dbp: 84,
    pain: 5,
    acuity: 2,
    history_of_present_illness: '25-year old man presented with complaints of chest pain, short- ness of breath and occasional haemoptysis of 8-month duration. He also had a history of treated pulmonary tuberculosis.',
    image: "/mids-210-medfusion-analytics-spring24/data/Chest-X-ray-showing-right-lung-opacity.png"
  }
];

export type InferenceDatum = {
  label: string;
  probability: number;
  logits: number;
  odds_ratio: number;
};