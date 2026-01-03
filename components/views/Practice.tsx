'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard, Button, Badge, Tabs, LoadingSpinner, Modal, ProgressBar } from '../UI';
import { saveQuizResult, getQuizHistory } from '@/lib/db';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  userAnswer?: string;
}

interface QuizHistory {
  id?: string;
  subject: string;
  score: number;
  totalQuestions: number;
  difficulty: string;
  createdAt: any;
}

const SUBJECTS = [
  { id: 'polity', name: 'Indian Polity', icon: 'account_balance' },
  { id: 'history', name: 'Modern History', icon: 'history_edu' },
  { id: 'geography', name: 'Geography', icon: 'public' },
  { id: 'economy', name: 'Economy', icon: 'payments' },
  { id: 'environment', name: 'Environment', icon: 'eco' },
  { id: 'science', name: 'Science & Tech', icon: 'biotech' },
  { id: 'currentAffairs', name: 'Current Affairs', icon: 'newspaper' },
  { id: 'ethics', name: 'Ethics', icon: 'balance' },
];

export const Practice: React.FC = () => {
  const { user, userProfile, deductTokens, updateSubjectScore } = useAuth();
  const [activeTab, setActiveTab] = useState('generate');
  const [selectedSubject, setSelectedSubject] = useState('polity');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [timerEnabled, setTimerEnabled] = useState(true);
  
  // Quiz state
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([]);
  
  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (questions.length > 0 && !quizCompleted && timerEnabled && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleQuizComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [questions, quizCompleted, timerEnabled, timeLeft]);

  // Load quiz history
  useEffect(() => {
    if (user?.uid) {
      loadQuizHistory();
    }
  }, [user]);

  const loadQuizHistory = async () => {
    if (!user?.uid) return;
    try {
      const history = await getQuizHistory(user.uid, undefined, 10);
      setQuizHistory(history);
    } catch (error) {
      console.error('Error loading quiz history:', error);
    }
  };

  const generateQuiz = async () => {
    if (!user?.uid) return;
    
    const tokenCost = questionCount * 2; // 2 tokens per question
    if ((userProfile?.tokens || 0) < tokenCost) {
      alert('Not enough tokens. Please upgrade your plan.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: SUBJECTS.find(s => s.id === selectedSubject)?.name || selectedSubject,
          difficulty,
          count: questionCount,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      await deductTokens(tokenCost);
      
      setQuestions(data.questions.map((q: any, idx: number) => ({
        id: idx + 1,
        ...q,
      })));
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setQuizCompleted(false);
      setTimeLeft(questionCount * 60); // 1 minute per question
      setActiveTab('quiz');
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      const errorMsg = error.message || 'Failed to generate quiz. Please try again.';
      alert(errorMsg.includes('GEMINI_API_KEY') 
        ? 'AI service not configured. Admin needs to add GEMINI_API_KEY in Vercel settings.' 
        : errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;
    
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestion].userAnswer = selectedAnswer;
    setQuestions(updatedQuestions);
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      handleQuizComplete();
    }
  };

  const handleQuizComplete = async () => {
    if (!user?.uid || quizCompleted) return;
    
    setQuizCompleted(true);
    
    const correctAnswers = questions.filter(
      q => q.userAnswer === q.correct
    ).length;
    
    const score = Math.round((correctAnswers / questions.length) * 100);
    
    // Save to database
    try {
      await saveQuizResult({
        userId: user.uid,
        quizType: 'mock_test',
        subject: selectedSubject,
        score,
        totalQuestions: questions.length,
        timeTaken: (questionCount * 60) - timeLeft,
        difficulty,
        questions: questions.map(q => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correct,
          userAnswer: q.userAnswer || 'Not answered',
          isCorrect: q.userAnswer === q.correct,
        })),
      });
      
      // Update subject score
      await updateSubjectScore(selectedSubject, score);
      
      // Reload history
      await loadQuizHistory();
    } catch (error) {
      console.error('Error saving quiz result:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const renderQuizGenerator = () => (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-white">quiz</span>
          </div>
          <p className="text-[#c9ad92] text-sm font-medium">Tests Taken</p>
          <p className="text-3xl font-bold text-white mt-1">{userProfile?.testsCompleted || 0}</p>
        </GlassCard>
        <GlassCard className="p-5 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-white">target</span>
          </div>
          <p className="text-[#c9ad92] text-sm font-medium">Average Score</p>
          <p className="text-3xl font-bold text-white mt-1">{userProfile?.averageScore || 0}%</p>
        </GlassCard>
        <GlassCard className="p-5 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-white">local_fire_department</span>
          </div>
          <p className="text-[#c9ad92] text-sm font-medium">Current Streak</p>
          <p className="text-3xl font-bold text-white mt-1">{userProfile?.streak || 0} Days</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quiz Generator */}
        <div className="lg:col-span-2">
          <GlassCard>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">psychology</span>
              <div>
                <h3 className="font-bold text-white">Quiz Generator</h3>
                <p className="text-[#c9ad92] text-xs">Configure and generate AI-powered quizzes</p>
              </div>
            </div>

            {/* Subject Selection */}
            <div className="mb-6">
              <label className="text-sm font-medium text-[#c9ad92] block mb-3">Select Subject</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SUBJECTS.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject.id)}
                    className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                      selectedSubject === subject.id
                        ? 'bg-primary/20 border-primary/50 text-white'
                        : 'bg-white/5 border-white/10 text-[#c9ad92] hover:border-primary/30'
                    }`}
                  >
                    <span className="material-symbols-outlined">{subject.icon}</span>
                    <span className="text-xs font-medium">{subject.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#c9ad92]">Difficulty Level</label>
                <div className="flex bg-[#2c2219] rounded-lg p-1 border border-[#483623]">
                  {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        difficulty === level
                          ? 'bg-primary text-white shadow-md'
                          : 'text-[#c9ad92] hover:text-white'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#c9ad92]">Number of Questions</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full glass-input rounded-lg px-4 py-2.5 text-sm"
                >
                  <option value={5}>5 Questions (10 tokens)</option>
                  <option value={10}>10 Questions (20 tokens)</option>
                  <option value={15}>15 Questions (30 tokens)</option>
                  <option value={20}>20 Questions (40 tokens)</option>
                </select>
              </div>
            </div>

            {/* Timer Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#c9ad92]">timer</span>
                <div>
                  <p className="text-sm font-medium text-white">Enable Timer</p>
                  <p className="text-xs text-[#c9ad92]">1 minute per question</p>
                </div>
              </div>
              <button
                onClick={() => setTimerEnabled(!timerEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  timerEnabled ? 'bg-primary' : 'bg-white/10'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    timerEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <Button
              onClick={generateQuiz}
              loading={loading}
              fullWidth
              icon="bolt"
              className="bg-gradient-to-r from-primary to-orange-600"
            >
              Generate Quiz ({questionCount * 2} Tokens)
            </Button>
          </GlassCard>
        </div>

        {/* Recent History */}
        <div className="lg:col-span-1">
          <GlassCard className="h-full">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Recent Quizzes
            </h3>
            <div className="space-y-3">
              {quizHistory.length === 0 ? (
                <p className="text-[#c9ad92] text-sm text-center py-8">No quizzes taken yet</p>
              ) : (
                quizHistory.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-primary uppercase">
                        {SUBJECTS.find(s => s.id === quiz.subject)?.name || quiz.subject}
                      </span>
                      <Badge color={quiz.score >= 70 ? 'green' : quiz.score >= 50 ? 'yellow' : 'red'}>
                        {quiz.score}%
                      </Badge>
                    </div>
                    <p className="text-[#c9ad92] text-xs">
                      {quiz.totalQuestions} questions • {quiz.difficulty}
                    </p>
                    <p className="text-white/40 text-[10px] mt-1">
                      {quiz.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );

  const renderQuiz = () => {
    if (questions.length === 0) return null;

    const currentQ = questions[currentQuestion];
    const correctAnswers = questions.filter(q => q.userAnswer === q.correct).length;
    const answeredCount = questions.filter(q => q.userAnswer).length;

    if (quizCompleted) {
      const score = Math.round((correctAnswers / questions.length) * 100);
      
      return (
        <div className="max-w-2xl mx-auto">
          <GlassCard className="text-center">
            <div className="mb-6">
              <div className={`text-6xl font-black ${getScoreColor(score)}`}>{score}%</div>
              <p className="text-[#c9ad92] mt-2">
                {correctAnswers} out of {questions.length} correct
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-2xl font-bold text-green-400">{correctAnswers}</p>
                <p className="text-xs text-[#c9ad92]">Correct</p>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-2xl font-bold text-red-400">
                  {questions.length - correctAnswers}
                </p>
                <p className="text-xs text-[#c9ad92]">Wrong</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-2xl font-bold text-blue-400">
                  {formatTime((questionCount * 60) - timeLeft)}
                </p>
                <p className="text-xs text-[#c9ad92]">Time Taken</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => {
                setActiveTab('generate');
                setQuestions([]);
              }}>
                Back to Generator
              </Button>
              <Button onClick={generateQuiz}>Try Again</Button>
            </div>
          </GlassCard>

          {/* Review Questions */}
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Review Your Answers</h3>
            {questions.map((q, idx) => (
              <GlassCard key={idx} className={`border-l-4 ${
                q.userAnswer === q.correct ? 'border-l-green-500' : 'border-l-red-500'
              }`}>
                <p className="text-white font-medium mb-3">
                  Q{idx + 1}. {q.question}
                </p>
                <div className="space-y-2 mb-3">
                  {q.options.map((opt, optIdx) => {
                    const optLetter = String.fromCharCode(65 + optIdx);
                    const isCorrect = optLetter === q.correct;
                    const isUserAnswer = optLetter === q.userAnswer;
                    
                    return (
                      <div
                        key={optIdx}
                        className={`p-2 rounded-lg text-sm ${
                          isCorrect
                            ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                            : isUserAnswer
                            ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                            : 'bg-white/5 border border-white/10 text-[#c9ad92]'
                        }`}
                      >
                        {optLetter}) {opt}
                        {isCorrect && <span className="ml-2">✓</span>}
                        {isUserAnswer && !isCorrect && <span className="ml-2">✗</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs text-primary font-medium mb-1">Explanation:</p>
                  <p className="text-sm text-[#c9ad92]">{q.explanation}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto">
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Badge color="primary">
              {SUBJECTS.find(s => s.id === selectedSubject)?.name}
            </Badge>
            <span className="text-[#c9ad92] text-sm">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          {timerEnabled && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              timeLeft < 60 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
            }`}>
              <span className="material-symbols-outlined text-sm">timer</span>
              <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <ProgressBar 
            value={answeredCount} 
            max={questions.length} 
            color="bg-primary"
          />
        </div>

        {/* Question Card */}
        <GlassCard className="mb-6">
          <p className="text-lg text-white font-medium mb-6">
            Q{currentQuestion + 1}. {currentQ.question}
          </p>

          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const optLetter = String.fromCharCode(65 + idx);
              const isSelected = selectedAnswer === optLetter;
              const isCorrect = optLetter === currentQ.correct;
              
              let optionClass = 'bg-white/5 border-white/10 hover:border-primary/50';
              if (showResult) {
                if (isCorrect) {
                  optionClass = 'bg-green-500/20 border-green-500/50 text-green-400';
                } else if (isSelected && !isCorrect) {
                  optionClass = 'bg-red-500/20 border-red-500/50 text-red-400';
                }
              } else if (isSelected) {
                optionClass = 'bg-primary/20 border-primary/50 text-primary';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(optLetter)}
                  disabled={showResult}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${optionClass}`}
                >
                  <span className="font-medium mr-3">{optLetter})</span>
                  {option}
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-primary font-medium mb-2">
                {selectedAnswer === currentQ.correct ? '✓ Correct!' : '✗ Incorrect'}
              </p>
              <p className="text-sm text-[#c9ad92]">{currentQ.explanation}</p>
            </div>
          )}
        </GlassCard>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              setActiveTab('generate');
              setQuestions([]);
            }}
          >
            Exit Quiz
          </Button>
          
          {!showResult ? (
            <Button onClick={handleSubmitAnswer} disabled={!selectedAnswer}>
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNextQuestion} icon="arrow_forward">
              {currentQuestion < questions.length - 1 ? 'Next Question' : 'View Results'}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Practice & Mock Tests</h1>
        <p className="text-[#c9ad92]">
          AI-powered quizzes tailored to UPSC syllabus
        </p>
      </div>

      {activeTab === 'generate' ? renderQuizGenerator() : renderQuiz()}
    </div>
  );
};
