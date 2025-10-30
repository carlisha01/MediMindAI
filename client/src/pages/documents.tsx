import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, FileSpreadsheet, Presentation, Search, Filter, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Document, Subject } from "@shared/schema";

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return FileText;
      case "docx":
        return FileText;
      case "pptx":
        return Presentation;
      case "csv":
        return FileSpreadsheet;
      default:
        return FileText;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-chart-3 text-white gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Completat
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="default" className="bg-chart-4 text-white gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processant
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pendent
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ca-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredDocuments = documents?.filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === "all" || doc.subjectId === filterSubject;
    const matchesType = filterType === "all" || doc.fileType === filterType;
    return matchesSearch && matchesSubject && matchesType;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Documents</h1>
        <p className="text-muted-foreground mt-1">
          Puja i gestiona els teus materials d'estudi
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Puja els teus documents</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Suportem PDF, Word (.docx), PowerPoint (.pptx) i CSV. Arrrossega els arxius aquí o fes clic per seleccionar.
            </p>
            <Button data-testid="button-select-files">
              <Upload className="h-4 w-4 mr-2" />
              Seleccionar Arxius
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>Els Meus Documents</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cercar documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-documents"
                />
              </div>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-[180px]" data-testid="select-filter-subject">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Assignatura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="select-item-all-subjects">Totes les assignatures</SelectItem>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id} data-testid={`select-item-subject-${subject.id}`}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]" data-testid="select-filter-type">
                  <SelectValue placeholder="Tipus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="select-item-all-types">Tots els tipus</SelectItem>
                  <SelectItem value="pdf" data-testid="select-item-pdf">PDF</SelectItem>
                  <SelectItem value="docx" data-testid="select-item-docx">Word</SelectItem>
                  <SelectItem value="pptx" data-testid="select-item-pptx">PowerPoint</SelectItem>
                  <SelectItem value="csv" data-testid="select-item-csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {documentsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : filteredDocuments && filteredDocuments.length > 0 ? (
            <div className="space-y-2">
              {filteredDocuments.map((doc) => {
                const Icon = getFileIcon(doc.fileType);
                const subject = subjects?.find((s) => s.id === doc.subjectId);
                
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover-elevate"
                    data-testid={`document-${doc.id}`}
                  >
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      doc.fileType === "pdf" && "bg-destructive/10",
                      doc.fileType === "docx" && "bg-primary/10",
                      doc.fileType === "pptx" && "bg-chart-5/10",
                      doc.fileType === "csv" && "bg-chart-3/10"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        doc.fileType === "pdf" && "text-destructive",
                        doc.fileType === "docx" && "text-primary",
                        doc.fileType === "pptx" && "text-chart-5",
                        doc.fileType === "csv" && "text-chart-3"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.filename}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                        {subject && (
                          <>
                            <span>•</span>
                            <span>{subject.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(doc.processingStatus)}
                      <Button variant="ghost" size="sm" data-testid={`button-view-${doc.id}`}>
                        Veure
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                {searchQuery || filterSubject !== "all" || filterType !== "all"
                  ? "No s'han trobat documents amb aquests filtres"
                  : "Encara no tens documents"}
              </p>
              <p className="text-sm text-muted-foreground">
                Puja el teu primer document per començar
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
