// AI service for content extraction and Q&A using OpenAI
import { openai } from "../openai";
import type { Topic } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user

export interface ExtractedTopics {
  topics: Array<{
    title: string;
    content: string;
    topicType: "definition" | "clinical_case" | "concept" | "procedure";
    confidence: number; // 0-100 confidence score
  }>;
  suggestedSubject: string;
}

export interface QAResponse {
  answer: string;
  relatedTopics?: string[];
}

interface RelevantContext {
  topics: Topic[];
  contextText: string;
}

export class AIService {
  /**
   * Normalize text for cross-language matching: remove accents, lowercase, basic stemming
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[.,;:?!()]/g, ' ');
  }

  /**
   * Simple stemming for medical terms (Catalan/Spanish/English)
   */
  private stemWord(word: string): string {
    // Remove common suffixes to find root forms
    const normalized = this.normalizeText(word);
    
    // Handle plurals and common inflections
    return normalized
      .replace(/s$/,'') // Spanish/English plural
      .replace(/es$/,'') // Catalan/Spanish plural
      .replace(/ics$/,'c') // pediatrics → pediatric
      .replace(/ia$/,'') // cardiologia → cardiolog
      .replace(/ogy$/,'og') // dermatology → dermatolog
      .replace(/ical$/,'ic') // cardiac → cardiac
      .replace(/iques$/,'ic') // cardíaques → cardiaq → cardiac
      .replace(/ica$/,'ic') // cardíaca → cardiac
      .replace(/ico$/,'ic'); // cardíaco → cardiac
  }

  /**
   * Retrieve relevant topics from the user's uploaded documents based on the question
   * Uses multilingual keyword matching with normalization and stemming
   */
  async retrieveRelevantContext(question: string, allTopics: Topic[]): Promise<RelevantContext> {
    if (!allTopics || allTopics.length === 0) {
      return { topics: [], contextText: "" };
    }

    // Filter to only included topics
    const includedTopics = allTopics.filter(t => t.included);
    
    if (includedTopics.length === 0) {
      return { topics: [], contextText: "" };
    }

    // Medical term mapping (Catalan/Spanish/English) for semantic expansion
    const medicalTermMap: Record<string, string[]> = {
      'cardiovascular': ['cardiovascular', 'cardiac', 'cardio', 'heart', 'cor'],
      'skin': ['skin', 'pell', 'derma', 'cutaneous', 'cutani'],
      'brain': ['brain', 'cerebro', 'cervell', 'neural', 'neuro'],
      'blood': ['blood', 'sang', 'sangre', 'hemat', 'hemo'],
      'arrhythmia': ['arrhythmia', 'arritmia', 'rhythm', 'ritme'],
      'pressure': ['pressure', 'pressio', 'tension'],
      'diabetes': ['diabetes', 'diabetis', 'glucose', 'glucosa'],
      'infection': ['infection', 'infeccio', 'bacterial', 'viral'],
      'disease': ['disease', 'malaltia', 'enfermedad', 'disorder'],
    };

    // Extract and normalize keywords from question (include short words)
    const questionWords = this.normalizeText(question)
      .split(/\s+/)
      .filter(w => w.length >= 2) // Allow short medical terms like "cor"
      .map(w => this.stemWord(w));
    
    // Expand keywords using medical term mapping
    const expandedKeywords = new Set<string>();
    for (const word of questionWords) {
      expandedKeywords.add(word);
      const stemmed = this.stemWord(word);
      expandedKeywords.add(stemmed);
      
      // Add medical synonyms
      for (const [key, synonyms] of Object.entries(medicalTermMap)) {
        const keyStem = this.stemWord(key);
        const synonymStems = synonyms.map(s => this.stemWord(s));
        
        if (stemmed === keyStem || synonymStems.includes(stemmed)) {
          synonymStems.forEach(syn => expandedKeywords.add(syn));
        }
      }
    }
    
    const scoredTopics = includedTopics.map(topic => {
      const titleNormalized = this.normalizeText(topic.title);
      const contentNormalized = this.normalizeText(topic.content);
      const titleWords = titleNormalized.split(/\s+/).map(w => this.stemWord(w));
      const contentWords = contentNormalized.split(/\s+/).map(w => this.stemWord(w));
      
      let score = 0;
      
      // Check for matches with expanded keywords
      const keywordsArray = Array.from(expandedKeywords);
      for (const keyword of keywordsArray) {
        // Exact title word matches (highest weight)
        if (titleWords.includes(keyword)) {
          score += 20;
        }
        // Title substring matches
        else if (titleNormalized.includes(keyword)) {
          score += 10;
        }
        
        // Content word matches
        if (contentWords.includes(keyword)) {
          score += 5;
        }
        // Content substring matches
        else if (contentNormalized.includes(keyword)) {
          score += 2;
        }
      }
      
      // Boost for deep focus topics
      if (topic.deepFocus) {
        score *= 1.5;
      }
      
      return { topic, score };
    });
    
    // Sort by score and take top 5 most relevant topics
    const relevantTopics = scoredTopics
      .filter(st => st.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(st => st.topic);
    
    // If no relevant topics, return empty context (let GPT-5 use general knowledge)
    if (relevantTopics.length === 0) {
      return { topics: [], contextText: "" };
    }
    
    // Build context text from relevant topics
    const contextText = relevantTopics
      .map(topic => {
        const typeLabel = {
          'definition': 'Definició',
          'clinical_case': 'Cas Clínic',
          'concept': 'Concepte',
          'procedure': 'Procediment'
        }[topic.topicType] || 'Tema';
        
        return `[${typeLabel}] ${topic.title}\n${topic.content}`;
      })
      .join('\n\n---\n\n');
    
    return { topics: relevantTopics, contextText };
  }

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
      "topicType": "definition" | "clinical_case" | "concept" | "procedure",
      "confidence": 0-100 (integer score indicating your confidence in this extraction)
    }
  ],
  "suggestedSubject": "Medical specialty name"
}

