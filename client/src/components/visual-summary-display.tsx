import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { VisualSummary } from "@shared/schema";

interface VisualSummaryDisplayProps {
  summary: VisualSummary;
}

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'inherit',
});

export function VisualSummaryDisplay({ summary }: VisualSummaryDisplayProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!mermaidRef.current) return;

      try {
        // Clear previous content
        mermaidRef.current.innerHTML = "";
        
        // Generate unique ID for this diagram
        const id = `mermaid-${summary.id}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(id, summary.content as string);
        
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg as string;
        }
      } catch (error) {
        console.error("Error rendering Mermaid diagram:", error);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `
            <div class="text-destructive text-sm p-4 border border-destructive rounded-md">
              Error al renderitzar el diagrama. Comprova el format del contingut.
            </div>
          `;
        }
      }
    };

    if (summary.summaryType === "flowchart" || summary.summaryType === "concept_map") {
      renderDiagram();
    }
  }, [summary]);

  if (summary.summaryType === "comparison_table") {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {summary.content as string}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div 
      ref={mermaidRef} 
      className="flex items-center justify-center p-4 bg-card rounded-md border"
      data-testid={`mermaid-diagram-${summary.id}`}
    />
  );
}
