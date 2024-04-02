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
import { ModelWebWorkerReceiveMessage, ModelWebWorkerSendMessage } from '@/model/worker-types';
import Chart from './chart';
import { sort } from 'd3-array';
import Image from 'next/image';

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
  }

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
    const response = await fetch(preset.image_min_res);
    const data = await response.blob();
    const metadata = response.headers.get('content-type') || 'image/jpeg';
    const image = new File([data], 'preset.jpg', { type: metadata });
    form.setValue('image', [image]);
    setSelectedImage(preset.image_min_res);
  };

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
    runWorker({ type: 'tabularOnly', payload: values });
  };

  const runTextOnly = () => {
    setTextLoading(true);
    setTextTime(0);
    setTextInference(undefined);
    setTextMsg('Running inference...');
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
          <CardTitle>input form</CardTitle>
          <CardDescription>Analyze patient data</CardDescription>
          <CardDescription>
            Load preset:
            <Button variant="ghost" onClick={() => loadPreset(0)}>
              A
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
                  <Button type="submit">run</Button>
                  <Button type="button" onClick={runTabularOnly}>
                    Run Tabular Only
                  </Button>
                  <Button type="button" onClick={runTextOnly}>
                    Run Text Only
                  </Button>
                  <Button type="button" onClick={runImageOnly}>
                    Run Image Only
                  </Button>
                </div>
              </TooltipProvider>
            </form>
          </Form>
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
                {tabularLoading && <Spinner />}
                {tabularMsg && <div className="mx-auto block w-max">{tabularMsg}</div>}
                {tabularTime > 0 && <div className="text-sm">Time taken: {tabularTime}s</div>}
                {tabularInferenceSorted && (
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
                )}
                <br />
                {tabularInference && <Chart data={tabularInference} type="probability" />}
                {/* {tabularInference && <Chart data={tabularInference} type="odds_ratio" />} */}
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
                {textLoading && <Spinner />}
                {textMsg && <div className="mx-auto block w-max">{textMsg}</div>}
                {textTime > 0 && <div className="text-sm">Time taken: {textTime}s</div>}
                {textInferenceSorted && (
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
                )}
                <br />
                {textInference && <Chart data={textInference} type="probability" />}
                {/* {textInference && <Chart data={textInference} type="odds_ratio" />} */}
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
                {imageLoading && <Spinner />}
                {imageMsg && <div className="mx-auto block w-max">{imageMsg}</div>}
                {imageTime > 0 && <div className="text-sm">Time taken: {imageTime}s</div>}
                {imageInferenceSorted && (
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
                )}
                <br />
                {imageInference && <Chart data={imageInference} type="probability" />}
                {/* {imageInference && <Chart data={imageInference} type="odds_ratio" />} */}
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
      <Card className="mt-2">
        <CardHeader>
          <CardTitle>Fusion Inference</CardTitle>
          <CardDescription>Inference results of the late fusion model.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Aut aliquam optio neque officiis? Exercitationem,
            doloribus explicabo quasi nihil sit dolore est. Inventore, ad? Maiores itaque dolorum et. Deserunt, eius
            soluta.
          </div>
        </CardContent>
      </Card>
    </>
  );
}
