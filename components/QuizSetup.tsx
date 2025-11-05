import React, { useState } from 'react';
import { Subject, IMO_TOPICS, NSO_TOPICS, Difficulty } from '../types';
import Button from './common/Button';
import Card from './common/Card';

interface QuizSetupProps {
  onStartQuiz: (subject: Subject, topics: string[], count: number, difficulty: Difficulty, isMock: boolean) => void;
  onViewHistory: () => void;
}

const QuizSetup: React.FC<QuizSetupProps> = ({ onStartQuiz, onViewHistory }) => {
  const [subject, setSubject] = useState<Subject>(Subject.IMO);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');

  const topics = subject === Subject.IMO ? IMO_TOPICS : NSO_TOPICS;

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleStart = () => {
    if (selectedTopics.length === 0) {
      alert("Please select at least one topic.");
      return;
    }
    onStartQuiz(subject, selectedTopics, numQuestions, difficulty, false);
  };
  
  const handleStartMock = (mockNum: number) => {
     const mockQuestions = subject === Subject.IMO ? 35 : 50;
     onStartQuiz(subject, topics, mockQuestions, 'Hard', true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800">Olympiad Prep Pal</h1>
        <p className="mt-2 text-lg text-slate-600">Your AI-powered partner for SOF exam success!</p>
      </div>
      
      <Card>
        <h2 className="text-2xl font-bold text-slate-700 mb-6 border-b pb-4">Create a Custom Quiz</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-slate-700 mb-2">1. Select Subject</label>
            <div className="flex space-x-4">
              <button onClick={() => { setSubject(Subject.IMO); setSelectedTopics([]); }} className={`w-full p-4 rounded-lg font-bold text-lg transition ${subject === Subject.IMO ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                IMO (Maths)
              </button>
              <button onClick={() => { setSubject(Subject.NSO); setSelectedTopics([]); }} className={`w-full p-4 rounded-lg font-bold text-lg transition ${subject === Subject.NSO ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                NSO (Science)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold text-slate-700 mb-2">2. Choose Topics</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {topics.map(topic => (
                <button
                  key={topic}
                  onClick={() => handleTopicToggle(topic)}
                  className={`p-3 rounded-lg text-sm md:text-base text-left transition ${selectedTopics.includes(topic) ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {topic}
                </button>
              ))}
            </div>
             <button onClick={() => setSelectedTopics(topics)} className="text-sm text-blue-600 hover:underline mt-3">Select All Topics</button>
          </div>

          <div>
            <label htmlFor="numQuestions" className="block text-lg font-semibold text-slate-700 mb-2">3. Number of Questions: <span className="font-extrabold text-blue-600">{numQuestions}</span></label>
            <input
              id="numQuestions"
              type="range"
              min="5"
              max="50"
              step="5"
              value={numQuestions}
              onChange={e => setNumQuestions(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-lg font-semibold text-slate-700 mb-2">4. Select Difficulty</label>
            <div className="grid grid-cols-3 gap-3">
                {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                    <button key={d} onClick={() => setDifficulty(d)} className={`p-3 rounded-lg font-semibold transition ${difficulty === d ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                        {d}
                    </button>
                ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <Button onClick={handleStart} disabled={selectedTopics.length === 0} className="w-full text-xl py-4">
            Start Custom Quiz
          </Button>
        </div>
      </Card>
      
      <Card>
        <h2 className="text-2xl font-bold text-slate-700 mb-6 border-b pb-4">Mock Exams</h2>
        <p className="mb-4 text-slate-600">Take a full-length mock exam under timed conditions to simulate the real test.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(num => (
                <Button key={num} onClick={() => handleStartMock(num)} variant="secondary" className="w-full text-lg">
                    {subject} Mock Exam #{num}
                </Button>
            ))}
        </div>
      </Card>

      <div className="text-center">
        <Button onClick={onViewHistory} variant="secondary">
          View Quiz History
        </Button>
      </div>
    </div>
  );
};

export default QuizSetup;