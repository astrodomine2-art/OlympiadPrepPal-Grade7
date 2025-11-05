
import React, { useState, useEffect, useRef } from 'react';
import { Question, QuizResult } from '../types';
import Button from './common/Button';
import Card from './common/Card';

interface QuizProps {
  questions: Question[];
  isMock: boolean;
  onQuizComplete: (result: QuizResult) => void;
}

const Quiz: React.FC<QuizProps> = ({ questions, isMock, onQuizComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const timerIntervalRef = useRef<number | null>(null);
  
  const mockDuration = questions.length * 60; // 60 seconds per question
  const [timeLeft, setTimeLeft] = useState(mockDuration);

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
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

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
    const score = finalAnswers.reduce((acc, answer, index) => {
      return answer === questions[index].correctAnswerIndex ? acc + 1 : acc;
    }, 0);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

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
    });
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h2 className="text-xl font-bold text-slate-700">Question {currentQuestionIndex + 1} of {questions.length}</h2>
          {isMock && <div className="text-lg font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">Time Left: {formatTime(timeLeft)}</div>}
        </div>
        
        <div className="min-h-[150px]">
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
        
        <div className="space-y-3 mt-6">
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

        <div className="mt-8 pt-6 border-t text-right">
          {isLastQuestion ? (
            <Button onClick={handleSubmit} disabled={selectedOption === null}>
              Submit Quiz
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={selectedOption === null}>
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
