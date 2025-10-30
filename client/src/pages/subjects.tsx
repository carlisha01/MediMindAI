import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, Brain, TrendingUp, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import type { Subject } from "@shared/schema";

interface SubjectWithStats extends Subject {
  documentCount: number;
  topicCount: number;
  completedTopics: number;
  progress: number;
}

export default function Subjects() {
  const { data: subjects, isLoading } = useQuery<SubjectWithStats[]>({
    queryKey: ["/api/subjects/stats"],
  });

  const getSubjectIcon = (iconName: string) => {
    return iconName || "BookOpen";
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Assignatures</h1>
        <p className="text-muted-foreground mt-1">
          Explora i estudia per assignatura mèdica
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : subjects && subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <Card
              key={subject.id}
              className="hover-elevate transition-all"
              data-testid={`subject-card-${subject.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${subject.color}20` }}
                    >
                      <BookOpen className="h-6 w-6" style={{ color: subject.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      {subject.description && (
                        <CardDescription className="text-xs mt-1">
                          {subject.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progrés</span>
                    <span className="font-medium">{subject.progress}%</span>
                  </div>
                  <Progress value={subject.progress} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/50">
                    <FileText className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-lg font-semibold">{subject.documentCount}</span>
                    <span className="text-xs text-muted-foreground">Docs</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/50">
                    <Brain className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-lg font-semibold">{subject.topicCount}</span>
                    <span className="text-xs text-muted-foreground">Temes</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/50">
                    <TrendingUp className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-lg font-semibold">{subject.completedTopics}</span>
                    <span className="text-xs text-muted-foreground">Fets</span>
                  </div>
                </div>

                <Link href={`/subjects/${subject.id}`}>
                  <Button className="w-full" data-testid={`button-study-${subject.id}`}>
                    Estudiar
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hi ha assignatures disponibles</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Les assignatures es crearan automàticament quan pugis documents. La IA classificarà el contingut per assignatura mèdica.
            </p>
            <Link href="/documents">
              <Button data-testid="button-upload-documents">
                <FileText className="h-4 w-4 mr-2" />
                Anar a Documents
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
