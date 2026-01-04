'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  getPYQs, 
  getAllPYQYears,
  PYQQuestion,
} from '@/lib/db';
import { GlassCard, Button, Badge, Modal, LoadingSpinner, Toast } from '../UI';

const PAPERS = [
  { id: 'all', name: 'All Papers' },
  { id: 'Prelims', name: 'Prelims' },
  { id: 'Mains-GS1', name: 'GS Paper 1' },
  { id: 'Mains-GS2', name: 'GS Paper 2' },
  { id: 'Mains-GS3', name: 'GS Paper 3' },
  { id: 'Mains-GS4', name: 'GS Paper 4' },
  { id: 'Essay', name: 'Essay' },
];

const SUBJECTS = [
  'All Subjects', 'Polity', 'History', 'Geography', 'Economy', 
  'Environment', 'Science', 'Current Affairs', 'Ethics'
];

export const PYQ: React.FC = () => {
  const { userProfile, deductTokens } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Data state
  const [questions, setQuestions] = useState<PYQQuestion[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  // Filter state
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedPaper, setSelectedPaper] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('All Subjects');
  
  // Practice mode state
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  
  // Detail modal
  const [selectedQuestion, setSelectedQuestion] = useState<PYQQuestion | null>(null);
  const [generatingExplanation, setGeneratingExplanation] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [questionsData, yearsData] = await Promise.all([
        getPYQs(),
        getAllPYQYears(),
      ]);
      
      setQuestions(questionsData);
      setAvailableYears(yearsData.length > 0 ? yearsData : [2024, 2023, 2022, 2021, 2020]);
    } catch (error) {
      console.error('Error fetching PYQs:', error);
      setToast({ message: 'Failed to load questions', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filter questions
  const filteredQuestions = questions.filter(q => {
    if (selectedYear !== 'all' && q.year !== selectedYear) return false;
    if (selectedPaper !== 'all' && q.paper !== selectedPaper) return false;
    if (selectedSubject !== 'All Subjects' && q.subject !== selectedSubject) return false;
    return true;
  });

  // Practice mode questions (only Prelims MCQs)
  const practiceQuestions = filteredQuestions.filter(q => q.paper === 'Prelims' && q.options && q.options.length > 0);

  const handleStartPractice = () => {
    if (practiceQuestions.length === 0) {
      setToast({ message: 'No MCQ questions available for practice', type: 'info' });
      return;
    }
    setPracticeMode(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnswered(new Set());
  };

  const handleSelectAnswer = (answer: string) => {
    if (answered.has(currentQuestionIndex)) return;
    
    setSelectedAnswer(answer);
    setShowExplanation(true);
    
    const isCorrect = answer === practiceQuestions[currentQuestionIndex].correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setAnswered(prev => new Set(prev).add(currentQuestionIndex));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // End of practice
      setPracticeMode(false);
      setToast({ 
        message: `Practice complete! Score: ${score}/${practiceQuestions.length}`, 
        type: 'success' 
      });
    }
  };

  const handleGenerateExplanation = async (question: PYQQuestion) => {
    if (!userProfile) return;
    
    try {
      setGeneratingExplanation(true);
      
      const hasTokens = await deductTokens(3);
      if (!hasTokens) {
        setToast({ message: 'Not enough tokens', type: 'error' });
        return;
      }
      
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: question.question,
          answer: question.correctAnswer,
          subject: question.subject,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to generate explanation');
      
      const data = await response.json();
      setSelectedQuestion({ ...question, explanation: data.explanation });
    } catch (error) {
      setToast({ message: 'Failed to generate explanation', type: 'error' });
    } finally {
      setGeneratingExplanation(false);
    }
  };

  // Stats
  const stats = {
    total: filteredQuestions.length,
    prelims: filteredQuestions.filter(q => q.paper === 'Prelims').length,
    mains: filteredQuestions.filter(q => q.paper.startsWith('Mains')).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner text="Loading questions..." />
      </div>
    );
  }

  // Practice Mode UI
  if (practiceMode && practiceQuestions.length > 0) {
    const currentQuestion = practiceQuestions[currentQuestionIndex];
    
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-4">
          <Badge color="blue">
            Question {currentQuestionIndex + 1} of {practiceQuestions.length}
          </Badge>
          <Badge color="green">Score: {score}/{answered.size}</Badge>
          <Button variant="secondary" onClick={() => setPracticeMode(false)}>
            Exit Practice
          </Button>
        </div>
        
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / practiceQuestions.length) * 100}%` }}
          />
        </div>
        
        {/* Question Card */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Badge color="purple">{currentQuestion.year}</Badge>
            <Badge color="blue">{currentQuestion.subject}</Badge>
            <Badge>{currentQuestion.difficulty}</Badge>
          </div>
          
          <p className="text-lg text-white mb-6">{currentQuestion.question}</p>
          
          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => {
              const letter = String.fromCharCode(65 + index); // A, B, C, D
              const isSelected = selectedAnswer === letter;
              const isCorrect = letter === currentQuestion.correctAnswer;
              const showResult = showExplanation;
              
              let bgColor = 'bg-white/5 hover:bg-white/10';
              if (showResult) {
                if (isCorrect) bgColor = 'bg-green-500/20 border-green-500';
                else if (isSelected && !isCorrect) bgColor = 'bg-red-500/20 border-red-500';
              } else if (isSelected) {
                bgColor = 'bg-primary/20 border-primary';
              }
              
              return (
                <button
                  key={letter}
                  onClick={() => handleSelectAnswer(letter)}
                  disabled={showExplanation}
                  className={`w-full p-4 rounded-lg border-2 border-transparent text-left transition-all ${bgColor} ${
                    !showExplanation ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <span className="font-bold text-primary mr-3">{letter})</span>
                  <span className="text-white">{option}</span>
                </button>
              );
            })}
          </div>
          
          {/* Explanation */}
          {showExplanation && (
            <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined">lightbulb</span>
                Explanation
              </h4>
              <p className="text-[#c9ad92]">
                {currentQuestion.explanation || 'No explanation available for this question.'}
              </p>
            </div>
          )}
          
          {/* Next Button */}
          {showExplanation && (
            <div className="mt-6 flex justify-end">
              <Button onClick={handleNextQuestion}>
                {currentQuestionIndex < practiceQuestions.length - 1 ? 'Next Question' : 'Finish Practice'}
              </Button>
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history_edu</span>
            Previous Year Questions
          </h1>
          <p className="text-[#c9ad92]">Practice with UPSC past papers (2015-2024)</p>
        </div>
        <Button icon="play_arrow" onClick={handleStartPractice} disabled={practiceQuestions.length === 0}>
          Practice Mode ({practiceQuestions.length} MCQs)
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="text-center py-4">
          <span className="material-symbols-outlined text-primary text-2xl mb-2">quiz</span>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-[#c9ad92]">Total Questions</p>
        </GlassCard>
        <GlassCard className="text-center py-4">
          <span className="material-symbols-outlined text-blue-400 text-2xl mb-2">radio_button_checked</span>
          <p className="text-2xl font-bold text-white">{stats.prelims}</p>
          <p className="text-xs text-[#c9ad92]">Prelims MCQs</p>
        </GlassCard>
        <GlassCard className="text-center py-4">
          <span className="material-symbols-outlined text-purple-400 text-2xl mb-2">edit_note</span>
          <p className="text-2xl font-bold text-white">{stats.mains}</p>
          <p className="text-xs text-[#c9ad92]">Mains Questions</p>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard>
        <div className="flex flex-wrap gap-4">
          {/* Year Filter */}
          <div className="space-y-2">
            <label className="text-sm text-[#c9ad92]">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="glass-input rounded-lg px-4 py-2 text-sm min-w-[120px]"
            >
              <option value="all">All Years</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          {/* Paper Filter */}
          <div className="space-y-2">
            <label className="text-sm text-[#c9ad92]">Paper</label>
            <select
              value={selectedPaper}
              onChange={(e) => setSelectedPaper(e.target.value)}
              className="glass-input rounded-lg px-4 py-2 text-sm min-w-[150px]"
            >
              {PAPERS.map(paper => (
                <option key={paper.id} value={paper.id}>{paper.name}</option>
              ))}
            </select>
          </div>
          
          {/* Subject Filter */}
          <div className="space-y-2">
            <label className="text-sm text-[#c9ad92]">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="glass-input rounded-lg px-4 py-2 text-sm min-w-[150px]"
            >
              {SUBJECTS.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Questions List */}
      {filteredQuestions.length > 0 ? (
        <div className="space-y-4">
          {filteredQuestions.map((question, index) => (
            <GlassCard 
              key={question.id || `q-${index}`}
              className="cursor-pointer hover:bg-white/10 transition-all"
              onClick={() => setSelectedQuestion(question)}
            >
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold">Q{question.questionNumber}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge color="purple">{question.year}</Badge>
                    <Badge color="blue">{question.paper}</Badge>
                    <Badge>{question.subject}</Badge>
                    <Badge color={
                      question.difficulty === 'Easy' ? 'green' :
                      question.difficulty === 'Hard' ? 'red' : 'yellow'
                    }>
                      {question.difficulty}
                    </Badge>
                  </div>
                  <p className="text-white line-clamp-2">{question.question}</p>
                  {question.topic && (
                    <p className="text-xs text-[#c9ad92] mt-2">Topic: {question.topic}</p>
                  )}
                </div>
                <span className="material-symbols-outlined text-[#c9ad92]">chevron_right</span>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-[#c9ad92] mb-2">search_off</span>
          <p className="text-[#c9ad92]">No questions found for the selected filters.</p>
          <p className="text-sm text-[#c9ad92] mt-2">
            Questions will appear here as faculty adds them.
          </p>
        </GlassCard>
      )}

      {/* Question Detail Modal */}
      <Modal 
        isOpen={!!selectedQuestion} 
        onClose={() => setSelectedQuestion(null)} 
        title={`${selectedQuestion?.year} - ${selectedQuestion?.paper}`}
      >
        {selectedQuestion && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge color="blue">{selectedQuestion.subject}</Badge>
              <Badge>{selectedQuestion.difficulty}</Badge>
              {selectedQuestion.topic && <Badge color="purple">{selectedQuestion.topic}</Badge>}
            </div>
            
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-white font-medium">
                Q{selectedQuestion.questionNumber}. {selectedQuestion.question}
              </p>
            </div>
            
            {/* MCQ Options */}
            {selectedQuestion.options && selectedQuestion.options.length > 0 && (
              <div className="space-y-2">
                {selectedQuestion.options.map((option, index) => {
                  const letter = String.fromCharCode(65 + index);
                  const isCorrect = letter === selectedQuestion.correctAnswer;
                  return (
                    <div 
                      key={letter}
                      className={`p-3 rounded-lg ${
                        isCorrect ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5'
                      }`}
                    >
                      <span className={`font-bold mr-2 ${isCorrect ? 'text-green-400' : 'text-primary'}`}>
                        {letter})
                      </span>
                      <span className="text-white">{option}</span>
                      {isCorrect && (
                        <span className="ml-2 text-green-400 text-sm">(Correct Answer)</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Explanation */}
            {selectedQuestion.explanation ? (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h4 className="font-bold text-blue-400 mb-2">Explanation</h4>
                <p className="text-[#c9ad92]">{selectedQuestion.explanation}</p>
              </div>
            ) : (
              <Button 
                variant="secondary" 
                icon="auto_awesome" 
                onClick={() => handleGenerateExplanation(selectedQuestion)}
                loading={generatingExplanation}
                fullWidth
              >
                {generatingExplanation ? 'Generating...' : 'Generate AI Explanation (3 tokens)'}
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
