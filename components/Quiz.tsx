import React, { useState, useEffect, useRef } from 'react';
import { Question, QuizResult, Grade } from '../types';
import { revalidateQuestion } from '../services/geminiService';
import Button from './common/Button';
import Card from './common/Card';

interface QuizProps {
  questions: Question[];
  isMock: boolean;
  onQuizComplete: (result: QuizResult) => void;
  onQuestionRevalidated: (index: number, updatedQuestion: Question) => void;
}

const Quiz: React.FC<QuizProps> = ({ questions, isMock, onQuizComplete, onQuestionRevalidated }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const timerIntervalRef = useRef<number | null>(null);
  
  const mockDuration = questions.length * 60; // 60 seconds per question
  const [timeLeft, setTimeLeft] = useState(mockDuration);
  
  const [revalidationState, setRevalidationState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error', message: string }>({ status: 'idle', message: '' });
  const [revalidatedIndices, setRevalidatedIndices] = useState<Set<number>>(new Set());
  const messageTimerRef = useRef<number | null>(null);

  const originalQuestionsRef = useRef(questions);
  const autoValidationStartedRef = useRef(false);
  const [revalidationProgress, setRevalidationProgress] = useState(0);

  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);

  const prevQuestionsRef = useRef<Question[]>();
  useEffect(() => {
    prevQuestionsRef.current = questions;
  });
  const prevQuestions = prevQuestionsRef.current;

  useEffect(() => {
    // Sync userAnswers array with questions array, crucial for background question fetching.
    setUserAnswers(prevAnswers => {
        if (prevAnswers.length < questions.length) {
            const newAnswers = [...prevAnswers];
            while(newAnswers.length < questions.length) {
                newAnswers.push(null);
            }
            return newAnswers;
        }
        return prevAnswers;
    });
  }, [questions]);

  useEffect(() => {
    if (isMock) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    setStartTime(Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMock]);
  
  useEffect(() => {
    // Show notification if the current question is updated by the background revalidation
    if (isMock && prevQuestions && prevQuestions.length > 0 &&
        prevQuestions[currentQuestionIndex] && questions[currentQuestionIndex] &&
        JSON.stringify(prevQuestions[currentQuestionIndex]) !== JSON.stringify(questions[currentQuestionIndex])) {

        if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
        
        setRevalidationState({ status: 'success', message: 'This question was just updated by our AI for accuracy!' });
        
        messageTimerRef.current = window.setTimeout(() => {
            setRevalidationState({ status: 'idle', message: '' });
        }, 4000);
    }
  }, [questions, currentQuestionIndex, prevQuestions, isMock]);
  
  useEffect(() => {
    if (isMock && questions.length > 0 && !autoValidationStartedRef.current) {
        autoValidationStartedRef.current = true;
        const revalidateAll = async () => {
            const initialQuestions = originalQuestionsRef.current;
            const promises = initialQuestions.map((q, index) =>
                revalidateQuestion(q)
                    .then(validatedQ => {
                        onQuestionRevalidated(index, validatedQ);
                    })
                    .catch(err => {
                        console.error(`Failed to revalidate question ${index}:`, err);
                    })
                    .finally(() => {
                        setRevalidationProgress(p => p + 1);
                    })
            );
            await Promise.allSettled(promises);
        };
        revalidateAll();
    }
  }, [isMock, questions.length, onQuestionRevalidated]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, []);
  
  useEffect(() => {
    // Reset revalidation message when question changes
    setRevalidationState({ status: 'idle', message: '' });
    setSelectedOption(userAnswers[currentQuestionIndex] ?? null);
  }, [currentQuestionIndex, userAnswers]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNavigatorOpen(false);
      }
    };
    if (isNavigatorOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNavigatorOpen]);

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNext = () => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedOption;
    setUserAnswers(newAnswers);
    setSelectedOption(null);
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const handleSubmit = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const finalAnswers = [...userAnswers];
    finalAnswers[currentQuestionIndex] = selectedOption;
    while(finalAnswers.length < questions.length) {
        finalAnswers.push(null);
    }
    
    const score = finalAnswers.reduce((acc, answer, index) => {
      if (index < questions.length && answer === questions[index].correctAnswerIndex) {
          return acc + 1;
      }
      return acc;
    }, 0);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    if (!questions || questions.length === 0) {
      console.error('handleSubmit called without questions.');
      return;
    }

    onQuizComplete({
      id: new Date().toISOString(),
      date: new Date().toLocaleString(),
      questions,
      userAnswers: finalAnswers,
      score,
      subject: questions[0].subject,
      topics: [...new Set(questions.map(q => q.topic))],
      timeTaken,
      isMock,
      grade: questions[0].grade,
      originalQuestions: isMock ? originalQuestionsRef.current : undefined,
    });
  };
  
  const handleRevalidate = async () => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    setRevalidationState({ status: 'loading', message: 'Revalidating with AI...' });
    
    try {
        const originalQuestion = questions[currentQuestionIndex];
        const validatedQuestion = await revalidateQuestion(originalQuestion);
        
        onQuestionRevalidated(currentQuestionIndex, validatedQuestion);
        setRevalidatedIndices(prev => new Set(prev).add(currentQuestionIndex));

        const wasChanged = JSON.stringify(originalQuestion) !== JSON.stringify(validatedQuestion);
        const message = wasChanged ? "AI found an error and corrected the question." : "AI confirmed the question is correct.";
        
        setRevalidationState({ status: 'success', message });

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        setRevalidationState({ status: 'error', message });
    } finally {
        messageTimerRef.current = window.setTimeout(() => {
            setRevalidationState({ status: 'idle', message: '' });
        }, 4000);
    }
  };
  
  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setIsNavigatorOpen(false);
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  
  if (!currentQuestion) {
      return (
          <div className="flex justify-center items-center h-64">
              <p>Loading question...</p>
          </div>
      )
  }

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isRevalidating = revalidationState.status === 'loading';
  const hasBeenRevalidated = revalidatedIndices.has(currentQuestionIndex);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {isNavigatorOpen && (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={() => setIsNavigatorOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="navigator-title"
        >
            <div 
                className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-2">
                    <h3 id="navigator-title" className="text-2xl font-bold text-slate-800">Jump to Question</h3>
                    <button onClick={() => setIsNavigatorOpen(false)} className="text-slate-500 hover:text-slate-800 text-3xl font-light">&times;</button>
                </div>
                 <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 mb-4 border-b pb-3">
                    <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-green-100 border border-green-300 mr-2"></span> Answered</div>
                    <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 mr-2"></span> Unanswered</div>
                    <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-blue-600 border border-blue-600 mr-2"></span> Current</div>
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600 mr-1" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>AI Validated</span>
                    </div>
                </div>
                <div className="overflow-y-auto">
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {questions.map((_, index) => {
                        const isCurrent = index === currentQuestionIndex;
                        const isAnswered = userAnswers[index] !== null;
                        const wasRevalidated = revalidatedIndices.has(index) || (isMock && originalQuestionsRef.current[index] && questions[index] && JSON.stringify(originalQuestionsRef.current[index]) !== JSON.stringify(questions[index]));
                        
                        let buttonClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300';
                        if (isAnswered) {
                        buttonClass = 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300';
                        }
                        if (isCurrent) {
                        buttonClass = 'bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-2 border border-blue-600';
                        }

                        return (
                        <button
                            key={index}
                            onClick={() => handleJumpToQuestion(index)}
                            className={`relative flex items-center justify-center w-10 h-10 rounded-lg font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${buttonClass}`}
                            aria-label={`Go to question ${index + 1}${wasRevalidated ? ' (Validated by AI)' : ''}`}
                        >
                            {index + 1}
                            {wasRevalidated && (
                                <span className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 bg-white rounded-full p-0.5 shadow">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            )}
                        </button>
                        );
                    })}
                    </div>
                </div>
            </div>
        </div>
      )}

      {isMock && revalidationProgress < questions.length && (
         <div className="text-center text-sm text-slate-600 mb-4 p-2 bg-blue-50 rounded-lg animate-pulse">
           <p>🤖 AI is double-checking questions for accuracy... ({revalidationProgress}/{questions.length})</p>
         </div>
      )}
      <Card>
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4 border-b pb-4">
          <h2 className="text-xl font-bold text-slate-700">Question {currentQuestionIndex + 1} of {questions.length}</h2>
          <div className="flex items-center space-x-4">
            {isMock && <div className="text-lg font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full shrink-0">Time Left: {formatTime(timeLeft)}</div>}
             <Button variant="secondary" onClick={() => setIsNavigatorOpen(true)} className="py-2 px-4 text-sm font-semibold">
                Jump to...
            </Button>
          </div>
        </div>
        
        <div className={`min-h-[150px] transition-opacity duration-300 ${isRevalidating ? 'opacity-50' : 'opacity-100'}`}>
          <p className="text-lg md:text-xl text-slate-800 mb-4">{currentQuestion.questionText}</p>
          {currentQuestion.imageSvg && (
            <div className="my-4 flex justify-center">
              <img 
                src={`data:image/svg+xml;base64,${btoa(currentQuestion.imageSvg)}`} 
                alt="Question diagram" 
                className="max-w-full md:max-w-md bg-white p-2 rounded-lg shadow-md" 
              />
            </div>
          )}
        </div>
        
        <div className={`space-y-3 mt-6 transition-opacity duration-300 ${isRevalidating ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(index)}
              className={`w-full text-left p-4 rounded-lg border-2 transition text-slate-700 ${
                selectedOption === index 
                  ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-500' 
                  : 'bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
              {option}
            </button>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t flex justify-between items-center">
          <div className="flex items-center space-x-2 h-10">
            {!isMock && (
              <Button onClick={handleRevalidate} variant="secondary" disabled={isRevalidating || hasBeenRevalidated}>
                {isRevalidating ? 'Checking...' : hasBeenRevalidated ? 'Validated' : 'Revalidate Question'}
              </Button>
            )}
            {revalidationState.message && (
                <p className={`text-sm font-semibold ${revalidationState.status === 'success' ? 'text-green-600' : revalidationState.status === 'error' ? 'text-red-600' : 'text-slate-600'}`}>
                    {revalidationState.message}
                </p>
            )}
          </div>
          {isLastQuestion ? (
            <Button onClick={handleSubmit} disabled={selectedOption === null || isRevalidating}>
              Submit Quiz
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={selectedOption === null || isRevalidating}>
              Next Question
            </Button>
          )}
        </div>
      </Card>
      
      <div className="w-full bg-slate-200 rounded-full h-2.5 mt-8">
        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
      </div>
    </div>
  );
};

export default Quiz;