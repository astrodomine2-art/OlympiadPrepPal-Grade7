import { GoogleGenAI, Type } from "@google/genai";
import { Question, Subject, Difficulty } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const singleQuestionSchema = {
    type: Type.OBJECT,
    properties: {
      id: {
          type: Type.STRING,
          description: 'A unique identifier for the question, can be a short hash of the question text.'
      },
      questionText: {
        type: Type.STRING,
        description: "The main text of the question. Must use Unicode characters for mathematical symbols (e.g., × for multiplication, ÷ for division, √ for square root, ² for exponents, ° for degrees)."
      },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "An array of 4 string options for the multiple-choice question."
      },
      correctAnswerIndex: {
        type: Type.INTEGER,
        description: "The 0-based index of the correct answer in the options array."
      },
      explanation: {
        type: Type.STRING,
        description: "A detailed step-by-step explanation for why the correct answer is right."
      },
      topic: {
          type: Type.STRING,
          description: "The specific topic of the question from the list provided."
      },
      subject: {
          type: Type.STRING,
          description: "The subject of the question (IMO or NSO)."
      },
      difficulty: {
          type: Type.STRING,
          description: "The difficulty of the question (Easy, Medium, or Hard)."
      },
      imageSvg: {
        type: Type.STRING,
        description: "Optional. If the question requires a diagram, generate a valid, clean, and simple SVG string for it. The SVG should be self-contained and render correctly."
      }
    },
    required: ["id", "questionText", "options", "correctAnswerIndex", "explanation", "topic", "subject", "difficulty"]
};

const questionSchema = {
    type: Type.ARRAY,
    items: singleQuestionSchema
};


export const generateQuestions = async (subject: Subject, topics: string[], count: number, difficulty: Difficulty, existingIds: string[]): Promise<Question[]> => {
    const prompt = `
        Generate ${count} quiz questions for a Grade 7 student preparing for the ${subject} Olympiad exam.
        The questions should cover the following topics: ${topics.join(', ')}.
        The difficulty level must be: ${difficulty}.
        Ensure all questions are unique and factually correct. Revalidate all questions and answers.
        Use proper mathematical and scientific symbols using Unicode characters that render directly in HTML.
        If a question requires a diagram, generate a clean, simple, and accurate SVG string and include it in the 'imageSvg' field. Do not find external image URLs.
        Do not repeat questions with the following IDs: ${existingIds.join(', ')}.
        Return the result in JSON format.
    `;

    try {
        const response = await ai.models.generateContent({
            // FIX: Use current recommended model 'gemini-2.5-flash' instead of deprecated 'gemini-1.5-flash'
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: questionSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedQuestions = JSON.parse(jsonText) as Question[];
        return parsedQuestions;

    } catch (error) {
        console.error("Error generating questions:", error);
        throw new Error("Failed to generate quiz questions. Please try again.");
    }
};

export const revalidateQuestion = async (question: Question): Promise<Question> => {
    const prompt = `
        You are an expert fact-checker and editor for Grade 7 Olympiad quiz questions. Your task is to meticulously review the following JSON object representing a quiz question.
        - Check the 'questionText' for any factual inaccuracies, grammatical errors, or ambiguities.
        - Verify that the 'options' are plausible but that only one is correct.
        - Ensure the 'correctAnswerIndex' correctly points to the right answer.
        - Validate that the 'explanation' is clear, accurate, and properly justifies the correct answer.

        If you find ANY error, correct it and return the entire, updated JSON object.
        If the question is 100% correct in every aspect, return the original JSON object without any changes.

        The question to validate is:
        ${JSON.stringify(question)}
    `;
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
        return JSON.parse(jsonText) as Question;
    } catch(error) {
        console.error("Error revalidating question:", error);
        throw new Error("Failed to revalidate the question. Please try again.");
    }
};

export const getImprovementSuggestions = async (incorrectlyAnswered: Question[]): Promise<string> => {
    if(incorrectlyAnswered.length === 0) {
        return "Excellent work! You answered all questions correctly. Keep practicing to maintain this great performance.";
    }

    const topics = incorrectlyAnswered.map(q => q.topic).join(', ');

    const prompt = `
        A Grade 7 student preparing for the Olympiad exams answered some questions incorrectly.
        Here are the topics of the questions they got wrong: ${topics}.
        
        Based on these topics, provide a concise analysis of their weak areas and suggest 3-4 specific, actionable areas for improvement.
        Format the response as a markdown string. Start with a heading "Areas for Improvement". Use bullet points for the suggestions.
    `;
    
    try {
        const response = await ai.models.generateContent({
            // FIX: Use current recommended model 'gemini-2.5-flash' instead of deprecated 'gemini-1.5-flash'
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting improvement suggestions:", error);
        return "Could not generate improvement suggestions at this time.";
    }
};