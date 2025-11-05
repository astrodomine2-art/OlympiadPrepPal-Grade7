
import React from 'react';
import { QuizResult } from '../types';
import Button from './common/Button';
import Card from './common/Card';

interface HistoryProps {
  history: QuizResult[];
  onBackToHome: () => void;
  onViewReport: (result: QuizResult) => void;
  onClearHistory: () => void;
}

const History: React.FC<HistoryProps> = ({ history, onBackToHome, onViewReport, onClearHistory }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h1 className="text-3xl font-extrabold text-slate-800">Quiz History</h1>
            <Button onClick={onBackToHome} variant="secondary">Back to Home</Button>
        </div>
        
        {history.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">You haven't attempted any quizzes yet.</p>
            <p className="text-slate-500">Go back home to start your first quiz!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.slice().reverse().map(result => (
              <div key={result.id} className="bg-slate-50 p-4 rounded-lg flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-bold text-slate-700">{result.subject} {result.isMock ? "Mock Exam" : "Quiz"} ({result.topics.join(', ')})</p>
                  <p className="text-sm text-slate-500">{result.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${result.score / result.questions.length >= 0.7 ? 'text-green-600' : 'text-red-600'}`}>
                    Score: {result.score}/{result.questions.length}
                  </p>
                  <Button onClick={() => onViewReport(result)} className="py-1 px-3 text-sm mt-1">View Details</Button>
                </div>
              </div>
            ))}
             <div className="pt-6 border-t mt-6 text-center">
                <Button onClick={onClearHistory} variant="danger">Clear History</Button>
             </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default History;
