import React, { useState, useEffect, useMemo } from 'react';
import { QuizResult, Subject, IMO_TOPICS, NSO_TOPICS, IEO_TOPICS, ICSO_TOPICS, BadgeId, UserStats } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import { BADGE_DEFS } from './gamification/BadgeDefs';
import BadgeIcon from './gamification/BadgeIcon';


type Trend = 'improving' | 'declining' | 'stable' | 'insufficient_data';

interface TrendData {
    [subject: string]: {
        overall: {
            trend: Trend;
            scores: number[];
        };
        topics: {
            [topic: string]: {
                trend: Trend;
                scores: number[];
            }
        }
    }
}

// --- Trend Calculation Logic ---

const calculateTrend = (scores: number[]): Trend => {
    if (scores.length < 2) {
        return 'insufficient_data';
    }
    const n = scores.length;
    const firstHalfCount = Math.floor(n / 2);
    const lastHalfCount = Math.floor(n / 2);

    if (firstHalfCount === 0 || lastHalfCount === 0) {
        return 'insufficient_data';
    }

    const firstHalf = scores.slice(0, firstHalfCount);
    const lastHalf = scores.slice(n - lastHalfCount);

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgLast = lastHalf.reduce((a, b) => a + b, 0) / lastHalf.length;

    const threshold = 5; // 5% change threshold

    if (avgLast > avgFirst + threshold) return 'improving';
    if (avgLast < avgFirst - threshold) return 'declining';
    return 'stable';
}

const processHistoryForTrends = (history: QuizResult[]): TrendData => {
    const data: TrendData = {};

    const historyBySubject = history.reduce((acc, result) => {
        if (!acc[result.subject]) {
            acc[result.subject] = [];
        }
        acc[result.subject].push(result);
        return acc;
    }, {} as Record<Subject, QuizResult[]>);

    for (const subjectStr in historyBySubject) {
        const subject = subjectStr as Subject;
        const subjectHistory = historyBySubject[subject];
        
        // Overall trend for the subject
        const overallScores = subjectHistory.map(r => (r.score / r.questions.length) * 100);
        data[subject] = {
            overall: {
                scores: overallScores,
                trend: calculateTrend(overallScores)
            },
            topics: {}
        };

        const subjectTopics = {
            [Subject.IMO]: IMO_TOPICS,
            [Subject.NSO]: NSO_TOPICS,
            [Subject.IEO]: IEO_TOPICS,
            [Subject.ICSO]: ICSO_TOPICS,
        }[subject];

        // Per-topic trend
        subjectTopics.forEach(topic => {
            const topicScores: number[] = [];
            subjectHistory.forEach(result => {
                const topicQuestions = result.questions.filter(q => q.topic === topic);
                if (topicQuestions.length > 0) {
                    const correctAnswers = topicQuestions.filter(q => {
                        const questionIndex = result.questions.findIndex(rq => rq.id === q.id);
                        return result.userAnswers[questionIndex] === q.correctAnswerIndex;
                    }).length;
                    const score = (correctAnswers / topicQuestions.length) * 100;
                    topicScores.push(score);
                }
            });
            data[subject].topics[topic] = {
                scores: topicScores,
                trend: calculateTrend(topicScores)
            };
        });
    }
    return data;
};

// --- Trend UI Component ---

const TrendIndicator: React.FC<{ trend: Trend }> = ({ trend }) => {
    const trendStyles = {
        improving: { text: 'Improving', color: 'text-green-600', icon: 'M12 6l-6 6h12l-6-6z' },
        declining: { text: 'Declining', color: 'text-red-600', icon: 'M12 18l6-6H6l6 6z' },
        stable: { text: 'Stable', color: 'text-blue-600', icon: 'M6 12h12v-2H6v2z' },
        insufficient_data: { text: 'Not enough data', color: 'text-slate-500', icon: '' }
    };
    const { text, color, icon } = trendStyles[trend];

    return (
        <span className={`flex items-center font-semibold ${color}`}>
            {icon && <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d={icon}></path></svg>}
            {text}
        </span>
    );
};

// --- Main History Component ---

interface HistoryProps {
  history: QuizResult[];
  unlockedBadges: BadgeId[];
  userStats: UserStats;
  onBackToHome: () => void;
  onViewReport: (result: QuizResult) => void;
  onPracticeMistakes: () => void;
}

