
import React, { useState, useEffect } from 'react';
import { QuizResult, Question } from '../types';
import { getImprovementSuggestions } from '../services/geminiService';
import Button from './common/Button';
import Card from './common/Card';
import Spinner from './Spinner';

interface ReportCardProps {
  result: QuizResult;
  onBackToHome: () => void;
  onRetakeQuiz: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ result, onBackToHome, onRetakeQuiz }) => {
  const [suggestions, setSuggestions] = useState<string>('');
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      const incorrectlyAnswered = result.questions.filter((_, index) => result.userAnswers[index] !== result.questions[index].correctAnswerIndex);
      const response = await getImprovementSuggestions(incorrectlyAnswered);
      setSuggestions(response);
      setLoadingSuggestions(false);
    };
    fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const percentage = Math.round((result.score / result.questions.length) * 100);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const renderMarkdown = (text: string) => {
    // FIX: Replaced the buggy markdown-to-HTML conversion with a more robust implementation.
    // The new implementation correctly handles list blocks and different bullet point styles (*, -, •),
    // and uses non-greedy matching for bold and italic styles to prevent incorrect rendering.
    const html = text
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-slate-700 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-slate-800 mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-extrabold text-slate-900 mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\s*[•*-]\s(.*$)/gim, '<li>$1</li>')
      .replace(/<\/li>\n<li>/g, '</li><li>') // Join consecutive list items
      .replace(/(<li>.*<\/li>)/gs, '<ul class="space-y-2">$1</ul>') // Wrap in ul
      .replace(/\n/g, '<br />'); // Convert remaining newlines

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };


  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
      <Card>
        <h1 className="text-3xl md:text-4xl font-extrabold text-center text-slate-800 mb-6">{result.isMock ? 'Mock Exam' : 'Quiz'} Report Card</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-slate-600 text-sm font-semibold">SCORE</p>
                <p className="text-3xl font-bold text-blue-700">{result.score}/{result.questions.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-slate-600 text-sm font-semibold">PERCENTAGE</p>
                <p className="text-3xl font-bold text-green-700">{percentage}%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-slate-600 text-sm font-semibold">TIME TAKEN</p>
                <p className="text-3xl font-bold text-purple-700">{formatTime(result.timeTaken)}</p>
            </div>
        </div>
      </Card>
      
      <Card>
        <h2 className="text-2xl font-bold text-slate-700 mb-4">Areas for Improvement</h2>
        {loadingSuggestions ? <Spinner message="Generating personalized feedback..." /> : (
            <div className="prose max-w-none text-slate-600">{renderMarkdown(suggestions)}</div>
        )}
      </Card>

      <Card>
        <h2 className="text-2xl font-bold text-slate-700 mb-4">Review Your Answers</h2>
        <div className="space-y-6">
          {result.questions.map((q, index) => {
            const userAnswer = result.userAnswers[index];
            const isCorrect = userAnswer === q.correctAnswerIndex;
            return (
              <div key={q.id} className={`p-4 rounded-lg border-l-4 ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                <p className="font-bold text-slate-800 mb-2">Q{index + 1}: {q.questionText}</p>
                {q.imageSvg && 
                    <img 
                        src={`data:image/svg+xml;base64,${btoa(q.imageSvg)}`} 
                        alt="diagram" 
                        className="my-2 max-w-xs rounded bg-white p-1 shadow" 
                    />
                }
                <div className="space-y-2 mt-3">
                  {q.options.map((opt, optIndex) => {
                    let optionClass = "text-slate-600";
                    if(optIndex === q.correctAnswerIndex) optionClass = "text-green-700 font-bold";
                    if(optIndex === userAnswer && !isCorrect) optionClass = "text-red-700 font-bold line-through";
                    return <p key={optIndex} className={optionClass}>{String.fromCharCode(65 + optIndex)}. {opt}</p>;
                  })}
                </div>
                {!isCorrect && <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="font-semibold text-slate-700">Explanation:</p>
                    <p className="text-slate-600">{q.explanation}</p>
                </div>}
              </div>
            );
          })}
        </div>
      </Card>
      
      <div className="flex justify-center space-x-4 mt-6">
        <Button onClick={onBackToHome} variant="secondary">Back to Home</Button>
        <Button onClick={onRetakeQuiz}>Try Another Quiz</Button>
      </div>
    </div>
  );
};

export default ReportCard;
