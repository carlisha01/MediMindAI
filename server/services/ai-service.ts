// AI service for content extraction and Q&A using OpenAI
import { openai } from "../openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user

export interface ExtractedTopics {
  topics: Array<{
    title: string;
    content: string;
    topicType: "definition" | "clinical_case" | "concept" | "procedure";
  }>;
  suggestedSubject: string;
}

export interface QAResponse {
  answer: string;
  relatedTopics?: string[];
}

export class AIService {
  async extractTopicsFromText(text: string, filename: string): Promise<ExtractedTopics> {
    try {
      const prompt = `You are an expert medical educator analyzing study materials for 4th-year medical students.
      
Analyze the following medical document content and extract:
1. Key medical topics, definitions, clinical cases, concepts, and procedures
2. Suggest the most appropriate medical subject/specialty (e.g., Cardiology, Neurology, Pediatrics, Surgery, Internal Medicine, Dermatology, etc.)

Document filename: ${filename}

Content:
${text.substring(0, 15000)} 

Respond with JSON in this exact format:
{
  "topics": [
    {
      "title": "Topic name",
      "content": "Detailed explanation or description",
      "topicType": "definition" | "clinical_case" | "concept" | "procedure"
    }
  ],
  "suggestedSubject": "Medical specialty name"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert medical educator. Extract medical topics and classify content accurately. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result;
    } catch (error) {
      console.error("Error extracting topics:", error);
      // Return fallback response
      return {
        topics: [{
          title: `Content from ${filename}`,
          content: text.substring(0, 500),
          topicType: "concept",
        }],
        suggestedSubject: "General Medicine",
      };
    }
  }

  async answerQuestion(
    question: string,
    language: string,
    context?: string
  ): Promise<QAResponse> {
    try {
      const systemPrompt = language === "ca"
        ? "Ets un assistent d'estudi mèdic expert. Respon sempre en català amb explicacions clares i detallades. Utilitza un to didàctic i proporciona exemples clínics quan sigui apropiat."
        : "Eres un asistente de estudio médico experto. Responde siempre en español con explicaciones claras y detalladas. Utiliza un tono didáctico y proporciona ejemplos clínicos cuando sea apropiado.";

      const userPrompt = context
        ? `Basant-te en aquest context:\n\n${context}\n\nPregunta: ${question}`
        : question;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_completion_tokens: 4096,
      });

      return {
        answer: response.choices[0].message.content || "Ho sento, no puc processar aquesta pregunta en aquest moment.",
      };
    } catch (error) {
      console.error("Error answering question:", error);
      return {
        answer: language === "ca"
          ? "Ho sento, hi ha hagut un error en processar la teva pregunta. Torna-ho a provar."
          : "Lo siento, hubo un error al procesar tu pregunta. Inténtalo de nuevo.",
      };
    }
  }

  async classifyDocument(text: string, filename: string): Promise<string> {
    try {
      const prompt = `Classify this medical document into one of these specialties: Cardiology, Neurology, Pediatrics, Surgery, Internal Medicine, Dermatology, Psychiatry, Radiology, or General Medicine.
      
Filename: ${filename}
Content preview: ${text.substring(0, 1000)}

Respond with ONLY the specialty name, nothing else.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_completion_tokens: 20,
      });

      return response.choices[0].message.content?.trim() || "General Medicine";
    } catch (error) {
      console.error("Error classifying document:", error);
      return "General Medicine";
    }
  }
}

export const aiService = new AIService();
