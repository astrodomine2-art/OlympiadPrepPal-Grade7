import { Badge } from '../../types';

export const BADGE_DEFS: Record<string, Badge> = {
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
  },
  subjectPro: {
    id: 'subjectPro',
    name: 'Subject Pro',
    description: 'Scored over 90% on quizzes for all topics in a single subject.',
    icon: '🎓',
  },
  mockMaster: {
    id: 'mockMaster',
    name: 'Mock Master',
    description: 'Completed a full-length mock exam.',
    icon: '🏆',
  },
  quickThinker: {
    id: 'quickThinker',
    name: 'Quick Thinker',
    description: 'Finished a quiz with an average of less than 45 seconds per question.',
    icon: '⚡',
  },
  studyHabit: {
    id: 'studyHabit',
    name: 'Study Habit',
    description: 'Completed a quiz on 5 different days.',
    icon: '🗓️',
  },
  revalidator: {
    id: 'revalidator',
    name: 'Fact Checker',
    description: 'Used the "Revalidate Question" feature for the first time.',
    icon: '✅',
  },
  topicExplorer: {
    id: 'topicExplorer',
    name: 'Topic Explorer',
    description: 'Practiced a topic from a suggestion on the report card.',
    icon: '🗺️',
  },
  centuryClub: {
    id: 'centuryClub',
    name: 'Century Club',
    description: 'Answered 100 questions correctly.',
    icon: '💯',
  },
};
