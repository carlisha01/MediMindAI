import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Send, Sparkles, Loader2, FileText, Network, Table, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VisualSummaryDisplay } from "@/components/visual-summary-display";
import type { QaHistory, Subject, VisualSummary } from "@shared/schema";

interface QaMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function Study() {
  const [question, setQuestion] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const { toast } = useToast();

  const { data: history, isLoading: historyLoading } = useQuery<QaHistory[]>({
    queryKey: ["/api/qa/history"],
  });

  const { data: suggestedData, isLoading: suggestionsLoading } = useQuery<{ questions: string[] }>({
    queryKey: ["/api/qa/suggested-questions"],
  });

  const { data: subjects, isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: visualSummaries, isLoading: summariesLoading } = useQuery<VisualSummary[]>({
    queryKey: ["/api/visual-summaries"],
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async (data: { subjectId: string; summaryType: string }) => {
      const response = await apiRequest("POST", "/api/visual-summaries/generate", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visual-summaries"] });
      toast({
        title: "Resum generat",
        description: "El resum visual s'ha creat correctament",
      });
    },
    onError: (error: Error) => {
      console.error("Generate summary error:", error);
      toast({
        title: "Error",
        description: error.message || "No s'ha pogut generar el resum. Assegura't que has pujat documents per a aquesta assignatura.",
        variant: "destructive",
      });
    },
  });

  const askQuestionMutation = useMutation({
    mutationFn: async (data: { question: string; language: string }) => {
      const response = await apiRequest("POST", "/api/qa/ask", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qa/history"] });
      setQuestion("");
    },
    onError: (error) => {
      console.error("Q&A mutation error:", error);
      toast({
        title: "Error",
        description: "No s'ha pogut processar la pregunta. Torna-ho a provar.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    askQuestionMutation.mutate({
      question: question.trim(),
      language: "ca", // Always Catalan
    });
  };

  const suggestedQuestions = suggestedData?.questions || [];

  const messages: QaMessage[] = history?.map((item) => [
    {
      role: "user" as const,
      content: item.question,
      timestamp: new Date(item.askedAt).toISOString(),
    },
    {
      role: "assistant" as const,
      content: item.answer,
      timestamp: new Date(item.askedAt).toISOString(),
    },
  ]).flat() || [];

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-3xl font-semibold">Assistent d'Estudi IA</h1>
        <p className="text-muted-foreground mt-1">
          Fes preguntes sobre els teus materials i rep explicacions guiades en català
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversa
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 gap-4">
              <ScrollArea className="flex-1 pr-4">
                {historyLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex gap-3",
                          message.role === "user" ? "justify-end" : "justify-start"
                        )}
                        data-testid={`message-${index}`}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg p-4",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={cn(
                            "text-xs mt-2",
                            message.role === "user"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}>
                            {new Date(message.timestamp).toLocaleTimeString("ca-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {askQuestionMutation.isPending && (
                      <div className="flex gap-3 justify-start">
                        <div className="max-w-[80%] rounded-lg p-4 bg-muted">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <p className="text-sm">Pensant...</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Comença una conversa</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md">
                      Fes qualsevol pregunta sobre els teus materials d'estudi i rebràs explicacions detallades
                    </p>
                  </div>
                )}
              </ScrollArea>

              <form onSubmit={handleSubmit} className="flex-shrink-0">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Escriu la teva pregunta aquí..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="min-h-[60px] resize-none"
                    data-testid="input-question"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={!question.trim() || askQuestionMutation.isPending}
                    size="icon"
                    className="h-[60px] w-[60px] flex-shrink-0"
                    data-testid="button-send-question"
                  >
                    {askQuestionMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preguntes Suggerides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : suggestedQuestions.length > 0 ? (
                suggestedQuestions.map((q, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4 whitespace-normal"
                    onClick={() => setQuestion(q)}
                    data-testid={`button-suggested-${index}`}
                  >
                    <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{q}</span>
                  </Button>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Puja documents per obtenir preguntes personalitzades
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resums Visuals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="flex-1" data-testid="select-subject-visual">
                    <SelectValue placeholder="Selecciona assignatura..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects?.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id} data-testid={`option-subject-${subject.id}`}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Tabs defaultValue="flowcharts" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="flowcharts" className="text-xs" data-testid="tab-flowcharts">
                    <Network className="h-3 w-3 mr-1" />
                    Esquemes
                  </TabsTrigger>
                  <TabsTrigger value="maps" className="text-xs" data-testid="tab-maps">
                    <FileText className="h-3 w-3 mr-1" />
                    Mapes
                  </TabsTrigger>
                  <TabsTrigger value="tables" className="text-xs" data-testid="tab-tables">
                    <Table className="h-3 w-3 mr-1" />
                    Taules
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="flowcharts" className="mt-4 space-y-4" data-testid="content-flowcharts">
                  {selectedSubject && (
                    <Button
                      onClick={() => generateSummaryMutation.mutate({ subjectId: selectedSubject, summaryType: "flowchart" })}
                      disabled={generateSummaryMutation.isPending}
                      className="w-full"
                      data-testid="button-generate-flowchart"
                    >
                      {generateSummaryMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4 mr-2" />
                      )}
                      Generar Esquema
                    </Button>
                  )}
                  {summariesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : visualSummaries?.filter(s => s.summaryType === "flowchart" && (!selectedSubject || s.subjectId === selectedSubject)).length ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {visualSummaries
                          .filter(s => s.summaryType === "flowchart" && (!selectedSubject || s.subjectId === selectedSubject))
                          .map((summary) => (
                            <div key={summary.id} className="space-y-2" data-testid={`flowchart-${summary.id}`}>
                              <h4 className="text-sm font-medium">{summary.title}</h4>
                              <VisualSummaryDisplay summary={summary} />
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      {selectedSubject ? "Clica 'Generar Esquema' per crear un diagrama" : "Selecciona una assignatura per començar"}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="maps" className="mt-4 space-y-4" data-testid="content-maps">
                  {selectedSubject && (
                    <Button
                      onClick={() => generateSummaryMutation.mutate({ subjectId: selectedSubject, summaryType: "concept_map" })}
                      disabled={generateSummaryMutation.isPending}
                      className="w-full"
                      data-testid="button-generate-concept-map"
                    >
                      {generateSummaryMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4 mr-2" />
                      )}
                      Generar Mapa Conceptual
                    </Button>
                  )}
                  {summariesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : visualSummaries?.filter(s => s.summaryType === "concept_map" && (!selectedSubject || s.subjectId === selectedSubject)).length ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {visualSummaries
                          .filter(s => s.summaryType === "concept_map" && (!selectedSubject || s.subjectId === selectedSubject))
                          .map((summary) => (
                            <div key={summary.id} className="space-y-2" data-testid={`concept-map-${summary.id}`}>
                              <h4 className="text-sm font-medium">{summary.title}</h4>
                              <VisualSummaryDisplay summary={summary} />
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      {selectedSubject ? "Clica 'Generar Mapa Conceptual' per crear un diagrama" : "Selecciona una assignatura per començar"}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="tables" className="mt-4 space-y-4" data-testid="content-tables">
                  {selectedSubject && (
                    <Button
                      onClick={() => generateSummaryMutation.mutate({ subjectId: selectedSubject, summaryType: "comparison_table" })}
                      disabled={generateSummaryMutation.isPending}
                      className="w-full"
                      data-testid="button-generate-comparison-table"
                    >
                      {generateSummaryMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4 mr-2" />
                      )}
                      Generar Taula Comparativa
                    </Button>
                  )}
                  {summariesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : visualSummaries?.filter(s => s.summaryType === "comparison_table" && (!selectedSubject || s.subjectId === selectedSubject)).length ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {visualSummaries
                          .filter(s => s.summaryType === "comparison_table" && (!selectedSubject || s.subjectId === selectedSubject))
                          .map((summary) => (
                            <div key={summary.id} className="space-y-2" data-testid={`comparison-table-${summary.id}`}>
                              <h4 className="text-sm font-medium">{summary.title}</h4>
                              <VisualSummaryDisplay summary={summary} />
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      {selectedSubject ? "Clica 'Generar Taula Comparativa' per crear una taula" : "Selecciona una assignatura per començar"}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
