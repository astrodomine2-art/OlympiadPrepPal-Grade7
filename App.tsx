import React, { useState, useCallback, useEffect } from 'react';
import { AppView, Question, QuizResult, Subject, Difficulty } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { generateQuestions } from './services/geminiService';

import QuizSetup from './components/QuizSetup';
import Quiz from './components/Quiz';
import ReportCard from './components/ReportCard';
import History from './components/History';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('setup');
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentResult, setCurrentResult] = useState<QuizResult | null>(null);
  const [history, setHistory] = useLocalStorage<QuizResult[]>('quizHistory', []);
  const [questionBank, setQuestionBank] = useLocalStorage<Question[]>('questionBank', []);
  const [loadingState, setLoadingState] = useState<{
    active: boolean;
    message: string;
    progress: number;
  }>({ active: false, message: '', progress: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState<boolean>(false);

  useEffect(() => {
    // Seed the question bank from JSON on first load if it's empty.
    const seedQuestionBank = async () => {
      if (questionBank.length === 0) {
        try {
          const response = await fetch('/questions.json');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: Question[] = await response.json();
          setQuestionBank(data);
        } catch (err) {
          console.error("Failed to load initial question bank:", err);
          // Set a default empty array to avoid repeated fetch attempts on error
          setQuestionBank([]); 
        }
      }
    };
    seedQuestionBank();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleStartQuiz = useCallback(async (subject: Subject, topics: string[], count: number, difficulty: Difficulty, isMockFlag: boolean) => {
    setLoadingState({ active: true, message: 'Preparing your quiz...', progress: 0 });
    setError(null);
    setIsMock(isMockFlag);

    try {
        await new Promise(res => setTimeout(res, 300));
        setLoadingState(prev => ({ ...prev, message: 'Searching our question bank...', progress: 10 }));

        const existingQuestionIds = new Set(history.flatMap(h => h.questions.map(q => q.id)));

        // 1. Filter local question bank from localStorage
        let localQuestions = questionBank.filter(q =>
            q.subject === subject &&
            topics.includes(q.topic) &&
            q.difficulty === difficulty &&
            !existingQuestionIds.has(q.id)
        );

        localQuestions.sort(() => Math.random() - 0.5);

        const questionsFromBank = localQuestions.slice(0, count);
        const remainingCount = count - questionsFromBank.length;

        await new Promise(res => setTimeout(res, 300));
        setLoadingState(prev => ({ ...prev, message: `Found ${questionsFromBank.length} of ${count} questions locally.`, progress: 30 }));

        let aiQuestions: Question[] = [];
        if (remainingCount > 0) {
            await new Promise(res => setTimeout(res, 300));
            setLoadingState(prev => ({ ...prev, message: `Asking our AI for ${remainingCount} new questions...`, progress: 40 }));
            
            const allUsedIds = [...Array.from(existingQuestionIds), ...questionBank.map(q => q.id)];
            aiQuestions = await generateQuestions(subject, topics, remainingCount, difficulty, allUsedIds);
            
            await new Promise(res => setTimeout(res, 300));
            setLoadingState(prev => ({ ...prev, progress: 80, message: 'Received new questions from AI!' }));

            if (aiQuestions.length > 0) {
              setQuestionBank(prevBank => {
                  const newQuestionsToAdd = aiQuestions.filter(
                      aiQ => !prevBank.some(bankQ => bankQ.id === aiQ.id)
                  );
                  return [...prevBank, ...newQuestionsToAdd];
              });
            }
        }

        const finalQuestions = [...questionsFromBank, ...aiQuestions];
        
        if (finalQuestions.length < count) {
             console.warn(`Could only find ${finalQuestions.length} questions, but ${count} were requested.`);
        }

        if (finalQuestions.length === 0) {
             throw new Error("Could not find or generate any questions for the selected criteria. Please try different topics or difficulties.");
        }
        
        await new Promise(res => setTimeout(res, 300));
        setLoadingState(prev => ({ ...prev, progress: 90, message: 'Finalizing and shuffling...' }));
        finalQuestions.sort(() => Math.random() - 0.5);

        setQuizQuestions(finalQuestions);

        await new Promise(res => setTimeout(res, 300));
        setLoadingState(prev => ({ ...prev, progress: 100, message: 'All set!' }));

        await new Promise(res => setTimeout(res, 500));
        setView('quiz');

    } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
        setView('setup');
    } finally {
        setLoadingState({ active: false, message: '', progress: 0 });
    }
  }, [history, questionBank, setQuestionBank]);
  
  const handleQuizComplete = useCallback((result: QuizResult) => {
    setCurrentResult(result);
    setHistory(prevHistory => {
        const updatedHistory = [...prevHistory, result];
        if (updatedHistory.length > 10) {
            // Keep only the last 10 reports
            return updatedHistory.slice(updatedHistory.length - 10);
        }
        return updatedHistory;
    });
    setView('report');
  }, [setHistory]);
  
  const handleQuestionRevalidated = (questionIndex: number, updatedQuestion: Question) => {
    setQuizQuestions(currentQuestions => {
        const newQuestions = [...currentQuestions];
        newQuestions[questionIndex] = updatedQuestion;
        return newQuestions;
    });
  };
  
  const handleViewHistory = () => {
    setView('history');
  };

  const handleViewReportFromHistory = (result: QuizResult) => {
    setCurrentResult(result);
    setView('report');
  };

  const resetToHome = () => {
    setView('setup');
    setQuizQuestions([]);
    setCurrentResult(null);
    setError(null);
  };
  
  const renderContent = () => {
    if (loadingState.active) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Spinner message={loadingState.message} progress={loadingState.progress} />
        </div>
      );
    }

    if (error) {
       return (
         <div className="flex flex-col items-center justify-center h-screen text-center p-4">
             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-lg" role="alert">
                <strong className="font-bold">Oh no! </strong>
                <span className="block sm:inline">{error}</span>
             </div>
             <button onClick={resetToHome} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Try Again
             </button>
         </div>
       );
    }

    switch (view) {
      case 'quiz':
        return <Quiz questions={quizQuestions} isMock={isMock} onQuizComplete={handleQuizComplete} onQuestionRevalidated={handleQuestionRevalidated} />;
      case 'report':
        return currentResult && <ReportCard result={currentResult} onBackToHome={resetToHome} onRetakeQuiz={resetToHome} />;
      case 'history':
        return <History history={history} onBackToHome={resetToHome} onViewReport={handleViewReportFromHistory} />;
      case 'setup':
      default:
        return <QuizSetup onStartQuiz={handleStartQuiz} onViewHistory={handleViewHistory} />;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="container mx-auto py-8">
        {renderContent()}
      </div>
    </main>
  );
};

export default App;