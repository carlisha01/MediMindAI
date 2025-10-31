import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Edit2, X, Filter, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopicReviewItem {
  id?: string;
  title: string;
  content: string;
  topicType: "definition" | "clinical_case" | "concept" | "procedure";
  confidence: number;
  include: boolean;
  deepFocus: boolean;
  correctedByUser: boolean;
}

interface ContentReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topics: TopicReviewItem[];
  documentId: string;
  documentName: string;
  onConfirm: (topics: TopicReviewItem[]) => void;
  onCancel: () => void;
}

export function ContentReviewModal({
  open,
  onOpenChange,
  topics: initialTopics,
  documentId,
  documentName,
  onConfirm,
  onCancel,
}: ContentReviewModalProps) {
  const [topics, setTopics] = useState<TopicReviewItem[]>(initialTopics);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "low-confidence">("all");

  // Reset state when document changes
  useEffect(() => {
    setTopics(initialTopics);
    setEditingId(null);
    setFilterMode("all");
  }, [documentId, initialTopics]);

  const filteredTopics = useMemo(() => {
    if (filterMode === "low-confidence") {
      return topics.filter(t => t.confidence < 80);
    }
    return topics;
  }, [topics, filterMode]);

  const handleToggleInclude = (index: number) => {
    setTopics(prev => prev.map((t, i) => 
      i === index ? { ...t, include: !t.include } : t
    ));
  };

  const handleToggleDeepFocus = (index: number) => {
    setTopics(prev => prev.map((t, i) => 
      i === index ? { ...t, deepFocus: !t.deepFocus } : t
    ));
  };

  const handleEdit = (index: number, field: "title" | "content", value: string) => {
    setTopics(prev => prev.map((t, i) => 
      i === index ? { ...t, [field]: value, correctedByUser: true } : t
    ));
  };

  const handleSelectAllDeepFocus = () => {
    setTopics(prev => prev.map(t => ({ ...t, deepFocus: true })));
  };

  const handleSaveChanges = () => {
    // Send all topics with their include/deepFocus/correctedByUser flags
    // Backend will handle exclusions
    onConfirm(topics);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) {
      return <Badge variant="default" className="bg-chart-3 text-white">Alta ({confidence}%)</Badge>;
    } else if (confidence >= 70) {
      return <Badge variant="default" className="bg-chart-4 text-white">Mitjana ({confidence}%)</Badge>;
    } else {
      return <Badge variant="destructive">Baixa ({confidence}%)</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      definition: "Definició",
      clinical_case: "Cas Clínic",
      concept: "Concepte",
      procedure: "Procediment",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const includedCount = topics.filter(t => t.include).length;
  const deepFocusCount = topics.filter(t => t.deepFocus).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisió de Contingut Extret</DialogTitle>
          <DialogDescription>
            Revisa, corregeix i prioritza els temes extrets de <strong>{documentName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filter and Action Bar */}
          <div className="flex items-center gap-2 flex-wrap border-b pb-4">
            <Select value={filterMode} onValueChange={(v) => setFilterMode(v as any)}>
              <SelectTrigger className="w-[240px]" data-testid="select-filter-mode">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="filter-all">Tots els elements</SelectItem>
                <SelectItem value="low-confidence" data-testid="filter-low-confidence">
                  Només baixa confiança ({`<80%`})
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAllDeepFocus}
              data-testid="button-select-all-deep-focus"
            >
              <Star className="h-4 w-4 mr-2" />
              Marcar tots com a prioritaris
            </Button>

            <div className="flex-1" />
            
            <div className="text-sm text-muted-foreground">
              {includedCount} / {topics.length} inclosos · {deepFocusCount} prioritaris
            </div>
          </div>

          {/* Topics List */}
          <div className="space-y-3">
            {filteredTopics.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hi ha elements amb aquest filtre
              </p>
            ) : (
              filteredTopics.map((topic, index) => {
                const actualIndex = topics.findIndex(t => t === topic);
                const isEditing = editingId === actualIndex;

                return (
                  <div
                    key={actualIndex}
                    className={cn(
                      "border rounded-lg p-4 space-y-3",
                      !topic.include && "opacity-50"
                    )}
                    data-testid={`topic-review-${actualIndex}`}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={topic.include}
                        onCheckedChange={() => handleToggleInclude(actualIndex)}
                        className="mt-1"
                        data-testid={`checkbox-include-${actualIndex}`}
                      />
                      
                      <div className="flex-1 space-y-2">
                        {isEditing ? (
                          <Input
                            value={topic.title}
                            onChange={(e) => handleEdit(actualIndex, "title", e.target.value)}
                            className="font-medium"
                            data-testid={`input-title-${actualIndex}`}
                          />
                        ) : (
                          <h4 className="font-medium">{topic.title}</h4>
                        )}
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          {getConfidenceBadge(topic.confidence)}
                          <Badge variant="secondary">{getTypeLabel(topic.topicType)}</Badge>
                          {topic.correctedByUser && (
                            <Badge variant="outline" className="text-xs">Corregit</Badge>
                          )}
                        </div>

                        {isEditing ? (
                          <Textarea
                            value={topic.content}
                            onChange={(e) => handleEdit(actualIndex, "content", e.target.value)}
                            rows={4}
                            data-testid={`textarea-content-${actualIndex}`}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{topic.content}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant={topic.deepFocus ? "default" : "outline"}
                          size="icon"
                          onClick={() => handleToggleDeepFocus(actualIndex)}
                          data-testid={`button-deep-focus-${actualIndex}`}
                        >
                          <Star className={cn("h-4 w-4", topic.deepFocus && "fill-current")} />
                        </Button>
                        
                        <Button
                          variant={isEditing ? "default" : "outline"}
                          size="icon"
                          onClick={() => setEditingId(isEditing ? null : actualIndex)}
                          data-testid={`button-edit-${actualIndex}`}
                        >
                          {isEditing ? <CheckCheck className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel-review"
          >
            Cancel·lar
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={includedCount === 0}
            data-testid="button-save-changes"
          >
            Desa els canvis ({includedCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
