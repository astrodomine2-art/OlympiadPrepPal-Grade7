import { GoogleGenAI, Type } from "@google/genai";
import { Question, Subject, Difficulty, Grade, IncorrectAnswerDetail } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY environment variable is not set. Fallback to secondary AI will not be available.");
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
          description: "The difficulty of the question (Easy, Medium, Hard, or HOTS (Achiever Section))."
      },
      grade: {
          type: Type.INTEGER,
          description: "The grade level of the question (6 or 7)."
      },
      imageSvg: {
        type: Type.STRING,
        description: "Optional. If the question requires a diagram, generate a valid, clean, and simple SVG string for it. The SVG should be self-contained and render correctly."
      }
    },
    required: ["id", "questionText", "options", "correctAnswerIndex", "explanation", "topic", "subject", "difficulty", "grade"]
};

const questionSchema = {
    type: Type.ARRAY,
    items: singleQuestionSchema
};

const generateQuestionsWithClaude = async (subject: Subject, topics: string[], count: number, difficulty: Difficulty, existingIds: string[], grade: Grade): Promise<Question[]> => {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("Attempted to use fallback AI, but ANTHROPIC_API_KEY is not configured.");
    }
    
    let difficultyInstruction = `The difficulty level must be: ${difficulty}.`;
    if (difficulty === 'HOTS (Achiever Section)') {
        difficultyInstruction = `
            The questions must be of a very high difficulty, specifically designed for the 'Achiever Section' of the Olympiad.
            These should be 'Higher-Order Thinking Skills' (HOTS) questions that require multi-step reasoning, synthesis of concepts, and advanced problem-solving skills.
        `;
    }

    const prompt = `
        Generate ${count} unique, high-quality quiz questions for a Grade ${grade} student preparing for the ${subject} Olympiad exam.
        The questions must cover these topics: ${topics.join(', ')}.
        ${difficultyInstruction}
        Ensure all questions are factually correct.
        Use proper mathematical and scientific symbols with Unicode characters.
        If a question requires a diagram, generate a clean, simple, and accurate SVG string and include it in the 'imageSvg' field.
        Do not repeat questions with the following IDs: ${existingIds.join(', ')}.

        The JSON array should contain objects, where each object has the following keys and value types:
        - "id": a unique string identifier.
        - "questionText": string, the question itself.
        - "options": an array of 4 strings.
        - "correctAnswerIndex": an integer (0-3).
        - "explanation": a detailed string explanation.
        - "topic": string, from the provided list.
        - "subject": string ("IMO", "NSO", etc.).
        - "difficulty": string ("Easy", "Medium", "Hard", etc.).
        - "grade": integer (6 or 7).
        - "imageSvg": an optional string containing a valid SVG.

        VERY IMPORTANT: You must respond with ONLY the JSON array inside a single \`\`\`json ... \`\`\` code block. Do not include any introductory text, explanations, or any other content outside the JSON block.
    `;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Anthropic API request failed with status ${response.status}: ${errorBody}`);
        }

        const responseData = await response.json();
        const textContent = responseData.content[0]?.text || '';
        
        const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
            const jsonText = jsonMatch[1];
            return JSON.parse(jsonText) as Question[];
        } else {
             try {
                return JSON.parse(textContent) as Question[];
            } catch(e) {
                console.error("Claude response did not contain a valid JSON block and could not be parsed:", textContent);
                throw new Error("Failed to parse JSON response from the secondary AI.");
            }
        }

    } catch (error) {
        console.error("Error during fallback AI call:", error);
        throw error;
    }
};

export const generateQuestions = async (subject: Subject, topics: string[], count: number, difficulty: Difficulty, existingIds: string[], grade: Grade): Promise<Question[]> => {
    let difficultyInstruction = `The difficulty level must be: ${difficulty}.`;
    if (difficulty === 'HOTS (Achiever Section)') {
        difficultyInstruction = `
            The questions must be of a very high difficulty, specifically designed for the 'Achiever Section' of the Olympiad.
            These should be 'Higher-Order Thinking Skills' (HOTS) questions that require multi-step reasoning, synthesis of concepts, and advanced problem-solving skills.
            These questions often carry more weight in the exam, so ensure they are challenging.
        `;
    }

    const prompt = `
        Generate ${count} quiz questions for a Grade ${grade} student preparing for the ${subject} Olympiad exam.
        The questions should cover the following topics: ${topics.join(', ')}.
        ${difficultyInstruction}
        Ensure all questions are unique and factually correct. Revalidate all questions and answers.
        Use proper mathematical and scientific symbols using Unicode characters that render directly in HTML.
        If a question requires a diagram, generate a clean, simple, and accurate SVG string and include it in the 'imageSvg' field. Do not find external image URLs.
        Do not repeat questions with the following IDs: ${existingIds.join(', ')}.
        Return the result in JSON format.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: questionSchema,
            },
        });
        
        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("Primary AI (Gemini) returned an empty response.");
        }
        const parsedQuestions = JSON.parse(jsonText) as Question[];

        if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
            throw new Error("Primary AI (Gemini) returned no questions or invalid data format.");
        }
        
        return parsedQuestions;

    } catch (geminiError) {
        console.warn("Primary AI (Gemini) failed. Attempting fallback with Secondary AI (Claude).", geminiError);
        
        if (!process.env.ANTHROPIC_API_KEY) {
            console.error("Cannot use fallback AI: ANTHROPIC_API_KEY is not set.");
            throw new Error("Failed to generate quiz questions. The primary AI failed and a fallback is not configured.");
        }
        
        try {
          const claudeQuestions = await generateQuestionsWithClaude(subject, topics, count, difficulty, existingIds, grade);
          return claudeQuestions;
        } catch (claudeError) {
          console.error("Secondary AI (Claude) also failed.", claudeError);
          const finalError = new Error(`Both primary and secondary AI services failed to generate questions. Please try again later.`);
          throw finalError;
        }
    }
};

