import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Database,
  UploadCloud,
  CheckSquare,
  Cpu,
  FileCheck,
  Link2,
  Users,
  PlusCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Trash2,
  Send,
  Eye,
  Clock,
  Lock,
  Timer,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { BLOOM_TAXONOMY, COURSE_OUTCOMES } from '../data/mockData';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function AdminDashboard() {
  const {
    questions,
    generatedPapers,
    auditLogs,
    users,
    uploadWindow,
    setUploadWindow,
    isUploadAllowed,
    addQuestion,
    generatePaper,
    addUser,
    deleteUser
  } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Live timer tick for upload deadline countdown
  const [nowTime, setNowTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [showTimeControl, setShowTimeControl] = useState(false);

  const uploadCheck = isUploadAllowed();

  const getUploadCountdown = () => {
    if (!uploadWindow.enabled) return { status: 'DISABLED', text: 'Upload Window Policy Disabled' };
    const end = new Date(uploadWindow.endTime).getTime();
    const start = new Date(uploadWindow.startTime).getTime();
    const now = nowTime.getTime();

    if (now < start) {
      const diff = Math.floor((start - now) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      return { status: 'NOT_STARTED', text: `Opens in ${mins}m ${secs}s` };
    }

    if (now > end) {
      return { status: 'EXPIRED', text: 'Upload Time Limit Expired' };
    }

    const diff = Math.floor((end - now) / 1000);
    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    return {
      status: 'ACTIVE',
      text: `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
      totalSecs: diff
    };
  };

  const uploadCountdown = getUploadCountdown();

  // User creation form state
  const [newUserForm, setNewUserForm] = useState({ name: '', role: 'Scrutiny Officer (Level 1)', clearance: 'Tier 2 Scrutiny' });
  const [showUserModal, setShowUserModal] = useState(false);

  // Unique subjects derived dynamically
  const uniqueSubjects = Array.from(new Set(questions.map((q) => q.subject))).filter(Boolean);

  // Derived stats
  const stats = {
    totalSubjects: uniqueSubjects.length,
    uploadedQuestions: questions.length,
    pendingScrutiny: questions.filter((q) => q.status && q.status.includes('Pending')).length,
    approvedQuestions: questions.filter((q) => q.status === 'Approved').length,
    generatedPapers: generatedPapers.length,
    blockchainTx: auditLogs.length,
    registeredUsers: users.length
  };

  // Manual Question Entry Form State
  const [manualForm, setManualForm] = useState({
    subject: '',
    unit: '',
    topic: '',
    difficulty: 'Medium',
    bloomLevel: BLOOM_TAXONOMY[0],
    courseOutcome: COURSE_OUTCOMES[0],
    marks: 5,
    questionText: '',
    answer: '',
    keywords: ''
  });

  // Selected subject for AI Paper Generation
  const [selectedGenSubject, setSelectedGenSubject] = useState(uniqueSubjects[0] || '');

  const [notification, setNotification] = useState('');

  const triggerNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Drag and Drop Upload with actual FileReader
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (e) => {
    e.preventDefault();
    const check = isUploadAllowed();
    if (!check.allowed) {
      triggerNotify(`❌ ${check.reason}`);
      return;
    }

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    let addedCount = 0;

    for (const file of files) {
      try {
        const text = await file.text();
        // Check if file is JSON
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = null;
        }

        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item.questionText || item.topic) {
              addQuestion({
                subject: item.subject || manualForm.subject,
                unit: item.unit || 'Unit 1',
                topic: item.topic || 'Imported Topic',
                difficulty: item.difficulty || 'Medium',
                bloomLevel: item.bloomLevel || 'Understand',
                courseOutcome: item.courseOutcome || COURSE_OUTCOMES[0],
                marks: Number(item.marks) || 5,
                questionText: item.questionText || 'Imported Question Content',
                answer: item.answer || 'Imported Solution',
                keywords: Array.isArray(item.keywords) ? item.keywords : (item.keywords || '').split(',')
              }, user?.name || 'Administrator');
              addedCount++;
            }
          });
        } else {
          // Parse lines from plain text / CSV
          const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
          lines.forEach((line, idx) => {
            addQuestion({
              subject: manualForm.subject,
              unit: `Unit ${(idx % 4) + 1}`,
              topic: `Imported Line ${idx + 1}`,
              difficulty: 'Medium',
              bloomLevel: 'Understand',
              courseOutcome: COURSE_OUTCOMES[0],
              marks: 5,
              questionText: line,
              answer: 'Reference solution required',
              keywords: ['Imported']
            }, user?.name || 'Administrator');
            addedCount++;
          });
        }
      } catch (err) {
        console.error('Error reading file:', err);
        triggerNotify(`❌ ${err.message || 'Error processing file'}`);
      }
    }

    triggerNotify(`Successfully processed ${files.length} file(s). Ingested ${addedCount} question(s) into scrutiny queue.`);
  };

  // Submit Manual Question
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualForm.questionText.trim()) return;

    try {
      const createdQ = addQuestion({
        ...manualForm,
        bloomLevel: manualForm.bloomLevel.split(' ')[0],
        keywords: manualForm.keywords ? manualForm.keywords.split(',').map((k) => k.trim()) : []
      }, user?.name || 'Administrator');

      triggerNotify(`Question ${createdQ.id} added and submitted for Scrutiny Round 1!`);
      setManualForm({
        subject: '',
        unit: '',
        topic: '',
        difficulty: 'Medium',
        bloomLevel: BLOOM_TAXONOMY[0],
        courseOutcome: COURSE_OUTCOMES[0],
        marks: 5,
        questionText: '',
        answer: '',
        keywords: ''
      });
    } catch (err) {
      triggerNotify(`❌ ${err.message}`);
    }
  };

  // AI Paper Generation Handler
  const handleGenerateAIPaper = () => {
    const approvedForSubject = questions.filter(
      (q) => q.status === 'Approved' && (q.subject === selectedGenSubject || !selectedGenSubject)
    );

    if (approvedForSubject.length === 0) {
      triggerNotify(`No Scrutiny-Approved questions available for "${selectedGenSubject}". Please approve questions first.`);
      return;
    }

    const createdPaper = generatePaper({
      title: `${selectedGenSubject} Examination Paper`,
      subject: selectedGenSubject,
      userName: user?.name || 'Administrator'
    });

    triggerNotify(`Paper ${createdPaper.paperCode} generated with ${createdPaper.questions.length} approved question(s).`);
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUserForm.name.trim()) return;
    const added = addUser(newUserForm, user?.name || 'Administrator');
    triggerNotify(`New User ${added.name} (${added.id}) created successfully!`);
    setNewUserForm({ name: '', role: 'Scrutiny Officer (Level 1)', clearance: 'Tier 2 Scrutiny' });
    setShowUserModal(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'repository', label: 'Question Repository', icon: Database },
    { id: 'upload', label: 'Upload Questions', icon: UploadCloud },
    { id: 'scrutiny-mgt', label: 'Scrutiny Management', icon: CheckSquare },
    { id: 'ai-gen', label: 'AI Paper Generation', icon: Cpu },
    { id: 'generated-papers', label: 'Generated Papers', icon: FileCheck },
    { id: 'blockchain', label: 'Audit Logs', icon: Link2 },
    { id: 'users', label: 'User Management', icon: Users }
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar-nav">
        <div className="nav-section-label">ADMINISTRATOR CONSOLE</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </aside>

      {/* Main Content Area */}
      <main className="content-viewport">
        {/* Top Floating Notification */}
        {notification && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              padding: '12px 18px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={18} />
              <span>{notification}</span>
            </div>
          </div>
        )}

        {/* 1. DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.4rem' }}>System Analytics & Infrastructure Status</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Real-time tracking of examination paper generation pipeline and security status.
              </p>
            </div>

            {/* Analytics Cards */}
            <div className="stats-grid">
              <div className="glass-panel stat-card">
                <div>
                  <div className="stat-title">Total Subjects</div>
                  <div className="stat-value">{stats.totalSubjects}</div>
                  <span className="stat-badge" style={{ background: 'rgba(0, 120, 212, 0.2)', color: '#38bdf8' }}>
                    Active Curriculums
                  </span>
                </div>
                <Database size={24} style={{ color: '#0078d4', opacity: 0.8 }} />
              </div>

              <div className="glass-panel stat-card">
                <div>
                  <div className="stat-title">Uploaded Questions</div>
                  <div className="stat-value">{stats.uploadedQuestions}</div>
                  <span className="stat-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                    In Repository
                  </span>
                </div>
                <UploadCloud size={24} style={{ color: '#10b981', opacity: 0.8 }} />
              </div>

              <div className="glass-panel stat-card">
                <div>
                  <div className="stat-title">Pending Scrutiny</div>
                  <div className="stat-value">{stats.pendingScrutiny}</div>
                  <span className="stat-badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                    In Queue
                  </span>
                </div>
                <CheckSquare size={24} style={{ color: '#f59e0b', opacity: 0.8 }} />
              </div>

              <div className="glass-panel stat-card">
                <div>
                  <div className="stat-title">Approved Questions</div>
                  <div className="stat-value">{stats.approvedQuestions}</div>
                  <span className="stat-badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
                    Verified Bank
                  </span>
                </div>
                <CheckCircle2 size={24} style={{ color: '#a855f7', opacity: 0.8 }} />
              </div>

              <div className="glass-panel stat-card">
                <div>
                  <div className="stat-title">Generated Papers</div>
                  <div className="stat-value">{stats.generatedPapers}</div>
                  <span className="stat-badge" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                    Secured Papers
                  </span>
                </div>
                <FileCheck size={24} style={{ color: '#38bdf8', opacity: 0.8 }} />
              </div>

              <div className="glass-panel stat-card">
                <div>
                  <div className="stat-title">Audit Transactions</div>
                  <div className="stat-value">{stats.blockchainTx}</div>
                  <span className="stat-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                    Audit Records
                  </span>
                </div>
                <Link2 size={24} style={{ color: '#10b981', opacity: 0.8 }} />
              </div>

              <div className="glass-panel stat-card">
                <div>
                  <div className="stat-title">Registered Staff</div>
                  <div className="stat-value">{stats.registeredUsers}</div>
                  <span className="stat-badge" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                    System Users
                  </span>
                </div>
                <ShieldCheck size={24} style={{ color: '#38bdf8', opacity: 0.8 }} />
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '16px' }}>Quick Administrative Commands</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>
                  <PlusCircle size={16} />
                  <span>Upload / Add Questions</span>
                </button>
                <button className="btn btn-secondary" onClick={() => setActiveTab('ai-gen')}>
                  <Sparkles size={16} style={{ color: '#38bdf8' }} />
                  <span>Trigger AI Paper Generation</span>
                </button>
                <button className="btn btn-secondary" onClick={() => setActiveTab('blockchain')}>
                  <Link2 size={16} />
                  <span>Inspect Audit Ledger</span>
                </button>
                <button className="btn btn-secondary" onClick={() => setActiveTab('users')}>
                  <Users size={16} />
                  <span>Manage System Users</span>
                </button>
              </div>
            </div>

            {/* Recent Questions Table */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1rem' }}>Recent Submissions & Scrutiny Progress</h3>
                <button className="btn btn-secondary" onClick={() => setActiveTab('repository')} style={{ fontSize: '0.78rem' }}>
                  View All Repository Questions
                </button>
              </div>
              <div className="table-container">
                {questions.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No questions in repository yet. Click "Upload / Add Questions" to start.
                  </div>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Question ID</th>
                        <th>Subject</th>
                        <th>Bloom Taxonomy</th>
                        <th>Marks</th>
                        <th>Scrutiny Status</th>
                        <th>Submitted By</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.slice(0, 5).map((q) => (
                        <tr key={q.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#38bdf8' }}>{q.id}</td>
                          <td>{q.subject}</td>
                          <td>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4 }}>
                              {q.bloomLevel}
                            </span>
                          </td>
                          <td>{q.marks} M</td>
                          <td>
                            <span className={`round-pill round-${q.round || 1}`}>
                              {q.status}
                            </span>
                          </td>
                          <td>{q.submittedBy}</td>
                          <td>
                            <button
                              className="btn btn-secondary"
                              onClick={() => setSelectedQuestion(q)}
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              <Eye size={12} />
                              <span>Preview</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. QUESTION REPOSITORY */}
        {activeTab === 'repository' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>Question Repository</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Centralized question bank categorized by Bloom's Taxonomy & Course Outcomes.
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>
                <PlusCircle size={16} />
                <span>Add Question</span>
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div className="table-container">
                {questions.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Question repository is currently empty.
                  </div>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Subject & Topic</th>
                        <th>Bloom's Level</th>
                        <th>Course Outcome</th>
                        <th>Marks</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((q) => (
                        <tr key={q.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 600 }}>{q.id}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{q.subject}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.topic}</div>
                          </td>
                          <td>{q.bloomLevel}</td>
                          <td>{q.courseOutcome ? q.courseOutcome.split(':')[0] : 'N/A'}</td>
                          <td>{q.marks} Marks</td>
                          <td>
                            <span className={`round-pill round-${q.round || 1}`}>{q.status}</span>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary"
                              onClick={() => setSelectedQuestion(q)}
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. UPLOAD QUESTIONS */}
        {activeTab === 'upload' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>Upload & Ingest Questions</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Batch import via drag-and-drop file ingestion or manually enter questions into the repository.
                </p>
              </div>

              {/* Time Limit Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    background: uploadCountdown.status === 'ACTIVE'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                    border: uploadCountdown.status === 'ACTIVE'
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : '1px solid rgba(239, 68, 68, 0.4)',
                    color: uploadCountdown.status === 'ACTIVE' ? '#34d399' : '#f87171',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {uploadCountdown.status === 'ACTIVE' ? <Timer size={16} /> : <Lock size={16} />}
                  <span>
                    {uploadCountdown.status === 'ACTIVE'
                      ? `Time Remaining: ${uploadCountdown.text}`
                      : uploadCountdown.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Expired / Locked Notification Callout */}
            {!uploadCheck.allowed && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  color: '#f87171'
                }}
              >
                <Lock size={28} />
                <div>
                  <h4 style={{ fontSize: '0.98rem', margin: 0, fontWeight: 700 }}>
                    Question Submissions Currently Locked
                  </h4>
                  <p style={{ fontSize: '0.82rem', margin: '4px 0 0 0', opacity: 0.9 }}>
                    {uploadCheck.reason} Use the Quick Extend buttons or update the Upload Deadline above to allow new question entries.
                  </p>
                </div>
              </div>
            )}

            {/* Upload Workspace */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', opacity: uploadCheck.allowed ? 1 : 0.55 }}>
              {/* Batch Drag-and-Drop Uploader */}
              <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Bulk File Import</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Supports JSON arrays and text files with question lists.
                </p>

                <div className="dropzone" onDragOver={handleDragOver} onDrop={handleDrop} style={{ cursor: uploadCheck.allowed ? 'pointer' : 'not-allowed' }}>
                  <UploadCloud size={48} style={{ color: uploadCheck.allowed ? '#0078d4' : '#64748b', marginBottom: '12px' }} />
                  <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>
                    {uploadCheck.allowed ? 'Drag & Drop Question Files Here' : 'Upload Zone Locked (Time Limit Expired)'}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
                    {uploadCheck.allowed ? 'Select .json or .txt question files to process into scrutiny queue' : 'Time limit expired. Extend deadline to upload.'}
                  </p>
                </div>
              </div>

              {/* Manual Question Form */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '16px' }}>Manual Question Entry</h3>

                <form onSubmit={handleManualSubmit}>
                  <fieldset disabled={!uploadCheck.allowed} style={{ border: 'none', padding: 0, margin: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Subject</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Computer Security & Cryptography"
                          value={manualForm.subject}
                          onChange={(e) => setManualForm({ ...manualForm, subject: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Unit / Module</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Unit 1"
                          value={manualForm.unit}
                          onChange={(e) => setManualForm({ ...manualForm, unit: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Syllabus Topic</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Public Key Cryptosystems"
                        value={manualForm.topic}
                        onChange={(e) => setManualForm({ ...manualForm, topic: e.target.value })}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Difficulty Level</label>
                        <select
                          className="form-select"
                          value={manualForm.difficulty}
                          onChange={(e) => setManualForm({ ...manualForm, difficulty: e.target.value })}
                        >
                          <option>Easy</option>
                          <option>Medium</option>
                          <option>Hard</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Bloom's Taxonomy</label>
                        <select
                          className="form-select"
                          value={manualForm.bloomLevel}
                          onChange={(e) => setManualForm({ ...manualForm, bloomLevel: e.target.value })}
                        >
                          {BLOOM_TAXONOMY.map((b) => (
                            <option key={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Marks</label>
                        <input
                          type="number"
                          className="form-control"
                          value={manualForm.marks}
                          onChange={(e) => setManualForm({ ...manualForm, marks: parseInt(e.target.value) || 0 })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Course Outcome (CO)</label>
                      <select
                        className="form-select"
                        value={manualForm.courseOutcome}
                        onChange={(e) => setManualForm({ ...manualForm, courseOutcome: e.target.value })}
                      >
                        {COURSE_OUTCOMES.map((co) => (
                          <option key={co}>{co}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Question Text</label>
                      <textarea
                        rows={3}
                        className="form-control"
                        placeholder="Type question text..."
                        value={manualForm.questionText}
                        onChange={(e) => setManualForm({ ...manualForm, questionText: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Model Answer / Solution</label>
                      <textarea
                        rows={2}
                        className="form-control"
                        placeholder="Type reference solution..."
                        value={manualForm.answer}
                        onChange={(e) => setManualForm({ ...manualForm, answer: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Keywords (Comma separated)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. RSA, Security, Encryption"
                        value={manualForm.keywords}
                        onChange={(e) => setManualForm({ ...manualForm, keywords: e.target.value })}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '10px' }}
                      disabled={!uploadCheck.allowed}
                    >
                      <Send size={15} />
                      <span>
                        {uploadCheck.allowed
                          ? 'Submit Question for Scrutiny'
                          : 'Upload Closed (Time Limit Expired)'}
                      </span>
                    </button>
                  </fieldset>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 4. SCRUTINY MANAGEMENT */}
        {activeTab === 'scrutiny-mgt' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Scrutiny Management & Flow Supervision</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Monitor multi-round scrutiny queues and approval progress.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '16px' }}>Scrutiny Pipeline Monitor</h3>
              <div className="table-container">
                {questions.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No questions currently undergoing scrutiny.
                  </div>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Question ID</th>
                        <th>Subject</th>
                        <th>Current Round</th>
                        <th>Submitted By</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((q) => (
                        <tr key={q.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{q.id}</td>
                          <td>{q.subject}</td>
                          <td>
                            <span className={`round-pill round-${q.round || 1}`}>Round {q.round || 1}</span>
                          </td>
                          <td>{q.submittedBy}</td>
                          <td>{q.status}</td>
                          <td>
                            <button
                              className="btn btn-secondary"
                              onClick={() => setSelectedQuestion(q)}
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. AI PAPER GENERATION */}
        {activeTab === 'ai-gen' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.4rem' }}>AI Examination Paper Generation Engine</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Automated blueprint-driven question paper creation using verified questions.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '28px', maxWidth: '700px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '20px' }}>
                <Sparkles size={28} style={{ color: '#0078d4' }} />
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>Paper Generation Target</h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Constructs exam papers exclusively from 100% Scrutiny-Approved questions.
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Select Target Course / Subject</label>
                {uniqueSubjects.length > 0 ? (
                  <select
                    className="form-select"
                    value={selectedGenSubject}
                    onChange={(e) => setSelectedGenSubject(e.target.value)}
                  >
                    {uniqueSubjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter subject name (e.g. Computer Security & Cryptography)"
                    value={selectedGenSubject}
                    onChange={(e) => setSelectedGenSubject(e.target.value)}
                  />
                )}
              </div>

              <div style={{ background: 'rgba(0, 120, 212, 0.08)', border: '1px solid rgba(0, 120, 212, 0.2)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#38bdf8', marginBottom: '8px' }}>Approved Question Availability</h4>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                  Total Scrutiny-Approved Questions for "{selectedGenSubject}":{' '}
                  <strong>
                    {questions.filter((q) => q.status === 'Approved' && q.subject === selectedGenSubject).length}
                  </strong>
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleGenerateAIPaper} style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}>
                <Sparkles size={18} />
                <span>Generate Encrypted Question Paper</span>
              </button>
            </div>
          </div>
        )}

        {/* 6. GENERATED PAPERS */}
        {activeTab === 'generated-papers' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Generated Examination Papers</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Finalized examination papers stored on distributed storage.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div className="table-container">
                {generatedPapers.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No examination papers have been generated yet.
                  </div>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Paper Code</th>
                        <th>Title & Subject</th>
                        <th>Generated At</th>
                        <th>Questions Included</th>
                        <th>IPFS CID</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedPapers.map((p) => (
                        <tr key={p.paperCode}>
                          <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 600 }}>{p.paperCode}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{p.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.subject}</div>
                          </td>
                          <td>{p.generatedAt}</td>
                          <td>{p.questions ? p.questions.length : 0} Qs</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#10b981' }}>
                            {p.ipfsCID}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 600 }}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 7. BLOCKCHAIN / AUDIT LOGS */}
        {activeTab === 'blockchain' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Audit Transaction Ledger</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Immutable audit record of all paper creation, scrutiny approvals, and decryption events.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div className="table-container">
                {auditLogs.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No audit records logged yet.
                  </div>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>TX Hash</th>
                        <th>Timestamp</th>
                        <th>Action</th>
                        <th>Performed By</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((tx) => (
                        <tr key={tx.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontSize: '0.75rem' }}>
                            {tx.txHash ? `${tx.txHash.substring(0, 16)}...` : tx.id}
                          </td>
                          <td>{tx.timestamp}</td>
                          <td><strong>{tx.action}</strong></td>
                          <td>{tx.user}</td>
                          <td>
                            <span style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 8. USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>Role-Based User Management</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Manage Scrutiny Officers, Security Auditors, and System Users.
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowUserModal(true)}>
                <PlusCircle size={16} />
                <span>Add System User</span>
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div className="table-container">
                {users.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No additional system users added yet.
                  </div>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Name / Entity</th>
                        <th>Assigned Role</th>
                        <th>Security Clearance</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{u.id}</td>
                          <td>{u.name}</td>
                          <td>{u.role}</td>
                          <td>{u.clearance}</td>
                          <td><span style={{ color: '#34d399', fontWeight: 600 }}>{u.status}</span></td>
                          <td>
                            <button
                              className="btn btn-danger"
                              onClick={() => {
                                deleteUser(u.id, user?.name || 'Administrator');
                                triggerNotify(`User ${u.name} removed.`);
                              }}
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              <Trash2 size={13} />
                              <span>Remove</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Add User Modal */}
            <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title="Add System User">
              <form onSubmit={handleAddUserSubmit}>
                <div className="form-group">
                  <label className="form-label">User Full Name / Entity</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Dr. Jane Doe"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Role</label>
                  <select
                    className="form-select"
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  >
                    <option>Scrutiny Officer (Level 1)</option>
                    <option>Scrutiny Officer (Level 2)</option>
                    <option>Chief Examiner (Level 3)</option>
                    <option>Auditor</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Security Clearance</label>
                  <select
                    className="form-select"
                    value={newUserForm.clearance}
                    onChange={(e) => setNewUserForm({ ...newUserForm, clearance: e.target.value })}
                  >
                    <option>Tier 2 Scrutiny</option>
                    <option>Tier 1 Security Audit</option>
                    <option>Tier 3 Full Admin</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
                  Create User Account
                </button>
              </form>
            </Modal>
          </div>
        )}

        {/* Question Inspection Modal */}
        <Modal
          isOpen={!!selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          title={`Question Details - ${selectedQuestion?.id}`}
        >
          {selectedQuestion && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Subject:</strong>
                  <div>{selectedQuestion.subject}</div>
                </div>
                <div>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Difficulty & Marks:</strong>
                  <div>{selectedQuestion.difficulty} ({selectedQuestion.marks} Marks)</div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bloom's Taxonomy:</strong>
                <div>{selectedQuestion.bloomLevel}</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Question Content:</strong>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '6px', marginTop: '4px' }}>
                  {selectedQuestion.questionText}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Model Answer:</strong>
                <div style={{ background: 'rgba(16,185,129,0.06)', padding: '12px', borderRadius: '6px', color: '#34d399', marginTop: '4px' }}>
                  {selectedQuestion.answer}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
}
