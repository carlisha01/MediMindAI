
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Link2, Users, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Collaboration() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://medstudy.app/share/abc123");
    setCopied(true);
    toast({
      title: "Enllaç copiat",
      description: "L'enllaç s'ha copiat al porta-retalls",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Col·laboració</h1>
        <p className="text-muted-foreground mt-2">
          Comparteix recursos i col·labora amb altres estudiants
        </p>
      </div>

      <Tabs defaultValue="share" className="space-y-4">
        <TabsList>
          <TabsTrigger value="share" data-testid="tab-share">
            <Share2 className="h-4 w-4 mr-2" />
            Compartir
          </TabsTrigger>
          <TabsTrigger value="groups" data-testid="tab-groups">
            <Users className="h-4 w-4 mr-2" />
            Grups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="share" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compartir Documents</CardTitle>
              <CardDescription>
                Genera enllaços per compartir els teus documents amb companys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-select">Selecciona Document</Label>
                <select
                  id="document-select"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2"
                  data-testid="select-document"
                >
                  <option>Test Arrítmies</option>
                  <option>Taules Dermatologia</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="access-type">Tipus d'Accés</Label>
                <select
                  id="access-type"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2"
                  data-testid="select-access-type"
                >
                  <option>Només visualització</option>
                  <option>Pot descarregar</option>
                  <option>Pot comentar</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Input
                  value="https://medstudy.app/share/abc123"
                  readOnly
                  className="font-mono text-sm"
                  data-testid="input-share-link"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="icon"
                  data-testid="button-copy-link"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <Button className="w-full" data-testid="button-generate-link">
                <Link2 className="h-4 w-4 mr-2" />
                Generar Nou Enllaç
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enllaços Actius</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">Test Arrítmies</p>
                    <p className="text-sm text-muted-foreground">3 accessos · Expira en 7 dies</p>
                  </div>
                  <Badge>Actiu</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grups d'Estudi</CardTitle>
              <CardDescription>
                Crea i gestiona grups per col·laborar amb companys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Nom del Grup</Label>
                <Input
                  id="group-name"
                  placeholder="Ex: Cardiologia 4t any"
                  data-testid="input-group-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-description">Descripció</Label>
                <Textarea
                  id="group-description"
                  placeholder="Descriu el propòsit del grup..."
                  data-testid="textarea-group-description"
                />
              </div>

              <Button className="w-full" data-testid="button-create-group">
                <Users className="h-4 w-4 mr-2" />
                Crear Grup
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
