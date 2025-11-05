export enum Subject {
  IMO = 'IMO',
  NSO = 'NSO',
  IEO = 'IEO',
  ICSO = 'ICSO',
}

export type AppView = 'setup' | 'quiz' | 'report' | 'history' | 'mock_exams';

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'HOTS (Achiever Section)';

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic: string;
  subject: Subject;
  difficulty: Difficulty;
  imageSvg?: string; // Changed from imageUrl to imageSvg
}

export interface QuizResult {
  id: string;
  date: string;
  questions: Question[];
  userAnswers: (number | null)[];
  score: number;
  subject: Subject;
  topics: string[];
  timeTaken: number; // in seconds
  isMock: boolean;
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