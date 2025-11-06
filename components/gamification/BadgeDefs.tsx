import { Badge, BadgeId, UserStats, QuizResult, Subject } from '../../types';

export const BADGE_DEFS: Record<BadgeId, Badge> = {
  firstQuiz: {
    id: 'firstQuiz',
    name: 'First Step',
    description: 'Completed your very first quiz.',
    icon: '🚀',
  },
  perfectScore: {
    id: 'perfectScore',
    name: 'Perfectionist',
    description: 'Achieved a perfect score on a quiz of 10+ questions.',
    icon: '🎯',
  },
  hotStreak: {
    id: 'hotStreak',
    name: 'Hot Streak',
    description: 'Completed 3 quizzes in a row with a score of 80% or higher.',
    icon: '🔥',
    progress: (stats) => ({ current: stats.hotStreak || 0, goal: 3 }),
  },
  centuryClub: {
    id: 'centuryClub',
    name: 'Century Club',
    description: 'Answered 100 questions correctly.',
    icon: '💯',
    progress: (stats) => ({ current: stats.totalCorrectAnswers || 0, goal: 100 }),
  },
  studyHabit: {
    id: 'studyHabit',
    name: 'Study Habit',
    description: 'Completed a quiz on 5 different days.',
    icon: '🗓️',
    progress: (stats) => ({ current: stats.completedOnDates?.length || 0, goal: 5 }),
  },
  quickThinker: {
    id: 'quickThinker',
    name: 'Quick Thinker',
    description: 'Finished a quiz with an average of less than 45 seconds per question.',
    icon: '⚡',
  },
  mockMaster: {
    id: 'mockMaster',
    name: 'Mock Master',
    description: 'Completed a full-length mock exam.',
    icon: '🏆',
  },
  examAce: {
    id: 'examAce',
    name: 'Exam Ace',
    description: 'Scored 85% or higher on a full mock exam.',
    icon: '✨',
  },
  veteranExaminer: {
    id: 'veteranExaminer',
    name: 'Veteran Examiner',
    description: 'Completed 3 mock exams for a single subject.',
    icon: '🎖️',
    progress: (stats, history) => {
        const mockExamsBySubject: Record<string, number> = history
            .filter(r => r.isMock)
            .reduce((acc, r) => {
                acc[r.subject] = (acc[r.subject] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
        const maxMocks = Object.values(mockExamsBySubject).length > 0 ? Math.max(...Object.values(mockExamsBySubject)) : 0;
        return { current: maxMocks, goal: 3 };
    }
  },
  comebackKid: {
    id: 'comebackKid',
    name: 'Comeback Kid',
    description: 'Improved your mock exam score by 10% or more.',
    icon: '📈',
  },
  quizArchitect: {
    id: 'quizArchitect',
    name: 'Quiz Architect',
    description: 'Created a custom quiz with 25+ questions.',
    icon: '🏗️',
  },
  marathoner: {
    id: 'marathoner',
    name: 'Marathoner',
    description: 'Completed a custom quiz with 50 questions.',
    icon: '🏅',
  },
  brainiac: {
    id: 'brainiac',
    name: 'Brainiac',
    description: 'Completed a quiz with only HOTS questions.',
    icon: '🧠',
  },
  topicTitan: {
    id: 'topicTitan',
    name: 'Topic Titan',
    description: 'Achieved a perfect score on a single-topic quiz.',
    icon: '👑',
  },
  topicExplorer: {
    id: 'topicExplorer',
    name: 'Topic Explorer',
    description: 'Practiced a topic from a suggestion on the report card.',
    icon: '🗺️',
  },
  polymath: {
    id: 'polymath',
    name: 'Polymath',
    description: 'Practiced at least 10 different topics.',
    icon: '📚',
    progress: (stats) => ({ current: stats.topicsPracticed?.length || 0, goal: 10 }),
  },
  subjectSovereign: {
    id: 'subjectSovereign',
    name: 'Subject Sovereign',
    description: 'Scored over 90% on a quiz covering all topics in a subject.',
    icon: '🌍',
  },
  revalidator: {
    id: 'revalidator',
    name: 'Fact Checker',
    description: 'Used the "Revalidate Question" feature for the first time.',
    icon: '✅',
  },
};