import { GoogleGenAI, Type } from "@google/genai";

// Self-contained types for the worker
interface Question {
    id: string;
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
    topic: string;
    subject: string;
    difficulty: string;
    grade: number;
    imageSvg?: string;
}

// Self-contained schema for the worker
const singleQuestionSchema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      questionText: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      correctAnswerIndex: { type: Type.INTEGER },
      explanation: { type: Type.STRING },
      topic: { type: Type.STRING },
      subject: { type: Type.STRING },
      difficulty: { type: Type.STRING },
      grade: { type: Type.INTEGER },
      imageSvg: { type: Type.STRING }
    },
    required: ["id", "questionText", "options", "correctAnswerIndex", "explanation", "topic", "subject", "difficulty", "grade"]
};

// AI clients, initialized on first message
let ai: GoogleGenAI;
let anthropicApiKey: string | null = null;

// Fallback revalidation logic (self-contained)
const revalidateQuestionWithClaude = async (question: Question): Promise<Question> => {
    if (!anthropicApiKey) {
        throw new Error("Attempted to use fallback AI for revalidation, but ANTHROPIC_API_KEY is not configured in worker.");
    }

    const prompt = `
        You are an expert fact-checker and editor for Grade ${question.grade} Olympiad quiz questions. Your task is to meticulously review the following JSON object representing a quiz question.
        - Check the 'questionText' for any factual inaccuracies, grammatical errors, or ambiguities.
        - Verify that the 'options' are plausible but that only one is correct.
        - Ensure the 'correctAnswerIndex' correctly points to the right answer.
        - Validate that the 'explanation' is clear, accurate, and properly justifies the correct answer.
        If you find ANY error, correct it and return the entire, updated JSON object.
        If the question is 100% correct, return the original JSON object.
        The question to validate is:
        ${JSON.stringify(question)}
        VERY IMPORTANT: You must respond with ONLY the JSON object inside a single \`\`\`json ... \`\`\` code block. Do not include any other text.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Anthropic API request for revalidation failed with status ${response.status}: ${errorBody}`);
    }

    const responseData = await response.json();
    const textContent = responseData.content[0]?.text || '';
    
    const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]) as Question;
    } else {
        return JSON.parse(textContent) as Question;
    }
};

// Primary revalidation logic (self-contained)
const revalidateQuestion = async (question: Question): Promise<Question> => {
    const prompt = `
        You are an expert fact-checker and editor for Grade ${question.grade} Olympiad quiz questions. Your task is to meticulously review the following JSON object representing a quiz question.
        - Check the 'questionText' for any factual inaccuracies, grammatical errors, or ambiguities.
        - Verify that the 'options' are plausible but that only one is correct.
        - Ensure the 'correctAnswerIndex' correctly points to the right answer.
        - Validate that the 'explanation' is clear, accurate, and properly justifies the correct answer.
        If you find ANY error, correct it and return the entire, updated JSON object.
        If the question is 100% correct, return the original JSON object.
        The question to validate is:
        ${JSON.stringify(question)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: singleQuestionSchema
            }
        });
        const jsonText = response.text.trim();
        if (!jsonText) throw new Error("Primary AI (Gemini) returned an empty response for revalidation.");
        return JSON.parse(jsonText) as Question;
    } catch(geminiError) {
        console.warn("Worker: Primary AI failed revalidation. Attempting fallback.", geminiError);
        return await revalidateQuestionWithClaude(question);
    }
};

// Worker message handler
self.onmessage = async (event: MessageEvent) => {
    const { question, index, apiKey, anthropicApiKey: anthropicKey } = event.data;

    try {
        if (apiKey && !ai) {
            ai = new GoogleGenAI({ apiKey });
        }
        if (anthropicKey) {
            anthropicApiKey = anthropicKey;
        }

        if (!ai) {
            throw new Error('AI client not initialized in worker.');
        }

        const validatedQuestion = await revalidateQuestion(question);
        self.postMessage({ index, validatedQuestion, status: 'success' });

    } catch (error) {
        console.error(`Worker failed to revalidate question ${index}:`, error);
        self.postMessage({ index, originalQuestion: question, status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
};
