'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  getFaculty,
  getBatchesByFaculty,
  getStudentsByBatch,
  createBatch,
  updateBatch,
  deleteBatch,
  addStudentToBatch,
  removeStudentFromBatch,
  getStudentProgress,
  getAllUsers,
  createNewsArticle,
  getNewsArticles,
  deleteNewsArticle,
  createPYQ,
  Faculty,
  Batch,
  UserProfile,
  StudentProgress,
  NewsArticle,
} from '@/lib/db';
import { GlassCard, Button, Badge, Input, Modal, Avatar, LoadingSpinner, Toast, ProgressBar } from '../UI';

type TabType = 'overview' | 'batches' | 'students' | 'content' | 'analytics';

export const FacultyDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Data state
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchStudents, setBatchStudents] = useState<UserProfile[]>([]);
  const [allStudents, setAllStudents] = useState<UserProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  
  // Modal state
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showStudentDetailModal, setShowStudentDetailModal] = useState(false);
  const [showCreateArticleModal, setShowCreateArticleModal] = useState(false);
  const [showCreatePYQModal, setShowCreatePYQModal] = useState(false);
  
  // Form state
  const [newBatch, setNewBatch] = useState({
    name: '',
    description: '',
    targetExam: 'UPSC CSE 2025',
    maxStudents: 50,
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Article form state
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    summary60Words: '',
    source: 'The Hindu',
    sourceUrl: '',
    imageUrl: '',
    tags: [] as string[],
    gsPaper: [] as string[],
  });
  
  // PYQ form state
  const [newPYQ, setNewPYQ] = useState({
    year: new Date().getFullYear() - 1,
    paper: 'Prelims' as const,
    questionNumber: 1,
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    subject: '',
    topic: '',
    difficulty: 'Medium' as const,
  });

  useEffect(() => {
    if (userProfile?.uid) {
      fetchData();
    }
  }, [userProfile?.uid]);

  const fetchData = async () => {
    if (!userProfile?.uid) return;
    
    try {
      setLoading(true);
      const [facultyData, batchesData, studentsData, articlesData] = await Promise.all([
        getFaculty(userProfile.uid),
        getBatchesByFaculty(userProfile.uid),
        getAllUsers(),
        getNewsArticles({ limitCount: 50 }),
      ]);
      
      setFaculty(facultyData);
      setBatches(batchesData);
      // Filter only students without batch or for adding
      setAllStudents(studentsData.filter(s => s.role === 'student' || !s.role));
      // Filter articles created by this faculty
      setArticles(articlesData.filter(a => a.createdBy === userProfile.uid));
    } catch (error) {
      console.error('Error fetching faculty data:', error);
      setToast({ message: 'Failed to load data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle article creation
  const handleCreateArticle = async () => {
    if (!userProfile || !newArticle.title.trim() || !newArticle.content.trim()) return;
    
    try {
      await createNewsArticle({
        title: newArticle.title,
        content: newArticle.content,
        summary60Words: newArticle.summary60Words,
        source: newArticle.source,
        sourceUrl: newArticle.sourceUrl,
        imageUrl: newArticle.imageUrl,
        tags: newArticle.tags,
        gsPaper: newArticle.gsPaper,
        readingTime: Math.ceil(newArticle.content.split(' ').length / 200), // Estimate reading time
        isPublished: true,
        publishedAt: new Date(),
        createdBy: userProfile.uid,
        createdByEmail: userProfile.email,
      });
      
      setToast({ message: 'Article created successfully', type: 'success' });
      setShowCreateArticleModal(false);
      setNewArticle({
        title: '',
        content: '',
        summary60Words: '',
        source: 'The Hindu',
        sourceUrl: '',
        imageUrl: '',
        tags: [],
        gsPaper: [],
      });
      fetchData();
    } catch (error) {
      setToast({ message: 'Failed to create article', type: 'error' });
    }
  };
  
  // Handle PYQ creation
  const handleCreatePYQ = async () => {
    if (!userProfile || !newPYQ.question.trim()) return;
    
    try {
      await createPYQ({
        year: newPYQ.year,
        paper: newPYQ.paper,
        questionNumber: newPYQ.questionNumber,
        question: newPYQ.question,
        options: newPYQ.paper === 'Prelims' ? newPYQ.options.filter(o => o.trim()) : undefined,
        correctAnswer: newPYQ.correctAnswer,
        explanation: newPYQ.explanation,
        subject: newPYQ.subject,
        topic: newPYQ.topic,
        difficulty: newPYQ.difficulty,
        createdBy: userProfile.uid,
      });
      
      setToast({ message: 'PYQ added successfully', type: 'success' });
      setShowCreatePYQModal(false);
      setNewPYQ({
        year: new Date().getFullYear() - 1,
        paper: 'Prelims',
        questionNumber: 1,
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
        subject: '',
        topic: '',
        difficulty: 'Medium',
      });
    } catch (error) {
      setToast({ message: 'Failed to add PYQ', type: 'error' });
    }
  };
  
  // Handle article deletion
  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
      await deleteNewsArticle(articleId);
      setToast({ message: 'Article deleted', type: 'success' });
      fetchData();
    } catch (error) {
      setToast({ message: 'Failed to delete article', type: 'error' });
    }
  };

  const fetchBatchStudents = async (batchId: string) => {
    try {
      const students = await getStudentsByBatch(batchId);
      setBatchStudents(students);
    } catch (error) {
      console.error('Error fetching batch students:', error);
    }
  };

  const handleSelectBatch = async (batch: Batch) => {
    setSelectedBatch(batch);
    await fetchBatchStudents(batch.id!);
  };

  const handleCreateBatch = async () => {
    if (!userProfile || !newBatch.name.trim()) {
      setToast({ message: 'Please enter a batch name', type: 'error' });
      return;
    }
    
    try {
      await createBatch({
        name: newBatch.name.trim(),
        description: newBatch.description,
        facultyId: userProfile.uid,
        facultyName: userProfile.displayName,
        facultyEmail: userProfile.email,
        targetExam: newBatch.targetExam,
        startDate: new Date(),
        isActive: true,
        maxStudents: newBatch.maxStudents,
        createdBy: userProfile.uid,
      });
      
      setToast({ message: 'Batch created successfully!', type: 'success' });
      setShowCreateBatchModal(false);
      setNewBatch({ name: '', description: '', targetExam: 'UPSC CSE 2025', maxStudents: 50 });
      fetchData();
    } catch (error) {
      console.error('Error creating batch:', error);
      setToast({ message: 'Failed to create batch', type: 'error' });
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure? All students will be removed from this batch.')) return;
    
    try {
      await deleteBatch(batchId);
      setToast({ message: 'Batch deleted', type: 'success' });
      setSelectedBatch(null);
      fetchData();
    } catch (error) {
      setToast({ message: 'Failed to delete batch', type: 'error' });
    }
  };

  const handleAddStudentToBatch = async (studentId: string) => {
    if (!selectedBatch?.id) return;
    
    try {
      await addStudentToBatch(selectedBatch.id, studentId);
      setToast({ message: 'Student added to batch', type: 'success' });
      await fetchBatchStudents(selectedBatch.id);
      fetchData();
    } catch (error) {
      setToast({ message: 'Failed to add student', type: 'error' });
    }
  };

  const handleRemoveStudentFromBatch = async (studentId: string) => {
    if (!selectedBatch?.id) return;
    if (!confirm('Remove this student from the batch?')) return;
    
    try {
      await removeStudentFromBatch(selectedBatch.id, studentId);
      setToast({ message: 'Student removed from batch', type: 'success' });
      await fetchBatchStudents(selectedBatch.id);
      fetchData();
    } catch (error) {
      setToast({ message: 'Failed to remove student', type: 'error' });
    }
  };

  const handleViewStudentProgress = async (student: UserProfile) => {
    setSelectedStudent(student);
    setShowStudentDetailModal(true);
    
    try {
      const progress = await getStudentProgress(student.uid);
      setStudentProgress(progress);
    } catch (error) {
      console.error('Error fetching student progress:', error);
    }
  };

  // Filter students for adding (not already in batch)
  const availableStudents = allStudents.filter(student => {
    const notInBatch = !student.batchId || student.batchId !== selectedBatch?.id;
    const matchesSearch = 
      student.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return notInBatch && matchesSearch;
  });

  // Calculate stats
  const totalStudents = batches.reduce((sum, b) => sum + (b.studentCount || 0), 0);
  const activeBatches = batches.filter(b => b.isActive).length;

  if (!userProfile || (userProfile.role !== 'faculty' && userProfile.role !== 'vero')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <GlassCard className="text-center p-8">
          <span className="material-symbols-outlined text-red-400 text-4xl mb-4">lock</span>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-[#c9ad92]">Faculty Dashboard is restricted to faculty members only.</p>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading Faculty Dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="size-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-2xl">school</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Faculty Dashboard</h1>
              <p className="text-[#c9ad92]">Manage your batches and students</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon="refresh" onClick={fetchData}>Refresh</Button>
          <Button icon="add" onClick={() => setShowCreateBatchModal(true)}>New Batch</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: 'dashboard' },
          { id: 'batches', label: 'My Batches', icon: 'groups' },
          { id: 'students', label: 'Students', icon: 'person' },
          { id: 'content', label: 'Content', icon: 'article' },
          { id: 'analytics', label: 'Analytics', icon: 'analytics' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-[#c9ad92] hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <GlassCard className="text-center py-4">
              <span className="material-symbols-outlined text-blue-400 text-2xl mb-2">groups</span>
              <p className="text-2xl font-bold text-white">{batches.length}</p>
              <p className="text-xs text-[#c9ad92]">Total Batches</p>
            </GlassCard>
            <GlassCard className="text-center py-4">
              <span className="material-symbols-outlined text-green-400 text-2xl mb-2">check_circle</span>
              <p className="text-2xl font-bold text-white">{activeBatches}</p>
              <p className="text-xs text-[#c9ad92]">Active Batches</p>
            </GlassCard>
            <GlassCard className="text-center py-4">
              <span className="material-symbols-outlined text-primary text-2xl mb-2">person</span>
              <p className="text-2xl font-bold text-white">{totalStudents}</p>
              <p className="text-xs text-[#c9ad92]">Total Students</p>
            </GlassCard>
            <GlassCard className="text-center py-4">
              <span className="material-symbols-outlined text-purple-400 text-2xl mb-2">trending_up</span>
              <p className="text-2xl font-bold text-white">--</p>
              <p className="text-xs text-[#c9ad92]">Avg Performance</p>
            </GlassCard>
          </div>

          {/* Recent Batches */}
          <GlassCard>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">My Batches</h3>
              <Button variant="secondary" icon="arrow_forward" onClick={() => setActiveTab('batches')}>
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {batches.slice(0, 3).map((batch, index) => (
                <div
                  key={batch.id || `batch-overview-${index}`}
                  onClick={() => { setSelectedBatch(batch); setActiveTab('students'); handleSelectBatch(batch); }}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/30 cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white">{batch.name}</h4>
                    <Badge color={batch.isActive ? 'green' : 'red'}>
                      {batch.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#c9ad92] mb-3">{batch.description || 'No description'}</p>
                  <div className="flex justify-between text-xs text-[#c9ad92]">
                    <span>{batch.studentCount} / {batch.maxStudents} students</span>
                    <span>{batch.targetExam}</span>
                  </div>
                </div>
              ))}
              
              {batches.length === 0 && (
                <div className="col-span-full text-center py-8 text-[#c9ad92]">
                  <span className="material-symbols-outlined text-4xl mb-2">groups</span>
                  <p>No batches yet. Create your first batch!</p>
                  <Button className="mt-4" onClick={() => setShowCreateBatchModal(true)}>
                    Create Batch
                  </Button>
                </div>
              )}
            </div>
          </GlassCard>
        </>
      )}

      {/* Batches Tab */}
      {activeTab === 'batches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((batch, index) => (
            <GlassCard key={batch.id || `batch-${index}`} className="flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-white">{batch.name}</h4>
                  <p className="text-xs text-[#c9ad92]">{batch.targetExam}</p>
                </div>
                <Badge color={batch.isActive ? 'green' : 'red'}>
                  {batch.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <p className="text-sm text-[#c9ad92] mb-4 flex-1">
                {batch.description || 'No description provided'}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#c9ad92]">Students</span>
                  <span className="text-white">{batch.studentCount} / {batch.maxStudents}</span>
                </div>
                <ProgressBar value={batch.studentCount} max={batch.maxStudents} color="bg-blue-500" />
                <div className="flex justify-between text-sm">
                  <span className="text-[#c9ad92]">Started</span>
                  <span className="text-white">{new Date(batch.startDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4 border-t border-white/10">
                <Button 
                  variant="secondary" 
                  fullWidth 
                  onClick={() => { handleSelectBatch(batch); setActiveTab('students'); }}
                >
                  View Students
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => handleDeleteBatch(batch.id!)}
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </Button>
              </div>
            </GlassCard>
          ))}
          
          {/* Add New Batch Card */}
          <GlassCard 
            className="flex items-center justify-center min-h-[250px] border-dashed cursor-pointer hover:border-blue-500/50"
            onClick={() => setShowCreateBatchModal(true)}
          >
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl text-[#c9ad92] mb-2">add_circle</span>
              <p className="text-[#c9ad92]">Create New Batch</p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Batch Selector */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm text-[#c9ad92] mb-2 block">Select Batch</label>
              <select
                value={selectedBatch?.id || ''}
                onChange={(e) => {
                  const batch = batches.find(b => b.id === e.target.value);
                  if (batch) handleSelectBatch(batch);
                }}
                className="w-full px-4 py-2 rounded-lg bg-[#2c2219] border border-[#483623] text-white"
              >
                <option value="">Select a batch...</option>
                {batches.map((batch, index) => (
                  <option key={batch.id || `batch-select-${index}`} value={batch.id || ''}>{batch.name} ({batch.studentCount} students)</option>
                ))}
              </select>
            </div>
            {selectedBatch && (
              <div className="flex items-end">
                <Button icon="person_add" onClick={() => setShowAddStudentModal(true)}>
                  Add Students
                </Button>
              </div>
            )}
          </div>

          {/* Students List */}
          {selectedBatch ? (
            <GlassCard>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">
                  {selectedBatch.name} - Students ({batchStudents.length})
                </h3>
              </div>
              
              {batchStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[#c9ad92] text-sm border-b border-[#483623]">
                        <th className="pb-3 font-medium">Student</th>
                        <th className="pb-3 font-medium">Plan</th>
                        <th className="pb-3 font-medium">Tests</th>
                        <th className="pb-3 font-medium">Avg Score</th>
                        <th className="pb-3 font-medium">Streak</th>
                        <th className="pb-3 font-medium">Last Active</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {batchStudents.map(student => (
                        <tr key={student.uid} className="border-b border-[#483623]/30 hover:bg-white/5">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <Avatar src={student.photoURL} name={student.displayName} size="sm" />
                              <div>
                                <p className="font-medium text-white">{student.displayName}</p>
                                <p className="text-xs text-[#c9ad92]">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <Badge color={student.plan === 'Premium' ? 'primary' : student.plan === 'Lifetime' ? 'purple' : 'blue'}>
                              {student.plan || 'Free'}
                            </Badge>
                          </td>
                          <td className="py-3 text-white">{student.testsCompleted || 0}</td>
                          <td className="py-3 text-white">{student.averageScore || 0}%</td>
                          <td className="py-3">
                            <span className="flex items-center gap-1 text-orange-400">
                              <span className="material-symbols-outlined text-sm">local_fire_department</span>
                              {student.streak || 0}
                            </span>
                          </td>
                          <td className="py-3 text-[#c9ad92]">
                            {student.lastLoginAt ? new Date(student.lastLoginAt).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewStudentProgress(student)}
                                className="p-1 text-blue-400 hover:text-blue-300"
                                title="View Progress"
                              >
                                <span className="material-symbols-outlined text-[18px]">analytics</span>
                              </button>
                              <button
                                onClick={() => handleRemoveStudentFromBatch(student.uid)}
                                className="p-1 text-red-400 hover:text-red-300"
                                title="Remove from Batch"
                              >
                                <span className="material-symbols-outlined text-[18px]">person_remove</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-[#c9ad92]">
                  <span className="material-symbols-outlined text-4xl mb-2">group_off</span>
                  <p>No students in this batch yet.</p>
                  <Button className="mt-4" onClick={() => setShowAddStudentModal(true)}>
                    Add Students
                  </Button>
                </div>
              )}
            </GlassCard>
          ) : (
            <GlassCard className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-[#c9ad92] mb-2">groups</span>
              <p className="text-[#c9ad92]">Select a batch to view students</p>
            </GlassCard>
          )}
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">Content Management</h3>
              <p className="text-sm text-[#c9ad92]">Create and manage articles, PYQs, and study materials</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" icon="add" onClick={() => setShowCreatePYQModal(true)}>
                Add PYQ
              </Button>
              <Button icon="add" onClick={() => setShowCreateArticleModal(true)}>
                New Article
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard 
              className="cursor-pointer hover:bg-white/10 transition-all"
              onClick={() => setShowCreateArticleModal(true)}
            >
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-400">article</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">News Article</h4>
                  <p className="text-sm text-[#c9ad92]">Add daily current affairs</p>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard 
              className="cursor-pointer hover:bg-white/10 transition-all"
              onClick={() => setShowCreatePYQModal(true)}
            >
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-400">quiz</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">Previous Year Q</h4>
                  <p className="text-sm text-[#c9ad92]">Add UPSC PYQs</p>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="opacity-60">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-400">description</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">Editorial Brief</h4>
                  <p className="text-sm text-[#c9ad92]">Coming soon</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* My Articles */}
          <GlassCard>
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-400">article</span>
              My Articles ({articles.length})
            </h4>
            
            {articles.length > 0 ? (
              <div className="space-y-3">
                {articles.map((article, index) => (
                  <div 
                    key={article.id || `article-${index}`}
                    className="flex items-start justify-between p-4 rounded-lg bg-white/5"
                  >
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-white truncate">{article.title}</h5>
                      <p className="text-sm text-[#c9ad92] line-clamp-2 mt-1">
                        {article.content.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-[#c9ad92]">
                          {article.createdAt.toLocaleDateString()}
                        </span>
                        <div className="flex gap-1">
                          {article.tags.slice(0, 3).map((tag, i) => (
                            <Badge key={i} color="blue">{tag}</Badge>
                          ))}
                        </div>
                        <Badge color={article.isPublished ? 'green' : 'yellow'}>
                          {article.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      icon="delete"
                      onClick={() => article.id && handleDeleteArticle(article.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#c9ad92]">
                <span className="material-symbols-outlined text-4xl mb-2">article</span>
                <p>No articles yet. Create your first article!</p>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <GlassCard className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-blue-400 mb-4">analytics</span>
          <h3 className="text-xl font-bold text-white mb-2">Batch Analytics</h3>
          <p className="text-[#c9ad92] mb-4">Detailed analytics for your batches coming soon!</p>
          <Badge>Coming Soon</Badge>
        </GlassCard>
      )}

      {/* Create Batch Modal */}
      <Modal isOpen={showCreateBatchModal} onClose={() => setShowCreateBatchModal(false)} title="Create New Batch">
        <div className="space-y-4">
          <Input
            label="Batch Name"
            placeholder="e.g., UPSC 2025 Batch A"
            value={newBatch.name}
            onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
          />
          <div className="space-y-2">
            <label className="text-sm text-[#c9ad92]">Description</label>
            <textarea
              placeholder="Optional batch description..."
              value={newBatch.description}
              onChange={(e) => setNewBatch({ ...newBatch, description: e.target.value })}
              className="w-full glass-input rounded-lg px-4 py-3 text-sm resize-none h-20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-[#c9ad92]">Target Exam</label>
              <select
                value={newBatch.targetExam}
                onChange={(e) => setNewBatch({ ...newBatch, targetExam: e.target.value })}
                className="w-full glass-input rounded-lg px-4 py-2.5 text-sm"
              >
                <option value="UPSC CSE 2025">UPSC CSE 2025</option>
                <option value="UPSC CSE 2026">UPSC CSE 2026</option>
                <option value="UPSC CSE 2027">UPSC CSE 2027</option>
              </select>
            </div>
            <Input
              label="Max Students"
              type="number"
              value={newBatch.maxStudents}
              onChange={(e) => setNewBatch({ ...newBatch, maxStudents: parseInt(e.target.value) || 50 })}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" fullWidth onClick={() => setShowCreateBatchModal(false)}>
              Cancel
            </Button>
            <Button fullWidth onClick={handleCreateBatch}>
              Create Batch
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Student Modal */}
      <Modal isOpen={showAddStudentModal} onClose={() => setShowAddStudentModal(false)} title="Add Students to Batch" size="lg">
        <div className="space-y-4">
          <Input
            placeholder="Search students by name or email..."
            icon="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <div className="max-h-96 overflow-y-auto space-y-2">
            {availableStudents.slice(0, 20).map(student => (
              <div
                key={student.uid}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={student.photoURL} name={student.displayName} size="sm" />
                  <div>
                    <p className="text-white text-sm">{student.displayName}</p>
                    <p className="text-xs text-[#c9ad92]">{student.email}</p>
                  </div>
                </div>
                <Button 
                  variant="secondary"
                  onClick={() => handleAddStudentToBatch(student.uid)}
                >
                  Add
                </Button>
              </div>
            ))}
            
            {availableStudents.length === 0 && (
              <div className="text-center py-8 text-[#c9ad92]">
                <p>No available students found</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Student Detail Modal */}
      <Modal 
        isOpen={showStudentDetailModal} 
        onClose={() => { setShowStudentDetailModal(false); setStudentProgress(null); }} 
        title="Student Progress" 
        size="lg"
      >
        {selectedStudent && (
          <div className="space-y-6">
            {/* Student Header */}
            <div className="flex items-center gap-4">
              <Avatar src={selectedStudent.photoURL} name={selectedStudent.displayName} size="xl" />
              <div>
                <h3 className="text-xl font-bold text-white">{selectedStudent.displayName}</h3>
                <p className="text-[#c9ad92]">{selectedStudent.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge color={selectedStudent.plan === 'Premium' ? 'primary' : 'blue'}>
                    {selectedStudent.plan || 'Free'}
                  </Badge>
                  <Badge color="green">
                    {selectedStudent.streak || 0} Day Streak
                  </Badge>
                </div>
              </div>
            </div>

            {studentProgress ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-white/5 text-center">
                    <p className="text-2xl font-bold text-white">{studentProgress.quizzes.length}</p>
                    <p className="text-xs text-[#c9ad92]">Quizzes Taken</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 text-center">
                    <p className="text-2xl font-bold text-white">{studentProgress.averageQuizScore}%</p>
                    <p className="text-xs text-[#c9ad92]">Avg Quiz Score</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 text-center">
                    <p className="text-2xl font-bold text-white">{studentProgress.gradings.length}</p>
                    <p className="text-xs text-[#c9ad92]">Essays Graded</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 text-center">
                    <p className="text-2xl font-bold text-white">{studentProgress.averageGradingScore}%</p>
                    <p className="text-xs text-[#c9ad92]">Avg Essay Score</p>
                  </div>
                </div>

                {/* Subject Scores */}
                <div>
                  <h4 className="text-white font-bold mb-3">Subject Performance</h4>
                  <div className="space-y-3">
                    {(Object.entries(studentProgress.subjectScores) as [string, number][]).map(([subject, score]) => (
                      <div key={subject}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#c9ad92] capitalize">{subject}</span>
                          <span className="text-white">{score}%</span>
                        </div>
                        <ProgressBar value={score} max={100} color={score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="text-white font-bold mb-3">Recent Quizzes</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {studentProgress.quizzes.slice(0, 5).map((quiz, index) => (
                      <div key={quiz.id || `quiz-${index}`} className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                        <div>
                          <p className="text-sm text-white">{quiz.subject}</p>
                          <p className="text-xs text-[#c9ad92]">{new Date(quiz.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Badge color={quiz.score / quiz.totalQuestions >= 0.7 ? 'green' : 'yellow'}>
                          {quiz.score}/{quiz.totalQuestions}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner text="Loading progress..." />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Article Modal */}
      <Modal 
        isOpen={showCreateArticleModal} 
        onClose={() => setShowCreateArticleModal(false)} 
        title="Create News Article"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input
            label="Article Title"
            placeholder="Enter article title..."
            value={newArticle.title}
            onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
          />
          
          <div className="space-y-2">
            <label className="text-sm text-[#c9ad92]">Article Content *</label>
            <textarea
              placeholder="Write the full article content..."
              value={newArticle.content}
              onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
              className="w-full glass-input rounded-lg px-4 py-3 text-sm resize-none h-40"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-[#c9ad92]">60-Word Summary (Optional)</label>
            <textarea
              placeholder="Brief 60-word summary for quick reading..."
              value={newArticle.summary60Words}
              onChange={(e) => setNewArticle({ ...newArticle, summary60Words: e.target.value })}
              className="w-full glass-input rounded-lg px-4 py-3 text-sm resize-none h-20"
            />
            <p className="text-xs text-[#c9ad92]">
              Words: {newArticle.summary60Words.split(' ').filter(w => w).length}/60
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Source"
              placeholder="e.g., The Hindu"
              value={newArticle.source}
              onChange={(e) => setNewArticle({ ...newArticle, source: e.target.value })}
            />
            <Input
              label="Source URL"
              placeholder="https://..."
              value={newArticle.sourceUrl}
              onChange={(e) => setNewArticle({ ...newArticle, sourceUrl: e.target.value })}
            />
          </div>
          
          <Input
            label="Image URL (Optional)"
            placeholder="https://..."
            value={newArticle.imageUrl}
            onChange={(e) => setNewArticle({ ...newArticle, imageUrl: e.target.value })}
          />
          
          <div className="space-y-2">
            <label className="text-sm text-[#c9ad92]">Tags</label>
            <div className="flex flex-wrap gap-2">
              {['Polity', 'Economy', 'Environment', 'Science', 'International', 'Social', 'Governance'].map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    if (newArticle.tags.includes(tag)) {
                      setNewArticle({ ...newArticle, tags: newArticle.tags.filter(t => t !== tag) });
                    } else {
                      setNewArticle({ ...newArticle, tags: [...newArticle.tags, tag] });
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    newArticle.tags.includes(tag)
                      ? 'bg-primary text-white'
                      : 'bg-white/10 text-[#c9ad92] hover:bg-white/20'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-[#c9ad92]">GS Paper Relevance</label>
            <div className="flex flex-wrap gap-2">
              {['GS1', 'GS2', 'GS3', 'GS4', 'Prelims'].map(paper => (
                <button
                  key={paper}
                  onClick={() => {
                    if (newArticle.gsPaper.includes(paper)) {
                      setNewArticle({ ...newArticle, gsPaper: newArticle.gsPaper.filter(p => p !== paper) });
                    } else {
                      setNewArticle({ ...newArticle, gsPaper: [...newArticle.gsPaper, paper] });
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    newArticle.gsPaper.includes(paper)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-[#c9ad92] hover:bg-white/20'
                  }`}
                >
                  {paper}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" fullWidth onClick={() => setShowCreateArticleModal(false)}>
              Cancel
            </Button>
            <Button 
              fullWidth 
              onClick={handleCreateArticle}
              disabled={!newArticle.title.trim() || !newArticle.content.trim()}
            >
              Publish Article
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create PYQ Modal */}
      <Modal 
        isOpen={showCreatePYQModal} 
        onClose={() => setShowCreatePYQModal(false)} 
        title="Add Previous Year Question"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-[#c9ad92]">Year</label>
              <select
                value={newPYQ.year}
                onChange={(e) => setNewPYQ({ ...newPYQ, year: parseInt(e.target.value) })}
                className="w-full glass-input rounded-lg px-4 py-2.5 text-sm"
              >
                {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 1 - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#c9ad92]">Paper</label>
              <select
                value={newPYQ.paper}
                onChange={(e) => setNewPYQ({ ...newPYQ, paper: e.target.value as any })}
                className="w-full glass-input rounded-lg px-4 py-2.5 text-sm"
              >
                <option value="Prelims">Prelims</option>
                <option value="Mains-GS1">Mains GS1</option>
                <option value="Mains-GS2">Mains GS2</option>
                <option value="Mains-GS3">Mains GS3</option>
                <option value="Mains-GS4">Mains GS4</option>
                <option value="Essay">Essay</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#c9ad92]">Q. No.</label>
              <Input
                type="number"
                value={newPYQ.questionNumber}
                onChange={(e) => setNewPYQ({ ...newPYQ, questionNumber: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-[#c9ad92]">Question *</label>
            <textarea
              placeholder="Enter the question..."
              value={newPYQ.question}
              onChange={(e) => setNewPYQ({ ...newPYQ, question: e.target.value })}
              className="w-full glass-input rounded-lg px-4 py-3 text-sm resize-none h-24"
            />
          </div>
          
          {newPYQ.paper === 'Prelims' && (
            <div className="space-y-3">
              <label className="text-sm text-[#c9ad92]">Options (for Prelims MCQ)</label>
              {['A', 'B', 'C', 'D'].map((letter, index) => (
                <div key={letter} className="flex items-center gap-2">
                  <span className="text-[#c9ad92] font-medium w-6">{letter})</span>
                  <Input
                    placeholder={`Option ${letter}`}
                    value={newPYQ.options[index]}
                    onChange={(e) => {
                      const newOptions = [...newPYQ.options];
                      newOptions[index] = e.target.value;
                      setNewPYQ({ ...newPYQ, options: newOptions });
                    }}
                  />
                </div>
              ))}
              <div className="flex items-center gap-2">
                <label className="text-sm text-[#c9ad92]">Correct Answer:</label>
                <select
                  value={newPYQ.correctAnswer}
                  onChange={(e) => setNewPYQ({ ...newPYQ, correctAnswer: e.target.value })}
                  className="glass-input rounded-lg px-4 py-2 text-sm"
                >
                  <option value="">Select</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm text-[#c9ad92]">Explanation</label>
            <textarea
              placeholder="Explain the answer..."
              value={newPYQ.explanation}
              onChange={(e) => setNewPYQ({ ...newPYQ, explanation: e.target.value })}
              className="w-full glass-input rounded-lg px-4 py-3 text-sm resize-none h-20"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-[#c9ad92]">Subject</label>
              <select
                value={newPYQ.subject}
                onChange={(e) => setNewPYQ({ ...newPYQ, subject: e.target.value })}
                className="w-full glass-input rounded-lg px-4 py-2.5 text-sm"
              >
                <option value="">Select Subject</option>
                <option value="Polity">Polity</option>
                <option value="History">History</option>
                <option value="Geography">Geography</option>
                <option value="Economy">Economy</option>
                <option value="Environment">Environment</option>
                <option value="Science">Science</option>
                <option value="Current Affairs">Current Affairs</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#c9ad92]">Difficulty</label>
              <select
                value={newPYQ.difficulty}
                onChange={(e) => setNewPYQ({ ...newPYQ, difficulty: e.target.value as any })}
                className="w-full glass-input rounded-lg px-4 py-2.5 text-sm"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>
          
          <Input
            label="Topic"
            placeholder="e.g., Fundamental Rights, French Revolution"
            value={newPYQ.topic}
            onChange={(e) => setNewPYQ({ ...newPYQ, topic: e.target.value })}
          />
          
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" fullWidth onClick={() => setShowCreatePYQModal(false)}>
              Cancel
            </Button>
            <Button 
              fullWidth 
              onClick={handleCreatePYQ}
              disabled={!newPYQ.question.trim() || !newPYQ.subject}
            >
              Add PYQ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
