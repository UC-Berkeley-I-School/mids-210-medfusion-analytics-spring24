import * as React from 'react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Separator } from './ui/separator';

export function Demo() {
  return (
    <>
      <Card className="w-auto">
        <CardHeader>
          <CardTitle>input form</CardTitle>
          <CardDescription>Deploy your new project in one-click.</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="inputs" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="framework">Framework</Label>
                more inputs
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button>Run</Button>
        </CardFooter>
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
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Aut aliquam optio neque officiis?
                Exercitationem, doloribus explicabo quasi nihil sit dolore est. Inventore, ad? Maiores itaque dolorum
                et. Deserunt, eius soluta.
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
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Aut aliquam optio neque officiis?
                Exercitationem, doloribus explicabo quasi nihil sit dolore est. Inventore, ad? Maiores itaque dolorum
                et. Deserunt, eius soluta.
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
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Aut aliquam optio neque officiis?
                Exercitationem, doloribus explicabo quasi nihil sit dolore est. Inventore, ad? Maiores itaque dolorum
                et. Deserunt, eius soluta.
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
      <Card className="mt-2">
        <CardHeader>
          <CardTitle>Late Fusion Inference</CardTitle>
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
      <Card className="mt-2">
        <CardHeader>
          <CardTitle>Early Fusion Inference</CardTitle>
          <CardDescription>Inference results of the early fusion model.</CardDescription>
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