For each topic, provide a confidence score (0-100) based on:
- Clarity of the content
- Medical accuracy and completeness
- Proper categorization as definition/case/concept/procedure`;

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
          confidence: 50, // Low confidence for fallback
        }],
        suggestedSubject: "General Medicine",
      };
    }
  }

  async answerQuestion(
    question: string,
    language: string,
    userTopics?: Topic[]
  ): Promise<QAResponse> {
    try {
      // Retrieve relevant context from user's documents
      let contextText = "";
      let relatedTopicIds: string[] = [];
      
      if (userTopics && userTopics.length > 0) {
        const { topics: relevantTopics, contextText: retrievedContext } = 
          await this.retrieveRelevantContext(question, userTopics);
        contextText = retrievedContext;
        relatedTopicIds = relevantTopics.map(t => t.id);
      }

      // Build enhanced system prompt
      const baseSystemPrompt = language === "ca"
        ? "Ets un assistent d'estudi mèdic expert amb accés als materials d'estudi de l'estudiant. Proporciona respostes detallades, precises i educatives."
        : "Eres un asistente de estudio médico experto con acceso a los materiales de estudio del estudiante. Proporciona respuestas detalladas, precisas y educativas.";

      const contextInstructions = language === "ca"
        ? `\n\nQuan responguis:
1. Si tens informació rellevant dels documents de l'estudiant (proporcionada com a CONTEXT), prioritza-la i referencia-la explícitament
2. Complementa aquesta informació amb coneixement mèdic general establert per donar una resposta completa
3. Si la informació dels documents és insuficient, proporciona igualment una resposta completa basada en coneixement mèdic general
4. Utilitza un to didàctic, amb explicacions clares i exemples clínics quan sigui apropiat
5. Estructura la resposta amb seccions clares (per què és important, com es classifica, símptomes, diagnòstic, tractament, exemples)
6. Sempre respon en català`
        : `\n\nAl responder:
1. Si tienes información relevante de los documentos del estudiante (proporcionada como CONTEXT), priorízala y referencíala explícitamente
2. Complementa esta información con conocimiento médico general establecido para dar una respuesta completa
3. Si la información de los documentos es insuficiente, proporciona igualmente una respuesta completa basada en conocimiento médico general
4. Utiliza un tono didáctico, con explicaciones claras y ejemplos clínicos cuando sea apropiado
5. Estructura la respuesta con secciones claras (por qué es importante, cómo se clasifica, síntomas, diagnóstico, tratamiento, ejemplos)
6. Siempre responde en español`;

      const systemPrompt = baseSystemPrompt + contextInstructions;

      // Build user prompt with context
      let userPrompt = "";
      if (contextText) {
        const contextLabel = language === "ca" 
          ? "CONTEXT dels teus documents d'estudi"
          : "CONTEXT de tus documentos de estudio";
        userPrompt = `${contextLabel}:\n\n${contextText}\n\n---\n\nPREGUNTA: ${question}`;
      } else {
        userPrompt = question;
      }

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
        relatedTopics: relatedTopicIds,
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

  /**
   * Generate suggested questions based on user's uploaded topics
   */
  async generateSuggestedQuestions(topics: Topic[], count: number = 4): Promise<string[]> {
    try {
      if (!topics || topics.length === 0) {
        return [
          "Explica'm les causes principals de la insuficiència cardíaca",
          "Quins són els símptomes de la meningitis?",
          "Com es diagnostica la diabetis tipus 2?",
          "Diferències entre angina de pit i infart de miocardi",
        ];
      }

      // Build context from user's topics
      const topicSummary = topics
        .slice(0, 10) // Use up to 10 topics for context
        .map(t => `- ${t.title} (${t.topicType})`)
        .join('\n');

      const prompt = `Basant-te en aquests temes mèdics que l'estudiant ha pujat:

