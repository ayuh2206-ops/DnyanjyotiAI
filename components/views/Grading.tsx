'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard, Button, Badge, Textarea, Select, LoadingSpinner, ProgressBar } from '../UI';
import { saveGradingResult, getGradingHistory } from '@/lib/db';

interface GradingResult {
  totalScore: number;
  breakdown: {
    content: number;
    structure: number;
    accuracy: number;
    examples: number;
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  modelAnswer: string;
}

interface GradingHistory {
  id: string;
  questionType: string;
  question: string;
  score: number;
  createdAt: any;
}

const QUESTION_TYPES = [
  { id: 'gs1', name: 'GS Paper 1', desc: 'Indian Heritage, History, Geography, Society' },
  { id: 'gs2', name: 'GS Paper 2', desc: 'Governance, Constitution, Polity, IR' },
  { id: 'gs3', name: 'GS Paper 3', desc: 'Economy, Environment, Science & Tech, Security' },
  { id: 'gs4', name: 'GS Paper 4', desc: 'Ethics, Integrity, Aptitude' },
  { id: 'essay', name: 'Essay', desc: 'Long-form essay (1000-1200 words)' },
];

const WORD_LIMITS = [
  { value: 150, label: '150 Words' },
  { value: 250, label: '250 Words' },
  { value: 500, label: '500 Words (GS Mains)' },
  { value: 1200, label: '1000-1200 Words (Essay)' },
];

export const Grading: React.FC = () => {
  const { user, userProfile, deductTokens } = useAuth();
  const [gradingMode, setGradingMode] = useState<'standard' | 'deep_pro'>('standard');
  
  // Form state
  const [questionType, setQuestionType] = useState('gs2');
  const [wordLimit, setWordLimit] = useState(250);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  
  // Result state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [gradingHistory, setGradingHistory] = useState<GradingHistory[]>([]);

  useEffect(() => {
    if (user?.uid) {
      loadGradingHistory();
    }
  }, [user]);

  const loadGradingHistory = async () => {
    if (!user?.uid) return;
    try {
      const history = await getGradingHistory(user.uid, 5);
      setGradingHistory(history);
    } catch (error) {
      console.error('Error loading grading history:', error);
    }
  };

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleGrade = async () => {
    if (!user?.uid) return;
    
    if (!question.trim()) {
      alert('Please enter the question prompt');
      return;
    }
    
    if (!answer.trim()) {
      alert('Please enter your answer');
      return;
    }

    const wordCount = countWords(answer);
    if (wordCount < 50) {
      alert('Please write at least 50 words');
      return;
    }

    const tokenCost = gradingMode === 'deep_pro' ? 15 : 8;
    if ((userProfile?.tokens || 0) < tokenCost) {
      alert('Not enough tokens. Please upgrade your plan.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          answer,
          wordLimit,
          mode: gradingMode,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      await deductTokens(tokenCost);
      
      setResult(data.result);
      
      // Save to database
      await saveGradingResult(user.uid, {
        questionType,
        question,
        answer,
        wordCount,
        score: data.result.totalScore,
        feedback: data.result,
        tokensUsed: data.tokensUsed,
        mode: gradingMode,
      });
      
      await loadGradingHistory();
    } catch (error) {
      console.error('Error grading essay:', error);
      alert('Failed to grade essay. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setQuestion('');
    setAnswer('');
    setResult(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">AI Grading Assistant</h1>
        <p className="text-[#c9ad92]">Get instant, detailed feedback on your UPSC answers</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
          <button
            onClick={() => setGradingMode('standard')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              gradingMode === 'standard' ? 'text-white bg-white/10 shadow' : 'text-[#c9ad92] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">school</span>
            Standard (8 tokens)
          </button>
          <button
            onClick={() => setGradingMode('deep_pro')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              gradingMode === 'deep_pro'
                ? 'text-white bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 shadow'
                : 'text-[#c9ad92] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] text-primary">psychology</span>
            Deep Pro (15 tokens)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-7">
          <GlassCard className="flex flex-col h-full">
            {/* Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#c9ad92]">Question Type</label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="w-full glass-input rounded-lg px-4 py-2.5 text-sm"
                >
                  {QUESTION_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#c9ad92]">Word Limit</label>
                <select
                  value={wordLimit}
                  onChange={(e) => setWordLimit(Number(e.target.value))}
                  className="w-full glass-input rounded-lg px-4 py-2.5 text-sm"
                >
                  {WORD_LIMITS.map((limit) => (
                    <option key={limit.value} value={limit.value}>
                      {limit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Question Input */}
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-[#c9ad92]">Question Prompt</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Paste the exact question here for better context..."
                className="w-full glass-input rounded-lg px-4 py-3 text-sm min-h-[80px] resize-y"
              />
            </div>

            {/* Answer Input */}
            <div className="space-y-2 flex-1">
              <div className="flex justify-between items-end px-1">
                <label className="text-sm font-medium text-[#c9ad92]">Your Answer</label>
                <span className="text-xs text-[#c9ad92]">
                  {countWords(answer)} / {wordLimit} words
                </span>
              </div>
              <div className="relative flex-1 min-h-[250px]">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Start typing your answer here..."
                  className="w-full h-full glass-input rounded-lg px-4 py-4 text-sm resize-none leading-relaxed min-h-[250px]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
              <Button variant="ghost" onClick={resetForm}>
                Clear All
              </Button>
              <Button
                onClick={handleGrade}
                loading={loading}
                icon="arrow_forward"
                disabled={!question.trim() || !answer.trim()}
              >
                Grade Now
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-5 space-y-6">
          {/* Score Card */}
          <GlassCard className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] pointer-events-none"></div>
            
            {!result ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-[#c9ad92] mb-3">rate_review</span>
                <p className="text-[#c9ad92]">Submit your answer to see the evaluation</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Evaluation Report</h3>
                    <p className="text-xs text-[#c9ad92]">Generated just now</p>
                  </div>
                  <Badge color={gradingMode === 'deep_pro' ? 'primary' : 'blue'}>
                    {gradingMode === 'deep_pro' ? 'PRO ANALYSIS' : 'STANDARD'}
                  </Badge>
                </div>

                <div className="flex items-center gap-8 justify-center py-4">
                  {/* Circular Score */}
                  <div className="relative size-32 flex items-center justify-center">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-[#483623]"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      />
                      <path
                        className="text-primary drop-shadow-[0_0_10px_rgba(236,127,19,0.5)]"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${result.totalScore * 10}, 100`}
                        strokeLinecap="round"
                        strokeWidth="2.5"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={`text-3xl font-black ${getScoreColor(result.totalScore)}`}>
                        {result.totalScore}
                      </span>
                      <span className="text-[10px] text-[#c9ad92] font-medium">OUT OF 10</span>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="flex flex-col gap-3">
                    {[
                      { label: 'Content', score: result.breakdown.content, max: 3, color: 'bg-green-500' },
                      { label: 'Structure', score: result.breakdown.structure, max: 2, color: 'bg-blue-500' },
                      { label: 'Accuracy', score: result.breakdown.accuracy, max: 3, color: 'bg-primary' },
                      { label: 'Examples', score: result.breakdown.examples, max: 2, color: 'bg-purple-500' },
                    ].map((item) => (
                      <div key={item.label} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-medium text-[#c9ad92]">
                          <span>{item.label}</span>
                          <span className="text-white">{item.score}/{item.max}</span>
                        </div>
                        <div className="w-32 h-1.5 bg-[#483623] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full`}
                            style={{ width: `${(item.score / item.max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </GlassCard>

          {/* Detailed Feedback */}
          {result && (
            <GlassCard>
              <h4 className="text-sm font-bold text-white mb-4">Detailed Insights</h4>
              <div className="space-y-3">
                {/* Strengths */}
                {result.strengths.map((strength, idx) => (
                  <div
                    key={`strength-${idx}`}
                    className="p-4 rounded-xl bg-green-500/5 border border-green-500/10"
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 min-w-[20px] h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-green-100 mb-1">Strength</h5>
                        <p className="text-xs text-[#c9ad92] leading-relaxed">{strength}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Weaknesses */}
                {result.weaknesses.map((weakness, idx) => (
                  <div
                    key={`weakness-${idx}`}
                    className="p-4 rounded-xl bg-red-500/5 border border-red-500/10"
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 min-w-[20px] h-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                        <span className="material-symbols-outlined text-[14px]">priority_high</span>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-red-100 mb-1">Needs Improvement</h5>
                        <p className="text-xs text-[#c9ad92] leading-relaxed">{weakness}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Suggestions */}
                {result.suggestions.map((suggestion, idx) => (
                  <div
                    key={`suggestion-${idx}`}
                    className="p-4 rounded-xl bg-primary/5 border border-primary/10"
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 min-w-[20px] h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-orange-100 mb-1">Suggestion</h5>
                        <p className="text-xs text-[#c9ad92] leading-relaxed">{suggestion}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Model Answer */}
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <div className="flex gap-3">
                    <div className="mt-0.5 min-w-[20px] h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                      <span className="material-symbols-outlined text-[14px]">description</span>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-blue-100 mb-1">Model Answer Outline</h5>
                      <p className="text-xs text-[#c9ad92] leading-relaxed">{result.modelAnswer}</p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Recent History */}
          {gradingHistory.length > 0 && (
            <GlassCard>
              <h4 className="text-sm font-bold text-white mb-4">Recent Evaluations</h4>
              <div className="space-y-2">
                {gradingHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 flex justify-between items-center"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-primary font-medium uppercase">
                        {QUESTION_TYPES.find(t => t.id === item.questionType)?.name || item.questionType}
                      </p>
                      <p className="text-sm text-white truncate">{item.question}</p>
                    </div>
                    <Badge color={item.score >= 7 ? 'green' : item.score >= 5 ? 'yellow' : 'red'}>
                      {item.score}/10
                    </Badge>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};