const revalidateQuestionWithClaude = async (question: Question): Promise<Question> => {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("Attempted to use fallback AI for revalidation, but ANTHROPIC_API_KEY is not configured.");
    }

    const prompt = `
        You are an expert fact-checker and editor for Grade ${question.grade} Olympiad quiz questions. Your task is to meticulously review the following JSON object representing a quiz question.
        - Check the 'questionText' for any factual inaccuracies, grammatical errors, or ambiguities.
        - Verify that the 'options' are plausible but that only one is correct.
        - Ensure the 'correctAnswerIndex' correctly points to the right answer.
        - Validate that the 'explanation' is clear, accurate, and properly justifies the correct answer.

        If you find ANY error, correct it and return the entire, updated JSON object.
        If the question is 100% correct in every aspect, return the original JSON object without any changes.

        The question to validate is:
        ${JSON.stringify(question)}

        VERY IMPORTANT: You must respond with ONLY the JSON object inside a single \`\`\`json ... \`\`\` code block. Do not include any introductory text, explanations, or any other content outside the JSON block.
    `;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
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
            const jsonText = jsonMatch[1];
            return JSON.parse(jsonText) as Question;
        } else {
            try {
                return JSON.parse(textContent) as Question;
            } catch (e) {
                console.error("Claude revalidation response did not contain a valid JSON block and could not be parsed:", textContent);
                throw new Error("Failed to parse JSON response from the secondary AI for revalidation.");
            }
        }
    } catch (error) {
        console.error("Error during fallback AI call for revalidation:", error);
        throw error;
    }
};

export const revalidateQuestion = async (question: Question): Promise<Question> => {
    const prompt = `
        You are an expert fact-checker and editor for Grade ${question.grade} Olympiad quiz questions. Your task is to meticulously review the following JSON object representing a quiz question.
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
        if (!jsonText) {
            throw new Error("Primary AI (Gemini) returned an empty response for revalidation.");
        }
        return JSON.parse(jsonText) as Question;
    } catch(geminiError) {
        console.warn("Primary AI (Gemini) failed during revalidation. Attempting fallback with Secondary AI (Claude).", geminiError);
        
        if (!process.env.ANTHROPIC_API_KEY) {
            console.error("Cannot use fallback AI for revalidation: ANTHROPIC_API_KEY is not set.");
            throw new Error("Failed to revalidate the question. The primary AI failed and a fallback is not configured.");
        }

        try {
            return await revalidateQuestionWithClaude(question);
        } catch (claudeError) {
            console.error("Secondary AI (Claude) also failed during revalidation.", claudeError);
            throw new Error(`Both primary and secondary AI services failed to revalidate the question. Please try again later.`);
        }
    }
};

export async function* getImprovementSuggestions(incorrectlyAnswered: IncorrectAnswerDetail[], grade: Grade): AsyncGenerator<string> {
    if(incorrectlyAnswered.length === 0) {
        return;
    }

    const mistakesContext = incorrectlyAnswered.map(item => 
        `- Topic: ${item.topic}, Question: "${item.questionText}", Their incorrect answer: "${item.userAnswer}", Correct answer: "${item.correctAnswer}"`
    ).join('\n');

    const prompt = `
        A Grade ${grade} student preparing for the Olympiad exams made the following mistakes:
        ${mistakesContext}
        
        Based on this specific list of mistakes, provide a concise analysis of their potential misunderstandings. For each distinct topic they struggled with, give one specific, actionable suggestion for improvement. Your suggestions should directly address the concepts they got wrong.
        
        Format the output as clean markdown. For each topic, use a bolded heading like "**Topic: [Topic Name]**", followed by the suggestion in a new line. Do not wrap the response in a JSON object or code block.
    `;
    
    try {
        const response = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        
        for await (const chunk of response) {
            yield chunk.text;
        }
    } catch (error) {
        console.error("Error getting improvement suggestions stream:", error);
        yield "Could not generate improvement suggestions at this time due to an error.";
    }
};
