import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2, BookOpen, RefreshCw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Subject, McqQuestion } from "@shared/schema";

export default function McqTest() {
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [attemptResult, setAttemptResult] = useState<{
    isCorrect: boolean;
    correctAnswer: number;
    explanation: string;
  } | null>(null);
  const [score, setScore] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState(0);
  const { toast } = useToast();

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<McqQuestion[]>({
    queryKey: ["/api/mcq/questions", selectedSubject],
    enabled: !!selectedSubject,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { subjectId: string; count: number }) => {
      const response = await apiRequest("POST", "/api/mcq/generate", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mcq/questions", selectedSubject] });
      toast({
        title: "Preguntes generades",
        description: "S'han generat noves preguntes MCQ per a aquesta assignatura",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'han pogut generar les preguntes. Torna-ho a provar.",
        variant: "destructive",
      });
    },
  });

  const attemptMutation = useMutation({
    mutationFn: async (data: { questionId: string; selectedAnswer: number }) => {
      const response = await apiRequest("POST", "/api/mcq/attempt", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setAttemptResult({
        isCorrect: data.isCorrect,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
      });
      setShowResult(true);
      setCompletedQuestions(prev => prev + 1);
      if (data.isCorrect) {
        setScore(prev => prev + 1);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No s'ha pogut registrar la resposta. Torna-ho a provar.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateQuestions = () => {
    if (!selectedSubject) return;
    generateMutation.mutate({ subjectId: selectedSubject, count: 5 });
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null || !questions || !questions[currentQuestionIndex]) return;

    attemptMutation.mutate({
      questionId: questions[currentQuestionIndex].id,
      selectedAnswer,
    });
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setAttemptResult(null);
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAttemptResult(null);
    setScore(0);
    setCompletedQuestions(0);
  };

  const currentQuestion = questions?.[currentQuestionIndex];
  const isLastQuestion = questions && currentQuestionIndex === questions.length - 1;
  const hasQuestions = questions && questions.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Tests MCQ</h1>
        <p className="text-muted-foreground mt-1">
          Practica amb preguntes de resposta múltiple basades en els teus documents
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {hasQuestions && completedQuestions < (questions?.length || 0)
                    ? `Pregunta ${currentQuestionIndex + 1} de ${questions?.length}`
                    : "Selecciona una assignatura"}
                </CardTitle>
                {hasQuestions && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Encerts: {score}/{completedQuestions}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRestart}
                      data-testid="button-restart-test"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reiniciar
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedSubject ? (
                <div className="text-center py-12">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4 mx-auto">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Comença un test</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecciona una assignatura per començar a practicar
                  </p>
                </div>
              ) : questionsLoading || generateMutation.isPending ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {generateMutation.isPending ? "Generant preguntes..." : "Carregant..."}
                  </p>
                </div>
              ) : !hasQuestions ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground mb-4">
                    No hi ha preguntes disponibles per aquesta assignatura
                  </p>
                  <Button onClick={handleGenerateQuestions} data-testid="button-generate-questions">
                    Generar Preguntes
                  </Button>
                </div>
              ) : completedQuestions >= (questions?.length || 0) ? (
                <div className="text-center py-12">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-chart-3/10 mb-4 mx-auto">
                    <CheckCircle2 className="h-8 w-8 text-chart-3" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Test completat!</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Has respost {score} de {questions?.length} preguntes correctament
                  </p>
                  <p className="text-2xl font-bold text-primary mb-6">
                    {Math.round((score / (questions?.length || 1)) * 100)}%
                  </p>
                  <Button onClick={handleRestart} data-testid="button-restart-completed">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tornar a començar
                  </Button>
                </div>
              ) : currentQuestion ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="secondary">
                        {currentQuestion.difficulty === "easy" ? "Fàcil" :
                         currentQuestion.difficulty === "hard" ? "Difícil" : "Mitjana"}
                      </Badge>
                      <Progress
                        value={(completedQuestions / (questions?.length || 1)) * 100}
                        className="flex-1"
                      />
                    </div>
                    <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>
                  </div>

                  <div className="space-y-2">
                    {currentQuestion.options.map((option: string, index: number) => {
                      const isSelected = selectedAnswer === index;
                      const isCorrect = attemptResult && index === attemptResult.correctAnswer;
                      const isWrong = attemptResult && isSelected && !attemptResult.isCorrect;

                      return (
                        <Button
                          key={index}
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left h-auto py-4 px-4 whitespace-normal",
                            isSelected && !showResult && "border-primary bg-primary/5",
                            isCorrect && showResult && "border-chart-3 bg-chart-3/10",
                            isWrong && showResult && "border-destructive bg-destructive/10"
                          )}
                          onClick={() => !showResult && setSelectedAnswer(index)}
                          disabled={showResult}
                          data-testid={`button-option-${index}`}
                        >
                          <span className="flex items-center gap-3 w-full">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium">
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="flex-1">{option}</span>
                            {showResult && isCorrect && (
                              <CheckCircle2 className="h-5 w-5 text-chart-3 flex-shrink-0" />
                            )}
                            {showResult && isWrong && (
                              <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                            )}
                          </span>
                        </Button>
                      );
                    })}
                  </div>

                  {showResult && attemptResult && (
                    <Card className={cn(
                      "border-2",
                      attemptResult.isCorrect ? "border-chart-3" : "border-destructive"
                    )}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3 mb-3">
                          {attemptResult.isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-chart-3 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-medium mb-2">
                              {attemptResult.isCorrect ? "Correcte!" : "Incorrecte"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {attemptResult.explanation}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-end">
                    {!showResult ? (
                      <Button
                        onClick={handleAnswerSubmit}
                        disabled={selectedAnswer === null || attemptMutation.isPending}
                        data-testid="button-submit-answer"
                      >
                        {attemptMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Comprovant...
                          </>
                        ) : (
                          "Confirmar Resposta"
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNextQuestion}
                        disabled={isLastQuestion}
                        data-testid="button-next-question"
                      >
                        {isLastQuestion ? "Test Completat" : "Següent Pregunta"}
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assignatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedSubject} onValueChange={(value) => {
                setSelectedSubject(value);
                handleRestart();
              }}>
                <SelectTrigger data-testid="select-subject">
                  <SelectValue placeholder="Selecciona assignatura" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id} data-testid={`select-item-subject-${subject.id}`}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedSubject && hasQuestions && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progrés</span>
                    <span className="font-medium">
                      {completedQuestions}/{questions?.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Encerts</span>
                    <span className="font-medium text-chart-3">{score}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Percentatge</span>
                    <span className="font-medium">
                      {completedQuestions > 0
                        ? Math.round((score / completedQuestions) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
