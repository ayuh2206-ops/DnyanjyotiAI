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
  Faculty,
  Batch,
  UserProfile,
  StudentProgress,
} from '@/lib/db';
import { GlassCard, Button, Badge, Input, Modal, Avatar, LoadingSpinner, Toast, ProgressBar } from '../UI';

type TabType = 'overview' | 'batches' | 'students' | 'analytics';

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
  
  // Modal state
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showStudentDetailModal, setShowStudentDetailModal] = useState(false);
  
  // Form state
  const [newBatch, setNewBatch] = useState({
    name: '',
    description: '',
    targetExam: 'UPSC CSE 2025',
    maxStudents: 50,
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (userProfile?.uid) {
      fetchData();
    }
  }, [userProfile?.uid]);

  const fetchData = async () => {
    if (!userProfile?.uid) return;
    
    try {
      setLoading(true);
      const [facultyData, batchesData, studentsData] = await Promise.all([
        getFaculty(userProfile.uid),
        getBatchesByFaculty(userProfile.uid),
        getAllUsers(),
      ]);
      
      setFaculty(facultyData);
      setBatches(batchesData);
      // Filter only students without batch or for adding
      setAllStudents(studentsData.filter(s => s.role === 'student' || !s.role));
    } catch (error) {
      console.error('Error fetching faculty data:', error);
      setToast({ message: 'Failed to load data', type: 'error' });
    } finally {
      setLoading(false);
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
    </div>
  );
};
