export enum Subject {
    IMO = 'IMO',
    NSO = 'NSO',
    IEO = 'IEO',
    ICSO = 'ICSO',
}

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
    imageSvg?: string;
}

export interface QuizResult {
    id: string;
    date: string;
    questions: Question[];
    userAnswers: (number | null)[];
    score: number;
    subject: Subject;
    topics: string[];
    timeTaken: number;
    isMock: boolean;
    grade: Grade;
    originalQuestions?: Question[];
}

export interface IncorrectAnswerDetail {
    questionText: string;
    topic: string;
    userAnswer: string;
    correctAnswer: string;
}

export interface ImprovementSuggestion {
    topic: string;
    suggestion: string;
}

export const IMO_TOPICS = ["Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations in Two Variables", "Introduction to Euclid's Geometry", "Lines and Angles", "Triangles", "Quadrilaterals", "Areas of Parallelograms and Triangles", "Circles", "Constructions", "Heron's Formula", "Surface Areas and Volumes", "Statistics", "Probability"];
export const NSO_TOPICS = ["Matter in Our Surroundings", "Is Matter Around Us Pure", "Atoms and Molecules", "Structure of the Atom", "The Fundamental Unit of Life", "Tissues", "Diversity in Living Organisms", "Motion", "Force and Laws of Motion", "Gravitation", "Work and Energy", "Sound", "Why Do We Fall Ill", "Natural Resources", "Improvement in Food Resources"];
export const IEO_TOPICS = ["Vocabulary", "Grammar", "Reading Comprehension", "Spoken and Written Expression"];
export const ICSO_TOPICS = ["Fundamentals of Computer", "MS-Word", "MS-PowerPoint", "MS-Excel", "Internet & E-mail", "Introduction to QBasic", "Networking", "Cyber Security"];

export const IMO_TOPICS_GRADE6 = ["Knowing our Numbers", "Whole Numbers", "Playing with Numbers", "Basic Geometrical Ideas", "Understanding Elementary Shapes", "Integers", "Fractions", "Decimals", "Data Handling", "Mensuration", "Algebra", "Ratio and Proportion", "Symmetry", "Practical Geometry"];
export const NSO_TOPICS_GRADE6 = ["Food: Where Does It Come From?", "Components of Food", "Fibre to Fabric", "Sorting Materials into Groups", "Separation of Substances", "Changes Around Us", "Getting to Know Plants", "Body Movements", "The Living Organisms and Their Surroundings", "Motion and Measurement of Distances", "Light, Shadows and Reflections", "Electricity and Circuits", "Fun with Magnets", "Water", "Air Around Us", "Garbage In, Garbage Out"];
export const IEO_TOPICS_GRADE6 = ["Jumbled Words", "Words and their Meanings", "Words and their Opposites", "Identify the Word from the Picture", "Nouns", "Pronouns", "Verbs", "Adverbs", "Adjectives", "Articles", "Prepositions", "Conjunctions", "Tenses", "Punctuation", "Reading Comprehension"];
export const ICSO_TOPICS_GRADE6 = ["Introduction to Computers", "Parts of a Computer", "Uses of Computer", "Input and Output Devices", "Introduction to MS-Paint", "Introduction to MS-Word 2010", "Internet and E-mail", "Introduction to Scratch Programming"];

export type BadgeId = 
  | 'firstQuiz'
  | 'perfectScore'
  | 'hotStreak'
  | 'subjectSovereign'
  | 'mockMaster'
  | 'quickThinker'
  | 'studyHabit'
  | 'revalidator'
  | 'topicExplorer'
  | 'centuryClub'
  | 'quizArchitect'
  | 'marathoner'
  | 'brainiac'
  | 'topicTitan'
  | 'polymath'
  | 'examAce'
  | 'veteranExaminer'
  | 'comebackKid';

export interface Badge {
    id: BadgeId;
    name: string;
    description: string;
    icon: string; // Emoji or SVG name
    progress?: (stats: UserStats, history: QuizResult[]) => { current: number; goal: number } | null;
}

export interface UserStats {
  quizzesCompleted: number;
  perfectScores: number;
  hotStreak: number;
  completedOnDates: string[];
  subjectsMastered: Partial<Record<Subject, boolean>>;
  mockExamsCompleted: number;
  totalCorrectAnswers: number;
  revalidationUsed: boolean;
  practicedFromSuggestion: boolean;
  topicsPracticed: string[];
  mockExamScores: Partial<Record<Subject, number[]>>;
}