${topicSummary}

Genera ${count} preguntes d'estudi rellevants i específiques sobre aquests temes en CATALÀ.
Les preguntes han de ser clares, educatives i animar a l'estudiant a aprofundir en el contingut.
Retorna NOMÉS les preguntes, una per línia, sense numeració ni format adicional.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_completion_tokens: 500,
      });

      const content = response.choices[0].message.content || "";
      const questions = content
        .split('\n')
        .filter(line => line.trim().length > 10)
        .map(line => line.replace(/^[-•\d.)\s]+/, '').trim())
        .filter(q => q.length > 0)
        .slice(0, count);

      return questions.length > 0 ? questions : [
        "Explica'm els conceptes principals dels teus documents",
        "Quins són els punts clau que has estudiat?",
        "Com es relacionen els temes que has pujat?",
        "Explica'm un cas clínic dels teus materials",
      ];
    } catch (error) {
      console.error("Error generating suggested questions:", error);
      return [
        "Explica'm els conceptes principals dels teus documents",
        "Quins són els punts clau que has estudiat?",
      ];
    }
  }

  /**
   * Generate MCQ questions based on subject topics or general medical knowledge
   */
  async generateMCQQuestions(
    topics: Topic[], 
    count: number = 5, 
    subjectName?: string
  ): Promise<Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: string;
    topicId?: string;
  }>> {
    try {
      let prompt: string;

      if (!topics || topics.length === 0) {
        // Generate questions from general medical knowledge for the subject
        const subject = subjectName || "medicina general";
        
        prompt = `Genera ${count} preguntes de resposta múltiple (MCQ) en CATALÀ sobre ${subject}.

Les preguntes han de cobrir conceptes clau, casos clínics comuns, diagnòstic i tractament rellevant per a l'assignatura de ${subject} de medicina.

Per a cada pregunta proporciona:
1. La pregunta
2. 4 opcions de resposta (A, B, C, D)
3. L'índex de la resposta correcta (0 per A, 1 per B, 2 per C, 3 per D)
4. Una explicació detallada de per què la resposta és correcta
5. Nivell de dificultat: easy, medium, o hard

Retorna les preguntes en format JSON:
[
  {
    "question": "pregunta aquí",
    "options": ["A...", "B...", "C...", "D..."],
    "correctAnswer": 0,
    "explanation": "explicació detallada",
    "difficulty": "medium"
  }
]

Retorna NOMÉS el JSON, sense text adicional.`;
      } else {
        // Build context from topics
        const topicContent = topics
          .slice(0, 5) // Use up to 5 topics for MCQ generation
          .map(t => `Tema: ${t.title}\nTipus: ${t.topicType}\nContingut: ${t.content.substring(0, 500)}\n`)
          .join('\n---\n');

        prompt = `Basant-te en aquests temes mèdics:

${topicContent}

Genera ${count} preguntes de resposta múltiple (MCQ) en CATALÀ sobre aquests temes.

Per a cada pregunta proporciona:
1. La pregunta
2. 4 opcions de resposta (A, B, C, D)
3. L'índex de la resposta correcta (0 per A, 1 per B, 2 per C, 3 per D)
4. Una explicació detallada de per què la resposta és correcta
5. Nivell de dificultat: easy, medium, o hard

Retorna les preguntes en format JSON:
[
  {
    "question": "pregunta aquí",
    "options": ["A...", "B...", "C...", "D..."],
    "correctAnswer": 0,
    "explanation": "explicació detallada",
    "difficulty": "medium"
  }
]

Retorna NOMÉS el JSON, sense text adicional.`;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_completion_tokens: 3000,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content || "{}";
      console.log("AI MCQ Response:", content.substring(0, 500)); // Log first 500 chars
      
      const parsed = JSON.parse(content);
      console.log("Parsed MCQ data:", JSON.stringify(parsed).substring(0, 200));
      
      // Handle both array and object with questions array
      const questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
      console.log(`Found ${questions.length} MCQ questions to return`);
      
      return questions.map((q: any, idx: number) => ({
        question: q.question || "",
        options: q.options || [],
        correctAnswer: q.correctAnswer ?? 0,
        explanation: q.explanation || "",
        difficulty: q.difficulty || "medium",
        // Only assign topicId if topics exist
        topicId: topics.length > 0 ? topics[idx % topics.length]?.id : undefined,
      }));
    } catch (error) {
      console.error("Error generating MCQ questions:", error);
      throw new Error("Failed to generate MCQ questions");
    }
  }
}

export const aiService = new AIService();
