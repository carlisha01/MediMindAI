import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Calendar, CheckCircle2, Clock, Target, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Subject, Topic } from "@shared/schema";

interface ProgressStats {
  overallProgress: number;
  totalTopics: number;
  completedTopics: number;
  studyStreak: number;
  totalStudyTime: number;
}

interface SubjectProgress {
  subject: Subject;
  totalTopics: number;
  completedTopics: number;
  progress: number;
  topics: Array<{
    topic: Topic;
    completed: boolean;
    reviewCount: number;
  }>;
}

export default function ProgressPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<ProgressStats>({
    queryKey: ["/api/progress/stats"],
  });

  const { data: subjectProgress, isLoading: subjectsLoading } = useQuery<SubjectProgress[]>({
    queryKey: ["/api/progress/subjects"],
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">El Meu Progrés</h1>
        <p className="text-muted-foreground mt-1">
          Segueix el teu avenç i assoliments en l'estudi
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="space-y-0 pb-2">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardHeader>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card data-testid="card-overall-progress">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progrés Global</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold" data-testid="text-overall-progress">
                  {stats?.overallProgress || 0}%
                </div>
                <Progress value={stats?.overallProgress || 0} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card data-testid="card-completed-topics">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Temes Completats</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-3/10">
                  <CheckCircle2 className="h-4 w-4 text-chart-3" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold" data-testid="text-completed-topics">
                  {stats?.completedTopics || 0} / {stats?.totalTopics || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Temes estudiats
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-study-streak">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ratxa d'Estudi</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-5/10">
                  <Calendar className="h-4 w-4 text-chart-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold" data-testid="text-study-streak">
                  {stats?.studyStreak || 0} dies
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Consecutius estudiant
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-time">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Temps Total</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-4/10">
                  <Clock className="h-4 w-4 text-chart-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold" data-testid="text-total-time">
                  {formatTime(stats?.totalStudyTime || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  D'estudi acumulat
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progrés per Assignatura</CardTitle>
        </CardHeader>
        <CardContent>
          {subjectsLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-2 w-full" />
                  <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : subjectProgress && subjectProgress.length > 0 ? (
            <Tabs defaultValue={subjectProgress[0]?.subject.id} className="w-full">
              <TabsList className="w-full justify-start flex-wrap h-auto gap-2">
                {subjectProgress.map((sp) => (
                  <TabsTrigger
                    key={sp.subject.id}
                    value={sp.subject.id}
                    data-testid={`tab-subject-${sp.subject.id}`}
                  >
                    {sp.subject.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {subjectProgress.map((sp) => (
                <TabsContent key={sp.subject.id} value={sp.subject.id} className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{sp.subject.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {sp.completedTopics} de {sp.totalTopics} temes completats
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold">{sp.progress}%</div>
                      <p className="text-xs text-muted-foreground">Completat</p>
                    </div>
                  </div>
                  
                  <Progress value={sp.progress} className="h-3" />

                  <div className="space-y-2 mt-6">
                    <h4 className="text-sm font-medium mb-3">Temes</h4>
                    {sp.topics.map((topicItem, index) => (
                      <div
                        key={topicItem.topic.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                        data-testid={`topic-${topicItem.topic.id}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0 ${
                            topicItem.completed ? "bg-chart-3 text-white" : "bg-muted"
                          }`}>
                            {topicItem.completed ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <span className="text-xs font-medium">{index + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              topicItem.completed ? "line-through text-muted-foreground" : ""
                            }`}>
                              {topicItem.topic.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {topicItem.topic.topicType}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {topicItem.reviewCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {topicItem.reviewCount} revisions
                            </Badge>
                          )}
                          {topicItem.completed ? (
                            <Badge className="bg-chart-3 text-white">
                              Completat
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pendent</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Encara no hi ha progrés per mostrar. Comença a estudiar per veure el teu avenç!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