const History: React.FC<HistoryProps> = ({ history, unlockedBadges, userStats, onBackToHome, onViewReport, onPracticeMistakes }) => {
  const [trends, setTrends] = useState<TrendData | null>(null);

  const hasMistakes = useMemo(() => {
    return history.some(result =>
      result.userAnswers.some((ans, idx) => ans !== result.questions[idx].correctAnswerIndex)
    );
  }, [history]);

  useEffect(() => {
    if(history.length > 0) {
        const trendData = processHistoryForTrends(history);
        setTrends(trendData);
    }
  }, [history]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
       <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-extrabold text-slate-800">Quiz History & Trends</h1>
            <Button onClick={onBackToHome} variant="secondary">Back to Home</Button>
        </div>

      <Card>
        <h2 className="text-2xl font-bold text-slate-700 mb-4 border-b pb-3">My Achievements</h2>
        <div className="flex flex-wrap justify-center gap-4 p-4">
            {Object.values(BADGE_DEFS).map(badge => {
                const isUnlocked = unlockedBadges.includes(badge.id);
                const progressData = !isUnlocked && badge.progress ? badge.progress(userStats, history) : null;
                const progressPercent = progressData ? Math.min((progressData.current / progressData.goal) * 100, 100) : 0;

                return (
                    <div key={badge.id} className="flex flex-col items-center w-24 text-center transition-all">
                        <div className={isUnlocked ? '' : 'grayscale opacity-60'}>
                            <BadgeIcon badge={badge} />
                        </div>
                        <p className={`mt-2 text-sm font-semibold ${isUnlocked ? 'text-slate-800' : 'text-slate-600'}`}>{badge.name}</p>

                        {progressData ? (
                            <div className="w-full mt-1">
                                <div className="bg-slate-200 rounded-full h-2 w-full" title={`${progressData.current} / ${progressData.goal}`}>
                                    <div
                                        className="bg-amber-400 h-2 rounded-full"
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {progressData.current}/{progressData.goal}
                                </p>
                            </div>
                        ) : (
                            !isUnlocked && <p className="text-xs text-slate-500 mt-1 h-10">{badge.description}</p>
                        )}
                    </div>
                );
            })}
        </div>
      </Card>
      
      <Card>
          <h2 className="text-2xl font-bold text-slate-700 mb-4 border-b pb-3">Study Tools</h2>
          <div className="flex justify-center">
            <Button onClick={onPracticeMistakes} disabled={!hasMistakes} title={!hasMistakes ? "Take a quiz and get some questions wrong to enable this feature." : "Practice questions you've answered incorrectly"}>
                Practice Past Mistakes
            </Button>
          </div>
      </Card>

      {trends && Object.keys(trends).length > 0 && (
        <Card>
            <h2 className="text-2xl font-bold text-slate-700 mb-4 border-b pb-3">Performance Trends</h2>
            <div className="space-y-6">
                {Object.entries(trends).map(([subject, subjectData]) => {
                    const typedSubjectData = subjectData as TrendData[string];
                    return (
                    <div key={subject}>
                        <h3 className="text-xl font-bold text-slate-800">{subject}</h3>
                        <div className="flex items-center space-x-2 my-2 p-2 bg-slate-100 rounded-md">
                            <span className="font-semibold text-slate-600">Overall Performance:</span>
                            <TrendIndicator trend={typedSubjectData.overall.trend} />
                        </div>
                        <div className="ml-2 mt-3 space-y-1">
                            <h4 className="font-semibold text-slate-600 mb-1">Topic Breakdown:</h4>
                            {Object.entries(typedSubjectData.topics).map(([topic, topicData]) => {
                                const typedTopicData = topicData as { trend: Trend; scores: number[] };
                                return (
                                <div key={topic} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-700">{topic}</span>
                                    {typedTopicData.scores.length > 0 ? (
                                        <TrendIndicator trend={typedTopicData.trend} />
                                    ) : (
                                        <span className="text-slate-400 italic">Not practiced</span>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    </div>
                    );
                })}
            </div>
        </Card>
      )}

      <Card>
        <h2 className="text-2xl font-bold text-slate-700 mb-4 border-b pb-3">Detailed History</h2>
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
                  <p className="font-bold text-slate-700">{result.subject} (Grade {result.grade}) {result.isMock ? "Mock Exam" : "Quiz"}</p>
                  <p className="text-sm text-slate-600">Topics: {result.topics.join(', ')}</p>
                  <p className="text-sm text-slate-500 mt-1">{result.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${result.score / result.questions.length >= 0.7 ? 'text-green-600' : 'text-red-600'}`}>
                    Score: {result.score}/{result.questions.length}
                  </p>
                  <Button onClick={() => onViewReport(result)} className="py-1 px-3 text-sm mt-1">View Details</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default History;