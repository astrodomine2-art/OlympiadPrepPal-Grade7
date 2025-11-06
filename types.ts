export enum Subject {
  IMO = 'IMO',
  NSO = 'NSO',
  IEO = 'IEO',
  ICSO = 'ICSO',
}

export type AppView = 'setup' | 'quiz' | 'report' | 'history' | 'mock_exams';

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'HOTS (Achiever Section)';

export type Grade = 6 | 7;

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic: string;
  subject: Subject;
  difficulty: Difficulty;
  grade: Grade;
  imageSvg?: string; // Changed from imageUrl to imageSvg
}

export interface QuizResult {
  id: string;
  date: string;
  questions: Question[]; // These are the FINAL, validated questions
  userAnswers: (number | null)[];
  score: number; // This is the FINAL, regraded score
  subject: Subject;
  topics: string[];
  timeTaken: number; // in seconds
  isMock: boolean;
  grade: Grade;
  originalQuestions?: Question[]; // The state of questions before any revalidation.
}

export interface ImprovementSuggestion {
  topic: string;
  suggestion: string;
}

export interface IncorrectAnswerDetail {
  questionText: string;
  topic: string;
  userAnswer: string;
  correctAnswer: string;
}


export const IMO_TOPICS = [
  "Number Systems",
  "Algebra",
  "Geometry",
  "Mensuration",
  "Data Handling",
  "Logical Reasoning"
];

export const NSO_TOPICS = [
  "Physics",
  "Chemistry",
  "Biology",
  "Logical Reasoning",
];

export const IEO_TOPICS = [
    "Vocabulary",
    "Grammar",
    "Reading Comprehension",
    "Spoken and Written Expression",
];

export const ICSO_TOPICS = [
    "Computer Fundamentals",
    "Internet and Security",
    "HTML & CSS",
    "MS Office",
    "Logical Reasoning"
];

// --- Grade 6 Topics ---

export const IMO_TOPICS_GRADE6 = [
  "Knowing Our Numbers",
  "Whole Numbers",
  "Playing with Numbers",
  "Basic Geometrical Ideas",
  "Integers",
  "Fractions and Decimals",
  "Data Handling",
  "Mensuration",
  "Algebra",
  "Ratio and Proportion"
];

export const NSO_TOPICS_GRADE6 = [
  "Food and its Components",
  "Sorting Materials",
  "Separation of Substances",
  "Changes Around Us",
  "Living Organisms & Their Surroundings",
  "Motion and Measurement",
  "Light, Shadows and Reflection",
  "Electricity and Circuits",
  "Fun with Magnets"
];

export const IEO_TOPICS_GRADE6 = [
    "Nouns and Pronouns",
    "Verbs and Adverbs",
    "Adjectives",
    "Articles and Prepositions",
    "Tenses",
    "Synonyms and Antonyms"
];

export const ICSO_TOPICS_GRADE6 = [
    "Input and Output Devices",
    "History of Computers",
    "MS Paint",
    "Introduction to Windows",
    "Basics of MS Word"
];