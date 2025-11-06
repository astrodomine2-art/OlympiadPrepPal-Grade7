import React, { useState, useEffect, useMemo } from 'react';
import { QuizResult, Question, Subject, Grade } from '../types';
import { getImprovementSuggestions } from '../services/geminiService';
import Button from './common/Button';
import Card from './common/Card';
import Spinner from './Spinner';
import Confetti from './Confetti';

interface ReportCardProps {
  result: QuizResult;
  onBackToHome: () => void;
  onRetakeQuiz: () => void;
  onPracticeTopic: (subject: Subject, grade: Grade, topic: string) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ result, onBackToHome, onRetakeQuiz, onPracticeTopic }) => {
  const [suggestionsText, setSuggestionsText] = useState<string>('');
  const [parsedTopics, setParsedTopics] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(true);
  const [shownExplanations, setShownExplanations] = useState<Set<string>>(new Set());

  const { hasBeenRegraded, originalScore, questionsChanged } = useMemo(() => {
    if (!result.originalQuestions) {
        return { hasBeenRegraded: false, originalScore: result.score, questionsChanged: 0 };
    }

    const calculatedOriginalScore = result.userAnswers.reduce((acc, answer, index) => {
        const originalQ = result.originalQuestions![index];
        if (originalQ && answer === originalQ.correctAnswerIndex) {
            return acc + 1;
        }
        return acc;
    }, 0);

    const changedCount = result.questions.reduce((acc, currentQ, index) => {
        const originalQ = result.originalQuestions![index];
        if (originalQ && JSON.stringify(currentQ) !== JSON.stringify(originalQ)) {
            return acc + 1;
        }
        return acc;
    }, 0);
    
    return { hasBeenRegraded: true, originalScore: calculatedOriginalScore, questionsChanged: changedCount };

  }, [result]);

  const percentage = Math.round((result.score / result.questions.length) * 100);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      setSuggestionsText('');
      setParsedTopics([]);

      const incorrectlyAnswered = result.questions
        .map((q, index) => ({ question: q, userAnswerIndex: result.userAnswers[index] }))
        .filter(item => item.userAnswerIndex !== item.question.correctAnswerIndex)
        .map(item => ({
            questionText: item.question.questionText,
            topic: item.question.topic,
            userAnswer: item.userAnswerIndex !== null ? item.question.options[item.userAnswerIndex] : "No answer",
            correctAnswer: item.question.options[item.question.correctAnswerIndex]
        }));
      
      if (incorrectlyAnswered.length === 0) {
          setLoadingSuggestions(false);
          return;
      }
      
      try {
        const stream = getImprovementSuggestions(incorrectlyAnswered, result.grade);
        
        let fullText = '';
        for await (const chunk of stream) {
            fullText += chunk;
            setSuggestionsText(prev => prev + chunk);
        }

        // Post-processing to find topics for buttons
        const topicRegex = /\*\*Topic: (.*?)\*\*/g;
        const topics = [...fullText.matchAll(topicRegex)].map(match => match[1]);
        setParsedTopics(topics);

      } catch (error) {
        console.error("Error processing suggestions stream:", error);
        setSuggestionsText("Could not load suggestions due to an error.");
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchSuggestions();
  }, [result]);
  
  const handleToggleExplanation = (questionId: string) => {
    setShownExplanations(prev => {
        const newSet = new Set(prev);
        if (newSet.has(questionId)) {
            newSet.delete(questionId);
        } else {
            newSet.add(questionId);
        }
        return newSet;
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const renderSuggestion = (text: string) => {
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />'); // Render newlines
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
      {percentage >= 90 && <Confetti />}
      <Card>
        <h1 className="text-3xl md:text-4xl font-extrabold text-center text-slate-800 mb-6">{result.isMock ? 'Mock Exam' : 'Quiz'} Report (Grade {result.grade})</h1>
        
        {hasBeenRegraded && originalScore !== result.score && (
            <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-4 rounded-lg my-6 text-center shadow-md">
                <p className="font-bold text-lg">Score Adjusted!</p>
                <p>After AI revalidation, your score was updated from {originalScore} to {result.score}.</p>
                {questionsChanged > 0 && <p className="text-sm mt-1">{questionsChanged} question(s) were automatically corrected for accuracy.</p>}
            </div>
        )}

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
        <h2 className="text-2xl font-bold text-slate-700 mb-4">
          {percentage === 100 ? "Excellent Work!" : "Areas for Improvement"}
        </h2>
        {loadingSuggestions && !suggestionsText && <Spinner message="Generating personalized feedback..." />}
        
        {percentage === 100 ? (
            <div className="text-center py-4">
              <div className="inline-block bg-green-100 text-green-800 font-bold p-4 rounded-lg shadow-md">
                🎉 Perfect Score! Keep up the fantastic work! 🎉
              </div>
            </div>
         ) : !loadingSuggestions && !suggestionsText ? (
          <p className="text-slate-600">Could not load suggestions, but good job on completing the quiz!</p>
        ) : (
          suggestionsText && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 prose max-w-none">
                {renderSuggestion(suggestionsText)}
              </div>
              {!loadingSuggestions && parsedTopics.length > 0 && (
                <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
                  <p className="font-bold text-slate-800 mb-3">Practice these topics:</p>
                  <div className="flex flex-wrap gap-2">
                    {parsedTopics.map(topic => (
                      <Button key={topic} onClick={() => onPracticeTopic(result.subject, result.grade, topic)} variant="secondary" className="py-1 px-3 text-sm">
                        {topic}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </Card>

      <Card>
        <h2 className="text-2xl font-bold text-slate-700 mb-4">Review Your Answers</h2>
        <div className="space-y-6">
          {result.questions.map((q, index) => {
            const userAnswer = result.userAnswers[index];
            const isCorrect = userAnswer === q.correctAnswerIndex;
            const isExplanationVisible = shownExplanations.has(q.id);
            const originalQuestion = result.originalQuestions?.[index];
            const wasChanged = hasBeenRegraded && originalQuestion && JSON.stringify(q) !== JSON.stringify(originalQuestion);

            return (
              <div key={q.id} className={`p-4 rounded-lg border-l-4 ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                {wasChanged && (
                  <div className="mb-3 p-2 bg-amber-100 text-amber-800 text-sm rounded-md font-semibold flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      This question was corrected by AI.
                  </div>
                )}
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
                
                {isCorrect && (
                  <div className="mt-3">
                    <button
                      onClick={() => handleToggleExplanation(q.id)}
                      className="text-sm font-semibold text-blue-600 hover:underline focus:outline-none"
                    >
                      {isExplanationVisible ? 'Hide Explanation' : 'Show Explanation'}
                    </button>
                  </div>
                )}
                
                {(!isCorrect || isExplanationVisible) && (
                  <div className={`mt-3 pt-3 border-t ${isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                    <p className="font-semibold text-slate-700">Explanation:</p>
                    <p className="text-slate-600">{q.explanation}</p>
                  </div>
                )}
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