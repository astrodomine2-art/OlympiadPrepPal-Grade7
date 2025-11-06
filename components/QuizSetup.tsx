import React, { useState, useEffect } from 'react';
import { Subject, IMO_TOPICS, NSO_TOPICS, IEO_TOPICS, ICSO_TOPICS, Difficulty, Grade, IMO_TOPICS_GRADE6, NSO_TOPICS_GRADE6, IEO_TOPICS_GRADE6, ICSO_TOPICS_GRADE6 } from '../types';
import Button from './common/Button';
import Card from './common/Card';

interface QuizSetupProps {
  onStartQuiz: (subject: Subject, topics: string[], count: number, difficulty: Difficulty, isMock: boolean, grade: Grade, instantFeedback: boolean) => void;
  onViewHistory: () => void;
  prefilledSetup: { subject: Subject; grade: Grade; topic: string; } | null;
  onPrefillConsumed: () => void;
}

const QuizSetup: React.FC<QuizSetupProps> = ({ onStartQuiz, onViewHistory, prefilledSetup, onPrefillConsumed }) => {
  const [grade, setGrade] = useState<Grade>(7);
  const [subject, setSubject] = useState<Subject>(Subject.IMO);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [instantFeedback, setInstantFeedback] = useState<boolean>(false);

  const topics = (() => {
    const gradeTopics = grade === 7 
        ? { IMO: IMO_TOPICS, NSO: NSO_TOPICS, IEO: IEO_TOPICS, ICSO: ICSO_TOPICS }
        : { IMO: IMO_TOPICS_GRADE6, NSO: NSO_TOPICS_GRADE6, IEO: IEO_TOPICS_GRADE6, ICSO: ICSO_TOPICS_GRADE6 };
    return gradeTopics[subject] || [];
  })();

  useEffect(() => {
    if (prefilledSetup) {
      setGrade(prefilledSetup.grade);
      setSubject(prefilledSetup.subject);
      // Wait for the topics list to update based on new grade/subject
      setTimeout(() => {
        setSelectedTopics([prefilledSetup.topic]);
      }, 0);
      setNumQuestions(10);
      setDifficulty('Medium');
      setInstantFeedback(false);
      onPrefillConsumed();
    }
  }, [prefilledSetup, onPrefillConsumed]);

  const handleGradeChange = (newGrade: Grade) => {
    setGrade(newGrade);
    setSelectedTopics([]);
    setSubject(Subject.IMO);
  };
  
  const handleSubjectChange = (newSubject: Subject) => {
    setSubject(newSubject);
    setSelectedTopics([]);
  };

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
    onStartQuiz(subject, selectedTopics, numQuestions, difficulty, false, grade, instantFeedback);
  };
  
  const handleStartMock = (mockNum: number) => {
     const mockQuestions = grade === 7 ? (subject === Subject.IMO ? 35 : 50) : 35;
     onStartQuiz(subject, topics, mockQuestions, 'Hard', true, grade, false); // Instant feedback is disabled for mock exams
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800">Olympiad Prep Pal</h1>
        <p className="mt-2 text-lg text-slate-600">Your AI-powered partner for SOF exam success!</p>
      </div>
      
      <div className="flex justify-center mb-6 border-b-2 border-slate-200">
        {[7, 6].map((g) => (
            <button 
                key={g}
                onClick={() => handleGradeChange(g as Grade)}
                className={`px-8 py-3 text-xl font-bold rounded-t-lg transition-colors focus:outline-none ${
                    grade === g 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-transparent text-slate-500 hover:bg-slate-100'
                }`}
            >
                Grade {g}
            </button>
        ))}
      </div>
      
      <Card>
        <h2 className="text-2xl font-bold text-slate-700 mb-6 border-b pb-4">Create a Custom Quiz</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-slate-700 mb-2">1. Select Subject</label>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleSubjectChange(Subject.IMO)} className={`w-full p-4 rounded-lg font-bold text-lg transition ${subject === Subject.IMO ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                IMO (Maths)
              </button>
              <button onClick={() => handleSubjectChange(Subject.NSO)} className={`w-full p-4 rounded-lg font-bold text-lg transition ${subject === Subject.NSO ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                NSO (Science)
              </button>
              <button onClick={() => handleSubjectChange(Subject.IEO)} className={`w-full p-4 rounded-lg font-bold text-lg transition ${subject === Subject.IEO ? 'bg-yellow-500 text-white shadow-lg' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                IEO (English)
              </button>
              <button onClick={() => handleSubjectChange(Subject.ICSO)} className={`w-full p-4 rounded-lg font-bold text-lg transition ${subject === Subject.ICSO ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                ICSO (Cyber)
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
            <div className="grid grid-cols-2 gap-3">
                {(['Easy', 'Medium', 'Hard', 'HOTS (Achiever Section)'] as Difficulty[]).map(d => {
                    const isSelected = difficulty === d;
                    let styleClasses = "bg-slate-200 text-slate-700 hover:bg-slate-300";
                    if (isSelected) {
                        styleClasses = d === 'HOTS (Achiever Section)'
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'bg-blue-600 text-white shadow-md';
                    }
                    return (
                        <button key={d} onClick={() => setDifficulty(d)} className={`p-3 rounded-lg font-semibold transition ${styleClasses}`}>
                            {d === 'HOTS (Achiever Section)' ? 'HOTS (Achievers)' : d}
                        </button>
                    );
                })}
            </div>
          </div>
          
          <div>
            <label className="block text-lg font-semibold text-slate-700 mb-2">5. Quiz Mode</label>
             <div 
                className="flex items-center p-3 rounded-lg cursor-pointer bg-slate-100 hover:bg-slate-200 transition"
                onClick={() => setInstantFeedback(!instantFeedback)}
                role="checkbox"
                aria-checked={instantFeedback}
             >
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center mr-3 transition ${instantFeedback ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                    {instantFeedback && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div>
                    <span className="font-semibold text-slate-800">Instant Feedback Mode</span>
                    <p className="text-sm text-slate-600">See the correct answer and explanation after each question.</p>
                </div>
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