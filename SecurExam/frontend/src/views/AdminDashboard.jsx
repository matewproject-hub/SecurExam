import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Database,
  UploadCloud,
  CheckCircle2,
  Eye,
  Lock,
  Timer,
  Send,
  PlusCircle
} from 'lucide-react';
import { BLOOM_TAXONOMY, COURSE_OUTCOMES } from '../data/mockData';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function AdminDashboard() {
  const {
    questions,
    uploadWindow,
    isUploadAllowed,
    addQuestion
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

  // Filter questions submitted exclusively by this admin
  const currentAdminName = user?.name || 'Staff Member';
  const myQuestions = questions.filter(
    (q) => q.submittedBy === currentAdminName || q.submittedBy === user?.name
  );

  // Unique subjects derived dynamically from this admin's uploaded questions
  const uniqueSubjects = Array.from(new Set(myQuestions.map((q) => q.subject))).filter(Boolean);

  // Derived stats for Admin
  const stats = {
    totalSubjects: uniqueSubjects.length,
    uploadedQuestions: myQuestions.length
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
              }, currentAdminName);
              addedCount++;
            }
          });
        } else {
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
            }, currentAdminName);
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
      }, currentAdminName);

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

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'repository', label: 'Questions', icon: Database },
    { id: 'upload', label: 'Upload', icon: UploadCloud }
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar-nav">
        <div className="nav-section-label">STAFF</div>
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
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Overview</h2>
            </div>

            {/* Analytics Cards */}
            <div className="stats-grid">
              <div className="glass-panel stat-card">
                <div>
                  <div className="stat-title">Subjects</div>
                  <div className="stat-value">{stats.totalSubjects}</div>
                </div>
                <Database size={24} style={{ color: '#0078d4', opacity: 0.8 }} />
              </div>

              <div className="glass-panel stat-card">
                <div>
                  <div className="stat-title">Questions</div>
                  <div className="stat-value">{stats.uploadedQuestions}</div>
                </div>
                <UploadCloud size={24} style={{ color: '#10b981', opacity: 0.8 }} />
              </div>
            </div>

            {/* Recent Questions Table */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Recent Questions</h3>
                <button className="btn btn-secondary" onClick={() => setActiveTab('repository')} style={{ fontSize: '0.78rem' }}>
                  View All
                </button>
              </div>
              <div className="table-container">
                {myQuestions.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No questions uploaded by you yet. Click "Upload / Add Questions" to start.
                  </div>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Question ID</th>
                        <th>Subject</th>
                        <th>Bloom Taxonomy</th>
                        <th>Marks</th>
                        <th>Submitted By</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myQuestions.slice(0, 5).map((q) => (
                        <tr key={q.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#38bdf8' }}>{q.id}</td>
                          <td>{q.subject}</td>
                          <td>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4 }}>
                              {q.bloomLevel}
                            </span>
                          </td>
                          <td>{q.marks} M</td>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Questions</h2>
              <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>
                <PlusCircle size={15} />
                <span>Add Question</span>
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div className="table-container">
                {myQuestions.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    You have not uploaded any questions to the repository yet.
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
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myQuestions.map((q) => (
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
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Upload Questions</h2>

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
                    {uploadCheck.reason} Please contact the Admin Authority to unlock the Question Upload Window.
                  </p>
                </div>
              </div>
            )}

            {/* Upload Workspace */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', opacity: uploadCheck.allowed ? 1 : 0.55 }}>
              {/* Batch Drag-and-Drop Uploader */}
              <div className="glass-panel" style={{ padding: '20px', position: 'relative' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '14px' }}>Bulk Import</h3>

                <div className="dropzone" onDragOver={handleDragOver} onDrop={handleDrop} style={{ cursor: uploadCheck.allowed ? 'pointer' : 'not-allowed' }}>
                  <UploadCloud size={40} style={{ color: uploadCheck.allowed ? '#0078d4' : '#64748b', marginBottom: '8px' }} />
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>
                    {uploadCheck.allowed ? 'Drop Question Files Here' : 'Upload Locked'}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    {uploadCheck.allowed ? '.json or .txt format' : 'Submission window closed'}
                  </span>
                </div>
              </div>

              {/* Manual Question Form */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '14px' }}>Manual Entry</h3>

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
