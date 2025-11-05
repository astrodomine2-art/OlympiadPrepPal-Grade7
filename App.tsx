
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
    setIsLoading(true);
    setError(null);
    setIsMock(isMockFlag);

    try {
        const existingQuestionIds = new Set(history.flatMap(h => h.questions.map(q => q.id)));

        // 1. Filter local question bank from localStorage
        let localQuestions = questionBank.filter(q =>
            q.subject === subject &&
            topics.includes(q.topic) &&
            q.difficulty === difficulty &&
            !existingQuestionIds.has(q.id)
        );

        // Shuffle to get random questions
        localQuestions.sort(() => Math.random() - 0.5);

        const questionsFromBank = localQuestions.slice(0, count);
        const remainingCount = count - questionsFromBank.length;

        let aiQuestions: Question[] = [];
        if (remainingCount > 0) {
            const allUsedIds = [...Array.from(existingQuestionIds), ...questionBank.map(q => q.id)];
            aiQuestions = await generateQuestions(subject, topics, remainingCount, difficulty, allUsedIds);
            
            // Add newly generated questions to the main bank
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
        
        // Shuffle the final list to mix local and AI questions
        finalQuestions.sort(() => Math.random() - 0.5);

        setQuizQuestions(finalQuestions);
        setView('quiz');

    } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
        setView('setup');
    } finally {
        setIsLoading(false);
    }
  }, [history, questionBank, setQuestionBank]);
  
  const handleQuizComplete = useCallback((result: QuizResult) => {
    setCurrentResult(result);
    setHistory([...history, result]);
    setView('report');
  }, [history, setHistory]);
  
  const handleViewHistory = () => {
    setView('history');
  };

  const handleViewReportFromHistory = (result: QuizResult) => {
    setCurrentResult(result);
    setView('report');
  };
  
  const handleClearHistory = () => {
    if(window.confirm("Are you sure you want to clear your entire quiz history? This action cannot be undone.")){
        setHistory([]);
    }
  };

  const resetToHome = () => {
    setView('setup');
    setQuizQuestions([]);
    setCurrentResult(null);
    setError(null);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Spinner message="Generating your custom quiz... This might take a moment." />
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
        return <Quiz questions={quizQuestions} isMock={isMock} onQuizComplete={handleQuizComplete} />;
      case 'report':
        return currentResult && <ReportCard result={currentResult} onBackToHome={resetToHome} onRetakeQuiz={resetToHome} />;
      case 'history':
        return <History history={history} onBackToHome={resetToHome} onViewReport={handleViewReportFromHistory} onClearHistory={handleClearHistory}/>;
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
