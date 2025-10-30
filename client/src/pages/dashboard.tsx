import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BookOpen, Clock, TrendingUp, Upload, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalDocuments: number;
  totalTopics: number;
  studyTimeMinutes: number;
  overallProgress: number;
}

interface SubjectProgress {
  id: string;
  name: string;
  icon: string;
  color: string;
  documentCount: number;
  topicCount: number;
  completedTopics: number;
  progress: number;
}

interface RecentActivity {
  id: string;
  type: "upload" | "topic_completed" | "study_session";
  description: string;
  timestamp: string;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: subjects, isLoading: subjectsLoading } = useQuery<SubjectProgress[]>({
    queryKey: ["/api/dashboard/subjects"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<RecentActivity[]>({
    queryKey: ["/api/dashboard/activities"],
  });

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Benvingut al teu Tauler</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona els teus materials d'estudi i segueix el teu progrés
          </p>
        </div>
        <Link href="/documents">
          <Button data-testid="button-upload-document">
            <Upload className="h-4 w-4 mr-2" />
            Pujar Document
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card data-testid="card-stat-documents">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold" data-testid="text-total-documents">
                  {stats?.totalDocuments || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Materials pujats
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-topics">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Temes</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-2/10">
                  <Brain className="h-4 w-4 text-chart-2" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold" data-testid="text-total-topics">
                  {stats?.totalTopics || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Temes extrets
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-study-time">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Temps d'Estudi</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-4/10">
                  <Clock className="h-4 w-4 text-chart-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold" data-testid="text-study-time">
                  {formatStudyTime(stats?.studyTimeMinutes || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total acumulat
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-progress">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progrés Global</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-3/10">
                  <TrendingUp className="h-4 w-4 text-chart-3" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold" data-testid="text-overall-progress">
                  {stats?.overallProgress || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Temes completats
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Assignatures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subjectsLoading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </>
              ) : subjects && subjects.length > 0 ? (
                subjects.map((subject) => (
                  <div key={subject.id} className="space-y-2" data-testid={`subject-${subject.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${subject.color}20` }}>
                          <BookOpen className="h-4 w-4" style={{ color: subject.color }} />
                        </div>
                        <div>
                          <p className="font-medium">{subject.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {subject.documentCount} documents · {subject.topicCount} temes
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{subject.progress}%</span>
                        <Link href={`/subjects/${subject.id}`}>
                          <Button variant="ghost" size="sm" data-testid={`button-view-subject-${subject.id}`}>
                            Estudiar
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <Progress value={subject.progress} className="h-2" />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Encara no tens assignatures. Puja documents per començar!
                  </p>
                  <Link href="/documents">
                    <Button data-testid="button-upload-first-document">
                      Pujar el Primer Document
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Activitat Recent</CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities && activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3" data-testid={`activity-${activity.id}`}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        {activity.type === "upload" && <Upload className="h-4 w-4 text-primary" />}
                        {activity.type === "topic_completed" && <TrendingUp className="h-4 w-4 text-chart-3" />}
                        {activity.type === "study_session" && <Clock className="h-4 w-4 text-chart-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Encara no hi ha activitat
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
