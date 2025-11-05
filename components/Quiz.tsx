import React, { useState, useEffect, useRef } from 'react';
import { Question, QuizResult } from '../types';
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
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, []);
  
  useEffect(() => {
    // Reset revalidation message when question changes
    setRevalidationState({ status: 'idle', message: '' });
  }, [currentQuestionIndex]);

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
    // Ensure the answers array is the same length as questions array for accuracy
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

    onQuizComplete({
      id: new Date().toISOString(),
      date: new Date().toLocaleString(),
      questions,
      userAnswers: finalAnswers,
      score,
      subject: questions[0]?.subject,
      topics: [...new Set(questions.map(q => q.topic))],
      timeTaken,
      isMock,
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
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  
  if (!currentQuestion) {
      // Handles the edge case where questions are still loading.
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
      <Card>
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h2 className="text-xl font-bold text-slate-700">Question {currentQuestionIndex + 1} of {questions.length}</h2>
          {isMock && <div className="text-lg font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">Time Left: {formatTime(timeLeft)}</div>}
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