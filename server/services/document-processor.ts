import * as pdfParse from "pdf-parse";
import mammoth from "mammoth";
import Papa from "papaparse";
import fs from "fs/promises";
import path from "path";

export interface ProcessedDocument {
  text: string;
  images?: string[];
  tables?: any[];
  metadata?: {
    pageCount?: number;
    wordCount?: number;
  };
}

class DocumentProcessor {
  async processPDF(filePath: string): Promise<ProcessedDocument> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await (pdfParse as any).default(dataBuffer);
      
      return {
        text: data.text,
        metadata: {
          pageCount: data.numpages,
          wordCount: data.text.split(/\s+/).length,
        },
      };
    } catch (error) {
      console.error("Error processing PDF:", error);
      throw new Error("Failed to process PDF file");
    }
  }

  async processWord(filePath: string): Promise<ProcessedDocument> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      
      return {
        text: result.value,
        metadata: {
          wordCount: result.value.split(/\s+/).length,
        },
      };
    } catch (error) {
      console.error("Error processing Word document:", error);
      throw new Error("Failed to process Word document");
    }
  }

  async processCSV(filePath: string): Promise<ProcessedDocument> {
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      
      return new Promise((resolve, reject) => {
        Papa.parse(fileContent, {
          complete: (results) => {
            // Convert CSV data to readable text
            const headers = results.data[0] as string[];
            const rows = results.data.slice(1);
            
            let text = `CSV Document with ${rows.length} rows and ${headers.length} columns\n\n`;
            text += `Columns: ${headers.join(", ")}\n\n`;
            
            // Include sample data
            rows.slice(0, 10).forEach((row: any, index) => {
              text += `Row ${index + 1}:\n`;
              headers.forEach((header, i) => {
                text += `  ${header}: ${row[i]}\n`;
              });
              text += "\n";
            });
            
            resolve({
              text,
              tables: [results.data],
              metadata: {
                wordCount: text.split(/\s+/).length,
              },
            });
          },
          error: (error: any) => {
            reject(new Error(`Failed to process CSV: ${error.message}`));
          },
        });
      });
    } catch (error) {
      console.error("Error processing CSV:", error);
      throw new Error("Failed to process CSV file");
    }
  }

  async processPowerPoint(filePath: string): Promise<ProcessedDocument> {
    try {
      // For PowerPoint, we'll extract text from the XML structure manually
      // This is a simplified version - a full implementation would use a proper library
      const fileContent = await fs.readFile(filePath, "utf-8");
      
      // Basic placeholder - in production, use a proper PPTX parser
      return {
        text: `PowerPoint document: ${path.basename(filePath)}\n\nNote: PowerPoint processing is currently limited. Please convert to PDF for better text extraction.`,
        metadata: {
          wordCount: 50,
        },
      };
    } catch (error) {
      console.error("Error processing PowerPoint:", error);
      throw new Error("Failed to process PowerPoint file");
    }
  }

  async processDocument(filePath: string, fileType: string): Promise<ProcessedDocument> {
    const extension = fileType.toLowerCase();
    
    switch (extension) {
      case "pdf":
      case "application/pdf":
        return this.processPDF(filePath);
      
      case "docx":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return this.processWord(filePath);
      
      case "csv":
      case "text/csv":
        return this.processCSV(filePath);
      
      case "pptx":
      case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        return this.processPowerPoint(filePath);
      
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }
}

export const documentProcessor = new DocumentProcessor();
