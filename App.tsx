import React, { useState, useEffect, useCallback } from 'react';
import QuizSetup from './components/QuizSetup';
import Quiz from './components/Quiz';
import ReportCard from './components/ReportCard';
import History from './components/History';
import Spinner from './components/Spinner';
import { generateQuestions } from './services/geminiService';
import { Question, QuizResult, Subject, Difficulty, Grade, Badge, BadgeId, UserStats, IMO_TOPICS, NSO_TOPICS, IEO_TOPICS, ICSO_TOPICS, IMO_TOPICS_GRADE6, NSO_TOPICS_GRADE6, IEO_TOPICS_GRADE6, ICSO_TOPICS_GRADE6 } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { BADGE_DEFS } from './components/gamification/BadgeDefs';
import BadgeNotification from './components/gamification/BadgeNotification';

type View = 'setup' | 'quiz' | 'report' | 'history';

interface QuizSettings {
  subject: Subject;
  topics: string[];
  count: number;
  difficulty: Difficulty;
  isMock: boolean;
  grade: Grade;
  instantFeedback: boolean;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('setup');
  const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [history, setHistory] = useLocalStorage<QuizResult[]>('quizHistory', []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [prefilledSetup, setPrefilledSetup] = useState<{ subject: Subject; grade: Grade; topic: string; } | null>(null);
  
  // Gamification state
  const [unlockedBadges, setUnlockedBadges] = useLocalStorage<BadgeId[]>('unlockedBadges', []);
  const [userStats, setUserStats] = useLocalStorage<UserStats>('userStats', {
    quizzesCompleted: 0,
    perfectScores: 0,
    hotStreak: 0,
    completedOnDates: [],
    subjectsMastered: {},
    mockExamsCompleted: 0,
    totalCorrectAnswers: 0,
    revalidationUsed: false,
    practicedFromSuggestion: false,
    topicsPracticed: [],
    mockExamScores: {},
  });
  const [badgeQueue, setBadgeQueue] = useState<Badge[]>([]);

  const showNextBadge = () => {
    setBadgeQueue(prev => prev.slice(1));
  };
  
  const unlockBadge = useCallback((badgeId: BadgeId) => {
    if (!unlockedBadges.includes(badgeId)) {
      setUnlockedBadges(prev => [...prev, badgeId]);
      setBadgeQueue(prev => [...prev, BADGE_DEFS[badgeId]]);
    }
  }, [unlockedBadges, setUnlockedBadges]);

  const handleStartQuiz = async (
    subject: Subject,
    topics: string[],
    count: number,
    difficulty: Difficulty,
    isMock: boolean,
    grade: Grade,
    instantFeedback: boolean
  ) => {
    setIsLoading(true);
    setLoadingMessage(isMock ? 'Generating your mock exam... This might take a moment.' : 'Generating your custom quiz...');
    setError(null);
    setQuizSettings({ subject, topics, count, difficulty, isMock, grade, instantFeedback });

    try {
      const existingIds = history.flatMap(h => h.questions.map(q => q.id));
      const fetchedQuestions = await generateQuestions(subject, topics, count, difficulty, existingIds, grade);
      if (fetchedQuestions.length === 0) {
        throw new Error("The AI didn't return any questions. Please try different topics or settings.");
      }
      setQuestions(fetchedQuestions);
      setCurrentView('quiz');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while generating questions.');
      setCurrentView('setup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizComplete = (result: QuizResult) => {
    const newHistory = [...history, result];
    setHistory(newHistory);
    setQuizResult(result);
    setCurrentView('report');

    // --- Gamification Logic ---
    const today = new Date().toDateString();
    
    setUserStats(prevStats => {
        const newStats = { ...prevStats };
        newStats.quizzesCompleted = (newStats.quizzesCompleted || 0) + 1;
        newStats.totalCorrectAnswers = (newStats.totalCorrectAnswers || 0) + result.score;
        
        if (!newStats.completedOnDates.includes(today)) {
            newStats.completedOnDates = [...newStats.completedOnDates, today];
        }

        const newTopics = [...new Set([...(newStats.topicsPracticed || []), ...result.topics])];
        newStats.topicsPracticed = newTopics;
        
        const percentage = (result.score / result.questions.length) * 100;
        
        // --- Badge Unlocking Logic ---
        unlockBadge('firstQuiz');

        // Streaks & Performance
        if (percentage === 100 && result.questions.length >= 10) {
            newStats.perfectScores = (newStats.perfectScores || 0) + 1;
            unlockBadge('perfectScore');
        }
        newStats.hotStreak = percentage >= 80 ? (newStats.hotStreak || 0) + 1 : 0;
        if (newStats.hotStreak >= 3) unlockBadge('hotStreak');
        if (newStats.totalCorrectAnswers >= 100) unlockBadge('centuryClub');
        if ((result.timeTaken / result.questions.length) < 45) unlockBadge('quickThinker');
        if (newStats.completedOnDates.length >= 5) unlockBadge('studyHabit');

        // Custom Quiz Badges
        if (!result.isMock) {
            if (result.questions.length >= 50) unlockBadge('marathoner');
            else if (result.questions.length >= 25) unlockBadge('quizArchitect');
            
            if (quizSettings?.difficulty === 'HOTS (Achiever Section)') unlockBadge('brainiac');
        }

        // Topic & Subject Badges
        if (result.topics.length === 1 && percentage === 100) unlockBadge('topicTitan');
        if (newTopics.length >= 10) unlockBadge('polymath');

        const allTopicsForSubject = {
            [Subject.IMO]: result.grade === 6 ? IMO_TOPICS_GRADE6 : IMO_TOPICS,
            [Subject.NSO]: result.grade === 6 ? NSO_TOPICS_GRADE6 : NSO_TOPICS,
            [Subject.IEO]: result.grade === 6 ? IEO_TOPICS_GRADE6 : IEO_TOPICS,
            [Subject.ICSO]: result.grade === 6 ? ICSO_TOPICS_GRADE6 : ICSO_TOPICS,
        }[result.subject];
        
        if (percentage > 90 && result.topics.length === allTopicsForSubject.length) {
            unlockBadge('subjectSovereign');
        }

        // Mock Exam Badges
        if (result.isMock) {
            newStats.mockExamsCompleted = (newStats.mockExamsCompleted || 0) + 1;
            unlockBadge('mockMaster');

            if (percentage >= 85) unlockBadge('examAce');

            const subjectMocks = newHistory.filter(h => h.isMock && h.subject === result.subject);
            if (subjectMocks.length >= 3) unlockBadge('veteranExaminer');
            
            const scores = subjectMocks.map(r => (r.score / r.questions.length) * 100);
            if (scores.length >= 2) {
                const lastScore = scores[scores.length - 2];
                const currentScore = scores[scores.length - 1];
                if (currentScore >= lastScore * 1.1) {
                    unlockBadge('comebackKid');
                }
            }
        }
        return newStats;
    });
  };

  const handleRetakeQuiz = () => {
    if (quizSettings) {
      handleStartQuiz(
        quizSettings.subject,
        quizSettings.topics,
        quizSettings.count,
        quizSettings.difficulty,
        quizSettings.isMock,
        quizSettings.grade,
        quizSettings.instantFeedback
      );
    } else {
      setCurrentView('setup');
    }
  };

  const handlePracticeTopic = (subject: Subject, grade: Grade, topic: string) => {
     setPrefilledSetup({ subject, grade, topic });
     setCurrentView('setup');
     setUserStats(prev => ({...prev, practicedFromSuggestion: true}));
     unlockBadge('topicExplorer');
  };

  const handleViewHistory = () => {
    setCurrentView('history');
  };

  const handleBackToHome = () => {
    setQuizResult(null);
    setQuestions([]);
    setCurrentView('setup');
  };
  
  const handleQuestionRevalidated = (index: number, updatedQuestion: Question) => {
      setQuestions(prevQuestions => {
          const newQuestions = [...prevQuestions];
          newQuestions[index] = updatedQuestion;
          return newQuestions;
      });
      setUserStats(prev => {
          if (!prev.revalidationUsed) {
              unlockBadge('revalidator');
              return {...prev, revalidationUsed: true};
          }
          return prev;
      });
  };
  
  const handlePracticeMistakes = () => {
    const allMistakes = history.flatMap(result =>
      result.questions.filter((q, index) => result.userAnswers[index] !== q.correctAnswerIndex)
    );
    if (allMistakes.length > 0) {
      // Create a quiz from a sample of mistakes
      const mistakeSample = allMistakes.sort(() => 0.5 - Math.random()).slice(0, 10);
      setQuestions(mistakeSample);
      setQuizSettings({
        subject: mistakeSample[0].subject,
        topics: [...new Set(mistakeSample.map(q => q.topic))],
        count: mistakeSample.length,
        difficulty: 'Medium', // Or some other logic
        isMock: false,
        grade: mistakeSample[0].grade,
        instantFeedback: true,
      });
      setCurrentView('quiz');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-screen"><Spinner message={loadingMessage} /></div>;
    }
    if (error) {
      return (
        <div className="flex flex-col justify-center items-center h-screen p-4 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">An Error Occurred</h2>
          <p className="text-slate-700 bg-red-100 p-4 rounded-lg">{error}</p>
          <button onClick={handleBackToHome} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded font-semibold">
            Back to Setup
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'quiz':
        return <Quiz questions={questions} isMock={quizSettings?.isMock || false} instantFeedback={quizSettings?.instantFeedback || false} onQuizComplete={handleQuizComplete} onQuestionRevalidated={handleQuestionRevalidated}/>;
      case 'report':
        return quizResult && <ReportCard result={quizResult} onBackToHome={handleBackToHome} onRetakeQuiz={handleRetakeQuiz} onPracticeTopic={handlePracticeTopic} />;
      case 'history':
        return <History history={history} onBackToHome={handleBackToHome} onViewReport={(result) => { setQuizResult(result); setCurrentView('report'); }} onPracticeMistakes={handlePracticeMistakes} unlockedBadges={unlockedBadges} userStats={userStats} />;
      case 'setup':
      default:
        return <QuizSetup onStartQuiz={handleStartQuiz} onViewHistory={handleViewHistory} prefilledSetup={prefilledSetup} onPrefillConsumed={() => setPrefilledSetup(null)} />;
    }
  };

  return (
    <main className="bg-slate-50 min-h-screen font-sans text-slate-900">
      <BadgeNotification badge={badgeQueue[0] || null} onDismiss={showNextBadge} />
      {renderContent()}
    </main>
  );
};

export default App;