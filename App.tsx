import React, { useState, useCallback, useEffect } from 'react';
import { AppView, Question, QuizResult, Subject, Difficulty, Grade } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { generateQuestions, revalidateQuestion } from './services/geminiService';

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
  const [instantFeedbackMode, setInstantFeedbackMode] = useState<boolean>(false);
  const [quizGrade, setQuizGrade] = useState<Grade>(7);
  const [prefilledSetup, setPrefilledSetup] = useState<{ subject: Subject; grade: Grade; topic: string } | null>(null);

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
          setQuestionBank([]); 
        }
      }
    };
    seedQuestionBank();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleStartQuiz = useCallback(async (subject: Subject, topics: string[], count: number, difficulty: Difficulty, isMockFlag: boolean, grade: Grade, instantFeedback: boolean) => {
    setError(null);
    setIsMock(isMockFlag);
    setInstantFeedbackMode(instantFeedback);
    setQuizGrade(grade);
    setLoadingState({ active: true, message: 'Preparing your quiz...', progress: 0 });
    
    const existingQuestionIds = new Set(history.flatMap(h => h.questions.map(q => q.id)));
    
    const localQuestions = questionBank.filter(q =>
        q.subject === subject &&
        q.grade === grade &&
        topics.includes(q.topic) &&
        q.difficulty === difficulty &&
        !existingQuestionIds.has(q.id)
    );
    
    localQuestions.sort(() => Math.random() - 0.5);
    const questionsFromBank = localQuestions.slice(0, count);
    const remainingCount = count - questionsFromBank.length;

    if (count > 5 && questionsFromBank.length > 0) {
        setQuizQuestions(questionsFromBank);
        setView('quiz');
        setLoadingState({ active: false, message: '', progress: 0 });

        if (remainingCount > 0) {
            try {
                const allUsedIds = [...Array.from(existingQuestionIds), ...questionBank.map(q => q.id)];
                const aiQuestions = await generateQuestions(subject, topics, remainingCount, difficulty, allUsedIds, grade);
                
                if (aiQuestions.length > 0) {
                    setQuizQuestions(prevQuestions => [...prevQuestions, ...aiQuestions]);
                    setQuestionBank(prevBank => {
                        const newQuestionsToAdd = aiQuestions.filter(
                            aiQ => !prevBank.some(bankQ => bankQ.id === aiQ.id)
                        );
                        return [...prevBank, ...newQuestionsToAdd];
                    });
                }
            } catch (backgroundError) {
                console.error("Failed to fetch background questions:", backgroundError);
            }
        }
        return;
    }

    try {
        await new Promise(res => setTimeout(res, 300));
        setLoadingState(prev => ({ ...prev, message: 'Searching our question bank...', progress: 10 }));

        await new Promise(res => setTimeout(res, 300));
        setLoadingState(prev => ({ ...prev, message: `Found ${questionsFromBank.length} of ${count} questions locally.`, progress: 30 }));

        let aiQuestions: Question[] = [];
        if (remainingCount > 0) {
            await new Promise(res => setTimeout(res, 300));
            setLoadingState(prev => ({ ...prev, message: `Asking our AI for ${remainingCount} new questions...`, progress: 40 }));
            
            const allUsedIds = [...Array.from(existingQuestionIds), ...questionBank.map(q => q.id)];
            aiQuestions = await generateQuestions(subject, topics, remainingCount, difficulty, allUsedIds, grade);
            
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
  
  const handleQuizComplete = useCallback(async (result: QuizResult) => {
    if (!result.isMock) {
        setLoadingState({ active: true, message: 'AI is verifying your answers...', progress: 0 });
        try {
            const originalQuestions = result.questions;
            const incorrectIndices = originalQuestions
                .map((q, i) => result.userAnswers[i] !== q.correctAnswerIndex ? i : -1)
                .filter(i => i !== -1);

            if (incorrectIndices.length === 0) {
                const finalResult = { ...result, grade: quizGrade, originalQuestions: originalQuestions };
                setCurrentResult(finalResult);
                setHistory(prev => [...prev, finalResult].slice(-10));
                setView('report');
                setLoadingState({ active: false, message: '', progress: 0 });
                return;
            }

            const finalQuestions = [...originalQuestions];
            let revalidatedCount = 0;
            const numToRevalidate = incorrectIndices.length;

            const revalidationPromises = incorrectIndices.map(async (index) => {
                const validatedQ = await revalidateQuestion(originalQuestions[index]);
                finalQuestions[index] = validatedQ;
                revalidatedCount++;
                setLoadingState(prev => ({
                    ...prev,
                    progress: Math.round((revalidatedCount / numToRevalidate) * 100),
                    message: `AI is verifying your answers... (${revalidatedCount}/${numToRevalidate})`
                }));
            });

            await Promise.all(revalidationPromises);

            const finalScore = finalQuestions.reduce((acc, q, index) => {
                return result.userAnswers[index] === q.correctAnswerIndex ? acc + 1 : acc;
            }, 0);

            const finalResult: QuizResult = {
                ...result,
                questions: finalQuestions,
                score: finalScore,
                originalQuestions: originalQuestions,
                grade: quizGrade,
            };

            setCurrentResult(finalResult);
            setHistory(prev => [...prev, finalResult].slice(-10));
            setView('report');

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to revalidate quiz answers.");
            setView('setup');
        } finally {
            setLoadingState({ active: false, message: '', progress: 0 });
        }
    } else {
        const resultWithGrade = { ...result, grade: quizGrade };
        setCurrentResult(resultWithGrade);
        setHistory(prev => [...prev, resultWithGrade].slice(-10));
        setView('report');
    }
  }, [setHistory, quizGrade]);
  
  const handleQuestionRevalidated = useCallback((questionIndex: number, updatedQuestion: Question) => {
    setQuizQuestions(currentQuestions => {
        if (currentQuestions[questionIndex] && JSON.stringify(currentQuestions[questionIndex]) !== JSON.stringify(updatedQuestion)) {
            const newQuestions = [...currentQuestions];
            newQuestions[questionIndex] = updatedQuestion;
            return newQuestions;
        }
        return currentQuestions;
    });
  }, []);
  
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
  
  const handlePracticeTopic = (subject: Subject, grade: Grade, topic: string) => {
      setPrefilledSetup({ subject, grade, topic });
      setView('setup');
  };
  
  const handlePracticeMistakes = () => {
      const incorrectQuestionsMap = new Map<string, Question>();
      history.forEach(result => {
        result.questions.forEach((q, index) => {
          if (result.userAnswers[index] !== q.correctAnswerIndex) {
            incorrectQuestionsMap.set(q.id, q);
          }
        });
      });

      const questions = Array.from(incorrectQuestionsMap.values());
      if (questions.length > 0) {
        questions.sort(() => Math.random() - 0.5); // Shuffle
        setQuizQuestions(questions);
        setIsMock(false);
        setInstantFeedbackMode(true);
        setQuizGrade(questions[0].grade);
        setView('quiz');
      } else {
        alert("You have no past mistakes to practice. Great job!");
      }
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
        return <Quiz questions={quizQuestions} isMock={isMock} instantFeedback={instantFeedbackMode} onQuizComplete={handleQuizComplete} onQuestionRevalidated={handleQuestionRevalidated} />;
      case 'report':
        return currentResult && <ReportCard result={currentResult} onBackToHome={resetToHome} onRetakeQuiz={resetToHome} onPracticeTopic={handlePracticeTopic} />;
      case 'history':
        return <History history={history} onBackToHome={resetToHome} onViewReport={handleViewReportFromHistory} onPracticeMistakes={handlePracticeMistakes} />;
      case 'setup':
      default:
        return <QuizSetup onStartQuiz={handleStartQuiz} onViewHistory={handleViewHistory} prefilledSetup={prefilledSetup} onPrefillConsumed={() => setPrefilledSetup(null)} />;
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