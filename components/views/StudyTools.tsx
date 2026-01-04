'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  getUserFlashcards, 
  createFlashcard, 
  updateFlashcardReview, 
  deleteFlashcard,
  getSyllabusItems,
  getUserSyllabusProgress,
  updateSyllabusProgress,
  getUserMindMaps,
  saveMindMap,
  initializeSyllabus,
  Flashcard,
  SyllabusItem,
  SyllabusProgress,
  MindMap,
  MindMapNode,
} from '@/lib/db';
import { GlassCard, Button, Badge, Input, Modal, LoadingSpinner, Toast, ProgressBar } from '../UI';

type TabType = 'flashcards' | 'syllabus' | 'mindmaps';

const SUBJECTS = ['Polity', 'History', 'Geography', 'Economy', 'Environment', 'Science', 'Ethics', 'Current Affairs'];

export const StudyTools: React.FC = () => {
  const { userProfile, deductTokens } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('flashcards');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Flashcards state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCreateFlashcardModal, setShowCreateFlashcardModal] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [cardsToReview, setCardsToReview] = useState<Flashcard[]>([]);
  
  // Syllabus state
  const [syllabusItems, setSyllabusItems] = useState<SyllabusItem[]>([]);
  const [syllabusProgress, setSyllabusProgress] = useState<SyllabusProgress[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  
  // Mind Maps state
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [showCreateMindMapModal, setShowCreateMindMapModal] = useState(false);
  const [generatingMindMap, setGeneratingMindMap] = useState(false);
  
  // Form state
  const [newFlashcard, setNewFlashcard] = useState({
    front: '',
    back: '',
    topic: '',
    subject: 'Polity',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
  });
  
  const [newMindMapTopic, setNewMindMapTopic] = useState('');
  const [newMindMapSubject, setNewMindMapSubject] = useState('Polity');

  useEffect(() => {
    if (userProfile?.uid) {
      fetchData();
    }
  }, [userProfile?.uid]);

  const fetchData = async () => {
    if (!userProfile?.uid) return;
    
    try {
      setLoading(true);
      
      // Initialize syllabus if needed
      await initializeSyllabus();
      
      const [flashcardsData, syllabusData, progressData, mindMapsData] = await Promise.all([
        getUserFlashcards(userProfile.uid),
        getSyllabusItems(),
        getUserSyllabusProgress(userProfile.uid),
        getUserMindMaps(userProfile.uid),
      ]);
      
      setFlashcards(flashcardsData);
      setSyllabusItems(syllabusData);
      setSyllabusProgress(progressData);
      setMindMaps(mindMapsData);
      
      // Set cards to review (due today or overdue)
      const today = new Date();
      const dueCards = flashcardsData.filter(card => card.nextReviewDate <= today);
      setCardsToReview(dueCards);
    } catch (error) {
      console.error('Error fetching data:', error);
      setToast({ message: 'Failed to load data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Flashcard handlers
  const handleCreateFlashcard = async () => {
    if (!userProfile?.uid || !newFlashcard.front.trim() || !newFlashcard.back.trim()) return;
    
    try {
      await createFlashcard({
        userId: userProfile.uid,
        front: newFlashcard.front,
        back: newFlashcard.back,
        topic: newFlashcard.topic,
        subject: newFlashcard.subject,
        difficulty: newFlashcard.difficulty,
        nextReviewDate: new Date(),
        repetitions: 0,
        easeFactor: 2.5,
        interval: 0,
      });
      
      setToast({ message: 'Flashcard created!', type: 'success' });
      setShowCreateFlashcardModal(false);
      setNewFlashcard({ front: '', back: '', topic: '', subject: 'Polity', difficulty: 'Medium' });
      fetchData();
    } catch (error) {
      setToast({ message: 'Failed to create flashcard', type: 'error' });
    }
  };

  const handleReviewCard = async (quality: number) => {
    if (!cardsToReview[currentCardIndex]?.id) return;
    
    try {
      await updateFlashcardReview(cardsToReview[currentCardIndex].id!, quality);
      
      if (currentCardIndex < cardsToReview.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        setReviewMode(false);
        setCurrentCardIndex(0);
        setToast({ message: 'Review session complete!', type: 'success' });
        fetchData();
      }
    } catch (error) {
      setToast({ message: 'Failed to update card', type: 'error' });
    }
  };

  const handleDeleteFlashcard = async (cardId: string) => {
    if (!confirm('Delete this flashcard?')) return;
    
    try {
      await deleteFlashcard(cardId);
      setToast({ message: 'Flashcard deleted', type: 'success' });
      fetchData();
    } catch (error) {
      setToast({ message: 'Failed to delete flashcard', type: 'error' });
    }
  };

  // Syllabus handlers
  const handleUpdateProgress = async (item: SyllabusItem, status: SyllabusProgress['status']) => {
    if (!userProfile?.uid || !item.id) return;
    
    try {
      await updateSyllabusProgress(userProfile.uid, item.id, item.subject, item.topic, status);
      setToast({ message: 'Progress updated!', type: 'success' });
      fetchData();
    } catch (error) {
      setToast({ message: 'Failed to update progress', type: 'error' });
    }
  };

  const getProgressForItem = (itemId: string): SyllabusProgress | undefined => {
    return syllabusProgress.find(p => p.syllabusItemId === itemId);
  };

  const getProgressStats = () => {
    const total = syllabusItems.length;
    const completed = syllabusProgress.filter(p => p.status === 'completed').length;
    const inProgress = syllabusProgress.filter(p => p.status === 'in_progress').length;
    return { total, completed, inProgress, percentage: total ? Math.round((completed / total) * 100) : 0 };
  };

  // Mind Map handlers
  const handleGenerateMindMap = async () => {
    if (!userProfile?.uid || !newMindMapTopic.trim()) return;
    
    try {
      setGeneratingMindMap(true);
      
      // Deduct tokens
      const hasTokens = await deductTokens(5);
      if (!hasTokens) {
        setToast({ message: 'Not enough tokens', type: 'error' });
        return;
      }
      
      // Call AI to generate mind map
      const response = await fetch('/api/ai/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: newMindMapTopic, subject: newMindMapSubject }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate mind map');
      }
      
      const data = await response.json();
      
      // Save mind map
      await saveMindMap(userProfile.uid, newMindMapTopic, newMindMapSubject, data.mindMap);
      
      setToast({ message: 'Mind map generated!', type: 'success' });
      setShowCreateMindMapModal(false);
      setNewMindMapTopic('');
      fetchData();
    } catch (error) {
      setToast({ message: 'Failed to generate mind map', type: 'error' });
    } finally {
      setGeneratingMindMap(false);
    }
  };

  // Filter syllabus by subject
  const filteredSyllabus = selectedSubject === 'all' 
    ? syllabusItems 
    : syllabusItems.filter(item => item.subject === selectedSubject);

  const progressStats = getProgressStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner text="Loading study tools..." />
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
            <span className="material-symbols-outlined text-primary">build</span>
            Study Tools
          </h1>
          <p className="text-[#c9ad92]">Flashcards, Syllabus Tracker & Mind Maps</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'flashcards', label: 'Flashcards', icon: 'style', count: cardsToReview.length },
          { id: 'syllabus', label: 'Syllabus Tracker', icon: 'checklist' },
          { id: 'mindmaps', label: 'Mind Maps', icon: 'account_tree' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-[#c9ad92] hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Flashcards Tab */}
      {activeTab === 'flashcards' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <GlassCard className="text-center py-4">
              <span className="material-symbols-outlined text-primary text-2xl mb-2">style</span>
              <p className="text-2xl font-bold text-white">{flashcards.length}</p>
              <p className="text-xs text-[#c9ad92]">Total Cards</p>
            </GlassCard>
            <GlassCard className="text-center py-4">
              <span className="material-symbols-outlined text-yellow-400 text-2xl mb-2">schedule</span>
              <p className="text-2xl font-bold text-white">{cardsToReview.length}</p>
              <p className="text-xs text-[#c9ad92]">Due Today</p>
            </GlassCard>
            <GlassCard className="text-center py-4">
              <span className="material-symbols-outlined text-green-400 text-2xl mb-2">check_circle</span>
              <p className="text-2xl font-bold text-white">
                {flashcards.filter(c => c.repetitions > 0).length}
              </p>
              <p className="text-xs text-[#c9ad92]">Learned</p>
            </GlassCard>
            <GlassCard className="text-center py-4">
              <span className="material-symbols-outlined text-blue-400 text-2xl mb-2">trending_up</span>
              <p className="text-2xl font-bold text-white">
                {flashcards.length > 0 ? Math.round(flashcards.reduce((a, c) => a + c.easeFactor, 0) / flashcards.length * 20) : 0}%
              </p>
              <p className="text-xs text-[#c9ad92]">Avg. Retention</p>
            </GlassCard>
          </div>

          {/* Review Mode */}
          {reviewMode && cardsToReview.length > 0 ? (
            <GlassCard className="max-w-2xl mx-auto">
              <div className="text-center mb-4">
                <Badge color="blue">Card {currentCardIndex + 1} of {cardsToReview.length}</Badge>
              </div>
              
              {/* Flashcard */}
              <div 
                className={`min-h-[250px] rounded-xl p-8 cursor-pointer transition-all duration-500 transform ${
                  isFlipped ? 'bg-green-500/10 border-green-500/30' : 'bg-primary/10 border-primary/30'
                } border-2 flex items-center justify-center`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className="text-center">
                  <p className="text-xs text-[#c9ad92] mb-2">
                    {isFlipped ? 'ANSWER' : 'QUESTION'} • Click to flip
                  </p>
                  <p className="text-xl text-white font-medium">
                    {isFlipped ? cardsToReview[currentCardIndex].back : cardsToReview[currentCardIndex].front}
                  </p>
                </div>
              </div>
              
              {/* Rating Buttons (show after flip) */}
              {isFlipped && (
                <div className="mt-6 space-y-3">
                  <p className="text-center text-[#c9ad92] text-sm">How well did you remember?</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="secondary" onClick={() => handleReviewCard(1)} className="bg-red-500/20 text-red-400">
                      Again
                    </Button>
                    <Button variant="secondary" onClick={() => handleReviewCard(3)} className="bg-yellow-500/20 text-yellow-400">
                      Hard
                    </Button>
                    <Button variant="secondary" onClick={() => handleReviewCard(4)} className="bg-blue-500/20 text-blue-400">
                      Good
                    </Button>
                    <Button variant="secondary" onClick={() => handleReviewCard(5)} className="bg-green-500/20 text-green-400">
                      Easy
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex justify-center">
                <Button variant="secondary" onClick={() => { setReviewMode(false); setCurrentCardIndex(0); setIsFlipped(false); }}>
                  Exit Review
                </Button>
              </div>
            </GlassCard>
          ) : (
            <>
              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  icon="play_arrow" 
                  onClick={() => setReviewMode(true)}
                  disabled={cardsToReview.length === 0}
                >
                  Start Review ({cardsToReview.length} cards)
                </Button>
                <Button variant="secondary" icon="add" onClick={() => setShowCreateFlashcardModal(true)}>
                  Create Card
                </Button>
              </div>

              {/* All Flashcards */}
              <GlassCard>
                <h3 className="font-bold text-white mb-4">All Flashcards</h3>
                {flashcards.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {flashcards.map((card, index) => (
                      <div 
                        key={card.id || `card-${index}`}
                        className="p-4 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge color="blue">{card.subject}</Badge>
                          <button 
                            onClick={() => card.id && handleDeleteFlashcard(card.id)}
                            className="text-[#c9ad92] hover:text-red-400"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                        <p className="text-white font-medium mb-1 line-clamp-2">{card.front}</p>
                        <p className="text-[#c9ad92] text-sm line-clamp-2">{card.back}</p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-[#c9ad92]">
                          <span>Reviews: {card.repetitions}</span>
                          <span>•</span>
                          <span>Next: {card.nextReviewDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#c9ad92]">
                    <span className="material-symbols-outlined text-4xl mb-2">style</span>
                    <p>No flashcards yet. Create your first one!</p>
                  </div>
                )}
              </GlassCard>
            </>
          )}
        </div>
      )}

      {/* Syllabus Tracker Tab */}
      {activeTab === 'syllabus' && (
        <div className="space-y-6">
          {/* Progress Overview */}
          <GlassCard>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h3 className="font-bold text-white">Overall Progress</h3>
                <p className="text-sm text-[#c9ad92]">
                  {progressStats.completed} of {progressStats.total} topics completed
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{progressStats.percentage}%</p>
              </div>
            </div>
            <ProgressBar value={progressStats.percentage} max={100} />
          </GlassCard>

          {/* Subject Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedSubject === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-white/10 text-[#c9ad92] hover:bg-white/20'
              }`}
            >
              All Subjects
            </button>
            {SUBJECTS.map(subject => (
              <button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedSubject === subject
                    ? 'bg-primary text-white'
                    : 'bg-white/10 text-[#c9ad92] hover:bg-white/20'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>

          {/* Syllabus Items */}
          <div className="space-y-4">
            {filteredSyllabus.map((item, index) => {
              const progress = getProgressForItem(item.id || '');
              const status = progress?.status || 'not_started';
              
              return (
                <GlassCard key={item.id || `syllabus-${index}`}>
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge color="blue">{item.subject}</Badge>
                        <Badge color="purple">{item.paper}</Badge>
                      </div>
                      <h4 className="font-bold text-white">{item.topic}</h4>
                      {item.subtopics && item.subtopics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.subtopics.map((sub, i) => (
                            <span key={i} className="text-xs text-[#c9ad92] bg-white/5 px-2 py-0.5 rounded">
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select
                        value={status}
                        onChange={(e) => handleUpdateProgress(item, e.target.value as SyllabusProgress['status'])}
                        className={`glass-input rounded-lg px-3 py-2 text-sm ${
                          status === 'completed' ? 'text-green-400' :
                          status === 'in_progress' ? 'text-yellow-400' :
                          status === 'revision' ? 'text-blue-400' : 'text-[#c9ad92]'
                        }`}
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="revision">Revision</option>
                      </select>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Mind Maps Tab */}
      {activeTab === 'mindmaps' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">Mind Maps</h3>
              <p className="text-sm text-[#c9ad92]">Generate visual topic breakdowns with AI</p>
            </div>
            <Button icon="add" onClick={() => setShowCreateMindMapModal(true)}>
              Generate Mind Map
            </Button>
          </div>

          {/* Mind Maps Grid */}
          {mindMaps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mindMaps.map((map, index) => (
                <GlassCard key={map.id || `map-${index}`} className="cursor-pointer hover:bg-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-purple-400">account_tree</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{map.topic}</h4>
                      <Badge color="blue">{map.subject}</Badge>
                    </div>
                  </div>
                  
                  {/* Simple visualization of mind map structure */}
                  <div className="bg-white/5 rounded-lg p-3 text-sm">
                    <p className="text-primary font-medium">{map.data.name}</p>
                    {map.data.children && (
                      <ul className="ml-4 mt-2 space-y-1">
                        {map.data.children.slice(0, 4).map((child, i) => (
                          <li key={i} className="text-[#c9ad92]">• {child.name}</li>
                        ))}
                        {map.data.children.length > 4 && (
                          <li className="text-[#c9ad92] opacity-60">
                            +{map.data.children.length - 4} more...
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                  
                  <p className="text-xs text-[#c9ad92] mt-3">
                    Created {map.createdAt.toLocaleDateString()}
                  </p>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-purple-400 mb-2">account_tree</span>
              <p className="text-[#c9ad92]">No mind maps yet. Generate your first one!</p>
            </GlassCard>
          )}
        </div>
      )}

      {/* Create Flashcard Modal */}
      <Modal 
        isOpen={showCreateFlashcardModal} 
        onClose={() => setShowCreateFlashcardModal(false)} 
        title="Create Flashcard"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-[#c9ad92]">Question (Front)</label>
            <textarea
              placeholder="What do you want to remember?"
              value={newFlashcard.front}
              onChange={(e) => setNewFlashcard({ ...newFlashcard, front: e.target.value })}
              className="w-full glass-input rounded-lg px-4 py-3 text-sm resize-none h-24"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-[#c9ad92]">Answer (Back)</label>
            <textarea
              placeholder="The answer to remember..."
              value={newFlashcard.back}
              onChange={(e) => setNewFlashcard({ ...newFlashcard, back: e.target.value })}
              className="w-full glass-input rounded-lg px-4 py-3 text-sm resize-none h-24"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-[#c9ad92]">Subject</label>
              <select
                value={newFlashcard.subject}
                onChange={(e) => setNewFlashcard({ ...newFlashcard, subject: e.target.value })}
                className="w-full glass-input rounded-lg px-4 py-2.5 text-sm"
              >
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#c9ad92]">Difficulty</label>
              <select
                value={newFlashcard.difficulty}
                onChange={(e) => setNewFlashcard({ ...newFlashcard, difficulty: e.target.value as any })}
                className="w-full glass-input rounded-lg px-4 py-2.5 text-sm"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>
          
          <Input
            label="Topic (Optional)"
            placeholder="e.g., Fundamental Rights"
            value={newFlashcard.topic}
            onChange={(e) => setNewFlashcard({ ...newFlashcard, topic: e.target.value })}
          />
          
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" fullWidth onClick={() => setShowCreateFlashcardModal(false)}>
              Cancel
            </Button>
            <Button 
              fullWidth 
              onClick={handleCreateFlashcard}
              disabled={!newFlashcard.front.trim() || !newFlashcard.back.trim()}
            >
              Create Card
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Mind Map Modal */}
      <Modal 
        isOpen={showCreateMindMapModal} 
        onClose={() => setShowCreateMindMapModal(false)} 
        title="Generate Mind Map"
      >
        <div className="space-y-4">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-purple-400">auto_awesome</span>
              <div className="text-sm">
                <p className="text-purple-200 font-medium">AI-Powered Generation</p>
                <p className="text-purple-300/80">Enter a topic and AI will create a hierarchical mind map for you.</p>
              </div>
            </div>
          </div>
          
          <Input
            label="Topic"
            placeholder="e.g., Indian Polity, French Revolution"
            value={newMindMapTopic}
            onChange={(e) => setNewMindMapTopic(e.target.value)}
          />
          
          <div className="space-y-2">
            <label className="text-sm text-[#c9ad92]">Subject</label>
            <select
              value={newMindMapSubject}
              onChange={(e) => setNewMindMapSubject(e.target.value)}
              className="w-full glass-input rounded-lg px-4 py-2.5 text-sm"
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <p className="text-xs text-[#c9ad92] flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">token</span>
            Cost: 5 tokens
          </p>
          
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" fullWidth onClick={() => setShowCreateMindMapModal(false)}>
              Cancel
            </Button>
            <Button 
              fullWidth 
              onClick={handleGenerateMindMap}
              disabled={!newMindMapTopic.trim() || generatingMindMap}
              loading={generatingMindMap}
            >
              {generatingMindMap ? 'Generating...' : 'Generate Mind Map'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
