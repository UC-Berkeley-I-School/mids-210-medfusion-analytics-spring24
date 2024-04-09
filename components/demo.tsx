'use client';

import * as React from 'react';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Spinner } from './ui/spinner';
import { InferenceDatum, categoryToName, presets } from '@/data/classification-map';
import { sendMessage } from '@/model/sender';
import { FusionModelInputs, ModelWebWorkerReceiveMessage, ModelWebWorkerSendMessage } from '@/model/worker-types';
import Chart from './chart';
import { sort } from 'd3-array';
import Image from 'next/image';
import { Link } from 'nextra-theme-docs';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export function Demo() {
  const [tabularMsg, setTabularMsg] = useState<string>('');
  const [tabularTime, setTabularTime] = useState<number>(0);
  const [tabularInference, setTabularInference] = useState<InferenceDatum[]>();
  const [tabularInferenceSorted, setTabularInferenceSorted] = useState<InferenceDatum[]>();
  const [tabularLoading, setTabularLoading] = useState<boolean>(false);

  const [textMsg, setTextMsg] = useState<string>('');
  const [textTime, setTextTime] = useState<number>(0);
  const [textInference, setTextInference] = useState<InferenceDatum[]>();
  const [textInferenceSorted, setTextInferenceSorted] = useState<InferenceDatum[]>();
  const [textLoading, setTextLoading] = useState<boolean>(false);

  const [imageMsg, setImageMsg] = useState<string>('');
  const [imageTime, setImageTime] = useState<number>(0);
  const [imageInference, setImageInference] = useState<InferenceDatum[]>();
  const [imageInferenceSorted, setImageInferenceSorted] = useState<InferenceDatum[]>();
  const [imageLoading, setImageLoading] = useState<boolean>(false);

  const [fusionMsg, setFusionMsg] = useState<string>('');
  const [fusionInference, setFusionInference] = useState<InferenceDatum[]>();
  const [fusionInferenceSorted, setFusionInferenceSorted] = useState<InferenceDatum[]>();
  const [fusionLoading, setFusionLoading] = useState<boolean>(false);

  const worker = useRef<Worker | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | URL>();
  const schema = z.object({
    notes: z.string().min(100, 'The notes must be at least 100 characters long.'),
    temperature: z.coerce.number().max(120).min(50, 'Temperature input in Fahrenheit.'),
    heartrate: z.coerce.number().max(500).min(20),
    resprate: z.coerce.number().max(200).min(0).positive(),
    o2sat: z.coerce.number().max(100).min(70),
    sbp: z.coerce.number().max(400).min(40),
    dbp: z.coerce.number().max(400).min(10),
    pain: z.coerce.number().int().max(10).min(0),
    acuity: z.coerce.number().int().max(5).min(1),
    image: z
      .any()
      .refine((file) => file?.length == 1, 'Image is required.')
      .refine(
        (file) => ACCEPTED_IMAGE_TYPES.includes(file[0]?.type),
        'Only .jpg, .jpeg and .png formats are supported.'
      ),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      notes: '',
      temperature: '' as unknown as number,
      heartrate: '' as unknown as number,
      resprate: '' as unknown as number,
      o2sat: '' as unknown as number,
      sbp: '' as unknown as number,
      dbp: '' as unknown as number,
      pain: '' as unknown as number,
      acuity: '' as unknown as number,
    },
  });

  const fileRef = form.register('image');
  fileRef.onChange = async (e) => {
    console.log(e);
    const url = URL.createObjectURL(e.target.files?.[0]);
    setSelectedImage(url);
  };

  const loadPreset = async (index: number) => {
    const preset = presets[index];
    form.setValue('temperature', preset.temperature);
    form.setValue('heartrate', preset.heartrate);
    form.setValue('resprate', preset.resprate);
    form.setValue('o2sat', preset.o2sat);
    form.setValue('sbp', preset.sbp);
    form.setValue('dbp', preset.dbp);
    form.setValue('pain', preset.pain);
    form.setValue('acuity', preset.acuity);
    form.setValue('notes', preset.history_of_present_illness);
    const response = await fetch(preset.image);
    const data = await response.blob();
    const metadata = response.headers.get('content-type') || 'image/jpeg';
    const image = new File([data], 'preset.jpg', { type: metadata });
    form.setValue('image', [image]);
    setSelectedImage(preset.image);
  };

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL('@/model/worker.ts', import.meta.url), { type: 'module' });
    }

    const onMessageReceived = (event: MessageEvent<ModelWebWorkerReceiveMessage>) => {
      console.log('message recieved from work: ', event);
      switch (event.data.model) {
        case 'text':
          textInferenceMessageProcessor(event);
          break;
        case 'image':
          imageInferenceMessageProcessor(event);
          break;
        case 'tabular':
          tabularInferenceMessageProcessor(event);
          break;
        case 'fusion':
          fusionInferenceMessageProcessor(event);
          break;
        default:
          break;
      }
    };
    worker.current.addEventListener('message', onMessageReceived);

    return () => worker.current?.removeEventListener('message', onMessageReceived);
  });

  const tabularInferenceMessageProcessor = (event: MessageEvent<ModelWebWorkerReceiveMessage>) => {
    const { type, payload } = event.data;
    switch (type) {
      case 'update':
        setTabularMsg(payload);
        break;
      case 'tabularInference':
        setTabularLoading(false);
        setTabularMsg('');
        setTabularTime(payload.inferenceTime);
        setTabularInference(payload.results);
        setTabularInferenceSorted(getValuesSorted(payload.results));
        break;
      case 'error':
        setTabularLoading(false);
        console.error(payload);
        setTabularMsg('error occurred: ' + payload.message);
        break;
      default:
        break;
    }
  };

  const textInferenceMessageProcessor = (event: MessageEvent<ModelWebWorkerReceiveMessage>) => {
    const { type, payload } = event.data;
    switch (type) {
      case 'update':
        setTextMsg(payload);
        break;
      case 'textInference':
        setTextLoading(false);
        setTextMsg('');
        setTextTime(payload.inferenceTime);
        setTextInference(payload.results);
        setTextInferenceSorted(getValuesSorted(payload.results));
        break;
      case 'error':
        setTextLoading(false);
        console.error(payload);
        setTextMsg('error occurred: ' + payload.message);
        break;
      default:
        break;
    }
  };

  const imageInferenceMessageProcessor = (event: MessageEvent<ModelWebWorkerReceiveMessage>) => {
    const { type, payload } = event.data;
    switch (type) {
      case 'update':
        setImageMsg(payload);
        break;
      case 'imageInference':
        setImageLoading(false);
        setImageMsg('');
        setImageTime(payload.inferenceTime);
        setImageInference(payload.results);
        setImageInferenceSorted(getValuesSorted(payload.results));
        break;
      case 'error':
        setImageLoading(false);
        console.error(payload);
        setImageMsg('error occurred: ' + payload.message);
        break;
      default:
        break;
    }
  };

  const fusionInferenceMessageProcessor = (event: MessageEvent<ModelWebWorkerReceiveMessage>) => {
    const { type, payload } = event.data;
    switch (type) {
      case 'update':
        setFusionMsg(payload);
        break;
      case 'fusionInference':
        setFusionLoading(false);
        setFusionMsg('');
        setFusionInference(payload.results);
        setFusionInferenceSorted(getValuesSorted(payload.results));
        break;
      case 'error':
        setFusionLoading(false);
        console.error(payload);
        setFusionMsg('error occurred: ' + payload.message);
        break;
      default:
        break;
    }
  };

  const runWorker = useCallback((val: ModelWebWorkerSendMessage) => {
    if (worker.current) {
      sendMessage(worker.current, val);
    }
  }, []);

  const getValuesSorted = (d: InferenceDatum[]) => {
    return sort(d, (a, b) => b.probability - a.probability);
  };

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof schema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
    runImageOnly();
    runTextOnly();
    runTabularOnly();
    setFusionLoading(true);
    setFusionInference(undefined);
    setFusionMsg('Awaiting outputs from base models...');
    setFusionInferenceSorted(undefined);
  }

  // run the fusion model once all inference results are available
  useEffect(() => {
    if (!tabularInference || !textInference || !imageInference) {
      return;
    }

    const values: FusionModelInputs = {
      temperature: form.getValues('temperature'),
      heartrate: form.getValues('heartrate'),
      resprate: form.getValues('resprate'),
      o2sat: form.getValues('o2sat'),
      sbp: form.getValues('sbp'),
      dbp: form.getValues('dbp'),
      pain: form.getValues('pain'),
      acuity: form.getValues('acuity'),
      no_findings_prob_img: imageInference.find((d) => d.label === 'no_finding')!.probability,
      atelectasis_prob_img: imageInference.find((d) => d.label === 'atelectasis')!.probability,
      cardiomegaly_prob_img: imageInference.find((d) => d.label === 'cardiomegaly')!.probability,
      lung_opacity_prob_img: imageInference.find((d) => d.label === 'lung_opacity')!.probability,
      plueral_effusion_prob_img: imageInference.find((d) => d.label === 'pleural_effusion')!.probability,
      no_findings_prob_txt: textInference.find((d) => d.label === 'no_finding')!.probability,
      atelectasis_prob_txt: textInference.find((d) => d.label === 'atelectasis')!.probability,
      cardiomegaly_prob_txt: textInference.find((d) => d.label === 'cardiomegaly')!.probability,
      lung_opacity_prob_txt: textInference.find((d) => d.label === 'lung_opacity')!.probability,
      plueral_effusion_prob_txt: textInference.find((d) => d.label === 'pleural_effusion')!.probability,
    };
    console.log(textInference, imageInference, values);
    runWorker({ type: 'fusion', payload: values });
  }, [textInference, tabularInference, imageInference, form, runWorker]);

  const runTabularOnly = () => {
    const values = {
      temperature: form.getValues('temperature'),
      heartrate: form.getValues('heartrate'),
      resprate: form.getValues('resprate'),
      o2sat: form.getValues('o2sat'),
      sbp: form.getValues('sbp'),
      dbp: form.getValues('dbp'),
      pain: form.getValues('pain'),
      acuity: form.getValues('acuity'),
    };
    setTabularLoading(true);
    setTabularTime(0);
    setTabularInference(undefined);
    setTabularMsg('Running inference...');
    setTabularInferenceSorted(undefined);
    runWorker({ type: 'tabularOnly', payload: values });
  };

  const runTextOnly = () => {
    setTextLoading(true);
    setTextTime(0);
    setTextInference(undefined);
    setTextMsg('Running inference...');
    setTextInferenceSorted(undefined);
    runWorker({ type: 'textOnly', payload: form.getValues('notes') });
  };

  const runImageOnly = () => {
    if (!selectedImage) {
      return;
    }
    setImageLoading(true);
    setImageTime(0);
    setImageInference(undefined);
    setImageMsg('Running inference...');
    setImageInferenceSorted(undefined);
    runWorker({ type: 'imageOnly', payload: selectedImage });
  };

  const tabularInput = ({
    control,
    fieldname,
    name,
    description,
    placeholder,
  }: {
    control: typeof form.control;
    fieldname: 'notes' | 'temperature' | 'heartrate' | 'resprate' | 'o2sat' | 'sbp' | 'dbp' | 'pain' | 'acuity';
    name: string;
    description?: string;
    placeholder: string;
  }) => (
    <FormField
      control={control}
      name={fieldname}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex gap-2 items-center">
            {name}
            {description && (
              <Tooltip>
                <TooltipTrigger className="inline-block">
                  <InfoIcon size={16} />
                </TooltipTrigger>
                <TooltipContent>
                  <FormDescription>{description}</FormDescription>
                </TooltipContent>
              </Tooltip>
            )}
          </FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              {...field}
              type="number"
              inputMode="decimal"
              className="[appearance:textfield] w-24"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <>
      <Card className="w-auto">
        <CardHeader>
          <CardTitle>MedFusion Analytics Demo</CardTitle>
          <CardDescription>
            Input some data and the AI model will predict one of five possible outcomes (atelectasis, cardiomegaly,
            pleural effusion, lung opacity, or no finding).
          </CardDescription>
          <CardDescription>
            Load preset:
            <Button variant="ghost" onClick={() => loadPreset(0)}>
              A
            </Button>
            <Button variant="ghost" onClick={() => loadPreset(1)}>
              B
            </Button>
            <Button variant="ghost" onClick={() => loadPreset(2)}>
              C
            </Button>
            <Button variant="ghost" onClick={() => loadPreset(3)}>
              D
            </Button>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <TooltipProvider delayDuration={0}>
                <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-2">
                  {tabularInput({
                    control: form.control,
                    fieldname: 'temperature',
                    name: 'Temperature ºF',
                    placeholder: '98.5',
                  })}
                  {tabularInput({
                    control: form.control,
                    fieldname: 'heartrate',
                    name: 'Heart Rate (BPM)',
                    placeholder: '85',
                  })}
                  {tabularInput({
                    control: form.control,
                    fieldname: 'resprate',
                    name: 'Respiratory Rate (BPM)',
                    description: "Patient's respiratory rate in breaths per minute",
                    placeholder: '18',
                  })}
                  {tabularInput({
                    control: form.control,
                    fieldname: 'o2sat',
                    name: 'O2 Saturation (%)',
                    description: "Patient's oxygen saturation in percentage (peripheral)",
                    placeholder: '98',
                  })}
                  {tabularInput({
                    control: form.control,
                    fieldname: 'sbp',
                    name: 'Systolic Blood Pressure (mmHg)',
                    description: "Patient's systolic blood pressure",
                    placeholder: '132',
                  })}
                  {tabularInput({
                    control: form.control,
                    fieldname: 'dbp',
                    name: 'Diastolic Blood Pressure (mmHg)',
                    description: "Patient's diastolic blood pressure",
                    placeholder: '73',
                  })}
                  {tabularInput({
                    control: form.control,
                    fieldname: 'pain',
                    name: 'Pain (0-10)',
                    description: "Patient's pain level from 0 to 10",
                    placeholder: '0',
                  })}
                  {tabularInput({
                    control: form.control,
                    fieldname: 'acuity',
                    name: 'Acuity (1-5)',
                    description: "Patient's acuity level from 1 to 5",
                    placeholder: '2',
                  })}
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="The patient entered with..." className="resize-y" rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chest xray image</FormLabel>
                      <FormControl>
                        <Input className="resize-none" type="file" {...fileRef} />
                      </FormControl>
                      <FormMessage />
                      {selectedImage && (
                        <Image
                          src={selectedImage as string}
                          alt="Selected image"
                          width={200}
                          height={200}
                          onClick={() => window.open(selectedImage)}
                          className="cursor-pointer"
                        />
                      )}
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit">Run</Button>
                  <Button type="button" onClick={runTabularOnly} className="hidden">
                    Run Tabular Only
                  </Button>
                  <Button type="button" onClick={runTextOnly} className="hidden">
                    Run Text Only
                  </Button>
                  <Button type="button" onClick={runImageOnly} className="hidden">
                    Run Image Only
                  </Button>
                </div>
              </TooltipProvider>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="mt-2">
        <CardHeader>
          <CardTitle>Fusion Inference</CardTitle>
          <CardDescription>Inference results of the fusion model.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            {!fusionInference && <p className="mt-4">Try running the demo!</p>}

            {fusionLoading && <Spinner />}
            {fusionMsg && <div className="mx-auto block w-max">{fusionMsg}</div>}
            {fusionInferenceSorted && (
              <>
                <br />
                <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Results</h4>
                <p>
                  The model predicts that among the possible findings, the patient has &quot;
                  {categoryToName[fusionInferenceSorted[0].label]}&quot; with a relative probability of{' '}
                  {(fusionInferenceSorted[0].probability * 100).toFixed(1)}%. The other finding predictions are as
                  follows:{' '}
                  {fusionInferenceSorted
                    .slice(1)
                    .map((d) => `${categoryToName[d.label]} (${(d.probability * 100).toFixed(1)}%)`)
                    .join(', ')}
                </p>
              </>
            )}
            {fusionInference && fusionInferenceSorted && (
              <>
                <br />
                <Chart data={fusionInference} type="probability" />
                <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">How to interpret this</h4>
                <p>
                  From the given inputs, the model has predicted that patient has &quot;
                  {categoryToName[fusionInferenceSorted[0].label]}.&quot; However the model was only trained on five
                  possible outcomes and with a limited dataset, so the results may not be accurate.
                  {fusionInferenceSorted[0].probability < 0.6 && (
                    <>
                      {' '}
                      Importantly, the model is not very confident in this prediction. In an actual clinical setting,
                      the model should only display the top output based on a determined threshold of likelihood,
                      however for the purposes of this demo, we are showing all results.
                    </>
                  )}
                </p>
                <br />
                <p>
                  It should also be noted here that the &quot;likelihood&quot; is not a true likelihood of the patient
                  having this condition, but a relative likelihood compared to the other findings. Similarly, &quot;no
                  findings&quot; is not a true negative, but scenario where the model could not match the patient&apos;s
                  symptoms to any of the possible findings.
                </p>
              </>
            )}
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">How it works</h4>
            <p>
              The fusion model derives its inputs from the base models below, taking its results and feeding it into a
              classifier to determine most likely results. Across all of our available data, the fusion model performed
              the best, returning the most predicted findings matching the real findings. To read more about how it
              works and how we developed it, you can reach the{' '}
              <Link href="/docs/models/fusion">fusion model documentation</Link>.
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="mt-2">
        <Tabs defaultValue="tabular" className="w-auto">
          <TabsList className="grid w-auto grid-cols-3 mx-6 mt-6">
            <TabsTrigger value="tabular">Tabular</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>
          <TabsContent value="tabular">
            <CardHeader>
              <CardTitle>Tabular Inference</CardTitle>
              <CardDescription>Inference results of the tabular data only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                {!tabularInference && <p className="mt-4">Try running the demo!</p>}

                {tabularLoading && <Spinner />}
                {tabularMsg && <div className="mx-auto block w-max">{tabularMsg}</div>}
                {tabularTime > 0 && <div className="text-sm hidden">Time taken: {tabularTime}s</div>}
                {tabularInferenceSorted && (
                  <>
                    <br />
                    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Results</h4>
                    <p>
                      The model predicts that among the possible findings, the patient has &quot;
                      {categoryToName[tabularInferenceSorted[0].label]}&quot; with a relative probability of{' '}
                      {(tabularInferenceSorted[0].probability * 100).toFixed(1)}%. The other finding predictions are as{' '}
                      follows:{' '}
                      {tabularInferenceSorted
                        .slice(1)
                        .map((d) => `${categoryToName[d.label]} (${(d.probability * 100).toFixed(1)}%)`)
                        .join(', ')}
                    </p>
                  </>
                )}
                {tabularInference && tabularInferenceSorted && (
                  <>
                    <br />
                    <Chart data={tabularInference} type="probability" />
                    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">How to interpret this</h4>
                    <p>
                      From the given inputs, the model has predicted that patient has &quot;
                      {categoryToName[tabularInferenceSorted[0].label]}.&quot; However the model was only trained on
                      five possible outcomes and with a limited dataset, so the results may not be accurate.
                      {tabularInferenceSorted[0].probability < 0.6 && (
                        <>
                          {' '}
                          Importantly, the model is not very confident in this prediction. In an actual clinical
                          setting, the model should only display the top output based on a determined threshold of
                          likelihood, however for the purposes of this demo, we are showing all results. For similar
                          reasons, the output of a base model would normally not be shown.
                        </>
                      )}
                    </p>
                    <br />
                    <p>
                      As a tabular model trained on only eight inputs, attempting to determine five possible outcomes,
                      this model is not very accurate. In a clinical setting, the model would be trained on hundreds of
                      inputs and thousands of samples, improving its accuracy. However, for the purposes of this demo,
                      we are showing the results of the model. At best, this model would probably only determine if the
                      patient&apos;s condition deviate from the norm, warranting further investigation. It is with this
                      mindset we included it as part of the fusion model so that it could possibly provide additional
                      information to the overall prediction.
                    </p>
                  </>
                )}
                <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">How it works</h4>
                <p>
                  The tabular model takes the tabular data that has been inputed (temperature, heartrate, etc.) and
                  attempts to classify into one of five possible options. In a proper setting, this would be tens to
                  hundreds of inputs that could be taken it, improving the models ability to predict a class, however
                  due to a limitation of data, we only have these inputs. To read more about the tabular model, see the{' '}
                  <Link href="/docs/models/tabular">tabular model documentation</Link>.
                </p>
              </div>
            </CardContent>
          </TabsContent>
          <TabsContent value="text">
            <CardHeader>
              <CardTitle>Text Inference</CardTitle>
              <CardDescription>Inference results of the text data only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                {!textInference && <p className="mt-4">Try running the demo!</p>}

                {textLoading && <Spinner />}
                {textMsg && <div className="mx-auto block w-max">{textMsg}</div>}
                {textTime > 0 && <div className="text-sm hidden">Time taken: {textTime}s</div>}
                {textInferenceSorted && (
                  <>
                    <br />
                    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Results</h4>
                    <p>
                      The model predicts that among the possible findings, the patient has &quot;
                      {categoryToName[textInferenceSorted[0].label]}&quot; with a relative probability of{' '}
                      {(textInferenceSorted[0].probability * 100).toFixed(1)}%. The other finding predictions are as{' '}
                      follows:{' '}
                      {textInferenceSorted
                        .slice(1)
                        .map((d) => `${categoryToName[d.label]} (${(d.probability * 100).toFixed(1)}%)`)
                        .join(', ')}
                    </p>
                  </>
                )}
                {textInference && textInferenceSorted && (
                  <>
                    <br />
                    <Chart data={textInference} type="probability" />
                    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">How to interpret this</h4>
                    <p>
                      From the given inputs, the model has predicted that patient has &quot;
                      {categoryToName[textInferenceSorted[0].label]}.&quot; However the model was only trained on five
                      possible outcomes and with a limited dataset, so the results may not be accurate.
                      {textInferenceSorted[0].probability < 0.6 && (
                        <>
                          {' '}
                          Importantly, the model is not very confident in this prediction. In an actual clinical
                          setting, the model should only display the top output based on a determined threshold of
                          likelihood, however for the purposes of this demo, we are showing all results. For similar
                          reasons, the output of a base model would normally not be shown.
                        </>
                      )}
                    </p>
                    <br />
                    <p>
                      It should also be noted here that the &quot;likelihood&quot; is not a true likelihood of the
                      patient having this condition, but a relative likelihood compared to the other findings.
                      Similarly, &quot;no findings&quot; is not a true negative, but scenario where the model could not
                      match the patient&apos;s symptoms to any of the possible findings.
                    </p>
                  </>
                )}
                <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">How it works</h4>
                <p>
                  The text model takes in the input from the notes, processed via a modified BioClinical Bert model. The
                  model is trained on clinician notes describing the patient&apos;s present history of illness, with the
                  expectation that it will learn the symptoms of the four possible options, and no findings if it cannot
                  be determined. To read more about how it works and how we developed it, you can reach the{' '}
                  <Link href="/docs/models/text">text model documentation</Link>.
                </p>
              </div>
            </CardContent>
          </TabsContent>
          <TabsContent value="image">
            <CardHeader>
              <CardTitle>Image Inference</CardTitle>
              <CardDescription>Inference results of the image only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                {!imageInference && <p className="mt-4">Try running the demo!</p>}

                {imageLoading && <Spinner />}
                {imageMsg && <div className="mx-auto block w-max">{imageMsg}</div>}
                {imageTime > 0 && <div className="text-sm hidden">Time taken: {imageTime}s</div>}
                {imageInferenceSorted && (
                  <>
                    <br />
                    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Results</h4>
                    <p>
                      The model predicts that among the possible findings, the patient has &quot;
                      {categoryToName[imageInferenceSorted[0].label]}&quot; with a relative probability of{' '}
                      {(imageInferenceSorted[0].probability * 100).toFixed(1)}%. The other finding predictions are as{' '}
                      follows:{' '}
                      {imageInferenceSorted
                        .slice(1)
                        .map((d) => `${categoryToName[d.label]} (${(d.probability * 100).toFixed(1)}%)`)
                        .join(', ')}
                    </p>
                  </>
                )}
                {imageInference && imageInferenceSorted && (
                  <>
                    <br />
                    <Chart data={imageInference} type="probability" />
                    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">How to interpret this</h4>
                    <p>
                      From the given inputs, the model has predicted that patient has &quot;
                      {categoryToName[imageInferenceSorted[0].label]}.&quot; However the model was only trained on five
                      possible outcomes and with a limited dataset, so the results may not be accurate.
                      {imageInferenceSorted[0].probability < 0.6 && (
                        <>
                          {' '}
                          Importantly, the model is not very confident in this prediction. In an actual clinical
                          setting, the model should only display the top output based on a determined threshold of
                          likelihood, however for the purposes of this demo, we are showing all results. For similar
                          reasons, the output of a base model would normally not be shown.
                        </>
                      )}
                    </p>
                    <br />
                    <p>
                      It should also be noted here that the &quot;likelihood&quot; is not a true likelihood of the
                      patient having this condition, but a relative likelihood compared to the other findings.
                      Similarly, &quot;no findings&quot; is not a true negative, but scenario where the model could not
                      match the patient&apos;s symptoms to any of the possible findings.
                    </p>
                  </>
                )}
                <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">How it works</h4>
                <p>
                  The image model utilizes chest xrays, preprocessed into a lower resolution. It utilizes EfficientNet
                  image classification, resulting in an extremely powerful classification model. To read more about how
                  it works and how we developed it, you can reach the{' '}
                  <Link href="/docs/models/image">image model documentation</Link>.
                </p>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </>
  );
}
