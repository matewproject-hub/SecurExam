import React, { useState, useEffect } from 'react';
import {
  Lock,
  Users,
  CheckSquare,
  Link2,
  ShieldCheck,
  Eye,
  Timer,
  CheckCircle2,
  KeyRound,
  FileLock2,
  BadgeCheck,
  Cpu,
  Search,
  Sparkles,
  PlusCircle,
  Trash2
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function SupervisorDashboard() {
  const {
    questions,
    auditLogs,
    users,
    uploadWindow,
    setUploadWindow,
    paperReleaseWindow,
    setPaperReleaseWindow,
    adminChanges,
    verifyAdminChange,
    verifyAllAdminChanges,
    studentActions,
    verifyStudentAction,
    verifyAllStudentActions,
    addAuditLog,
    generatePaper,
    addUser,
    deleteUser
  } = useData();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('lock-controls');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedAdminChange, setSelectedAdminChange] = useState(null);
  const [selectedStudentAction, setSelectedStudentAction] = useState(null);

  const [adminSearch, setAdminSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [notification, setNotification] = useState('');

  // AI Paper Gen State
  const uniqueSubjects = Array.from(new Set(questions.map((q) => q.subject))).filter(Boolean);
  const [selectedGenSubject, setSelectedGenSubject] = useState(uniqueSubjects[0] || '');

  // User Management State
  const [newUserForm, setNewUserForm] = useState({ name: '', role: 'Scrutiny Officer (Level 1)', clearance: 'Tier 2 Scrutiny' });
  const [showUserModal, setShowUserModal] = useState(false);

  // Live Clock Tick
  const [nowTime, setNowTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const formatDT = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Upload Countdown calculation
  const getUploadCountdown = () => {
    if (!uploadWindow.enabled) return { status: 'DISABLED', text: 'Upload Window Off' };
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
      return { status: 'EXPIRED', text: 'Upload Deadline Expired' };
    }

    const diff = Math.floor((end - now) / 1000);
    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    return {
      status: 'ACTIVE',
      text: `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    };
  };

  // Paper Release Countdown calculation
  const getPaperReleaseCountdown = () => {
    if (paperReleaseWindow.mode === 'EMERGENCY_LOCKED' || paperReleaseWindow.lockedBySupervisor) {
      return { status: 'EMERGENCY_LOCKED', text: 'Papers Locked' };
    }
    if (paperReleaseWindow.mode === 'EMERGENCY_UNLOCKED') {
      return { status: 'EMERGENCY_UNLOCKED', text: 'Papers Released' };
    }
    if (!paperReleaseWindow.enabled) return { status: 'DISABLED', text: 'Paper Release Off' };

    const end = new Date(paperReleaseWindow.endTime).getTime();
    const start = new Date(paperReleaseWindow.startTime).getTime();
    const now = nowTime.getTime();

    if (now < start) {
      const diff = Math.floor((start - now) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      return { status: 'NOT_RELEASED_YET', text: `Unlocks in ${mins}m ${secs}s` };
    }

    if (now > end) {
      return { status: 'EXPIRED', text: 'Release Expired' };
    }

    const diff = Math.floor((end - now) / 1000);
    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    return {
      status: 'ACTIVE',
      text: `Active: ${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    };
  };

  const uploadCountdown = getUploadCountdown();
  const paperReleaseCountdown = getPaperReleaseCountdown();



  const handleExtendUploadWindow = (minutes) => {
    const currentEnd = new Date(uploadWindow.endTime);
    const baseTime = currentEnd > new Date() ? currentEnd : new Date();
    const newEnd = new Date(baseTime.getTime() + minutes * 60 * 1000);
    setUploadWindow((prev) => ({
      ...prev,
      enabled: true,
      endTime: formatDT(newEnd)
    }));
    addAuditLog('SUPERVISOR_EXTENDED_UPLOAD_WINDOW', user?.name || 'Admin Authority', 'Admin Authority', `+${minutes}m`, null);
    triggerNotify(`Upload window extended by ${minutes}m.`);
  };

  const handleCloseUploadWindow = () => {
    setUploadWindow((prev) => ({
      ...prev,
      endTime: formatDT(new Date())
    }));
    addAuditLog('SUPERVISOR_LOCKED_UPLOAD_WINDOW', user?.name || 'Admin Authority', 'Admin Authority', 'IMMEDIATE_LOCK', null);
    triggerNotify('Upload window locked.');
  };

  const handleSetPaperReleaseMode = (mode) => {
    setPaperReleaseWindow((prev) => ({
      ...prev,
      mode: mode,
      lockedBySupervisor: mode === 'EMERGENCY_LOCKED'
    }));
    addAuditLog('SUPERVISOR_SET_PAPER_RELEASE_MODE', user?.name || 'Admin Authority', 'Admin Authority', mode, null);
    triggerNotify(`Paper release mode: ${mode}`);
  };

  // Paper Generation Handler
  const handleGenerateAIPaper = () => {
    const targetSub = selectedGenSubject || uniqueSubjects[0] || 'Computer Security & Cryptography';
    const availableForSubject = questions.filter(
      (q) => q.subject === targetSub || !targetSub
    );

    if (availableForSubject.length === 0) {
      triggerNotify(`No questions available for "${targetSub}". Please add questions first.`);
      return;
    }

    const createdPaper = generatePaper({
      title: `${targetSub} Examination Paper`,
      subject: targetSub,
      userName: user?.name || 'Admin Authority'
    });

    triggerNotify(`Paper ${createdPaper.paperCode} generated with ${createdPaper.questions.length} question(s).`);
  };

  // Add User Submit Handler
  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUserForm.name.trim()) return;
    const added = addUser(newUserForm, user?.name || 'Admin Authority');
    triggerNotify(`New User ${added.name} (${added.id}) created successfully!`);
    setNewUserForm({ name: '', role: 'Scrutiny Officer (Level 1)', clearance: 'Tier 2 Scrutiny' });
    setShowUserModal(false);
  };

  // Filtered Lists
  const filteredAdminChanges = adminChanges.filter((item) => {
    if (!adminSearch.trim()) return true;
    const q = adminSearch.toLowerCase();
    return (
      item.id.toLowerCase().includes(q) ||
      item.adminName.toLowerCase().includes(q) ||
      item.changeType.toLowerCase().includes(q) ||
      item.details.toLowerCase().includes(q)
    );
  });

  const filteredStudentActions = studentActions.filter((item) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      item.id.toLowerCase().includes(q) ||
      item.rollNumber.toLowerCase().includes(q) ||
      item.studentName.toLowerCase().includes(q) ||
      item.actionType.toLowerCase().includes(q) ||
      item.details.toLowerCase().includes(q)
    );
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    return (
      log.id.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.user.toLowerCase().includes(q) ||
      log.role.toLowerCase().includes(q) ||
      (log.txHash && log.txHash.toLowerCase().includes(q))
    );
  });

  const pendingAdminChangesCount = adminChanges.filter((a) => a.status === 'PENDING_VERIFICATION').length;
  const unverifiedStudentActionsCount = studentActions.filter((s) => !s.immutableVerified).length;

  const navItems = [
    { id: 'lock-controls', label: 'Schedule & Controls', icon: Lock },
    { id: 'scrutiny-mgt', label: 'Scrutiny Management', icon: CheckSquare },
    { id: 'ai-gen', label: 'Paper Generation', icon: Sparkles },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'admin-verify', label: `Admin Changes (${pendingAdminChangesCount})`, icon: BadgeCheck },
    { id: 'student-immutable', label: `Student Submissions (${unverifiedStudentActionsCount})`, icon: ShieldCheck },
    { id: 'audit-logs', label: 'Audit Logs', icon: Link2 }
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar-nav">
        <div className="nav-section-label" style={{ color: '#f43f5e', fontWeight: 800 }}>
          AUTHORITY
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{
                borderColor: isActive ? '#f43f5e' : 'transparent',
                background: isActive ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
                color: isActive ? '#f43f5e' : 'inherit'
              }}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </aside>

      {/* Main Content Area */}
      <main className="content-viewport">
        {/* Toast Notification */}
        {notification && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#fda4af',
              padding: '10px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <CheckCircle2 size={16} />
            <span>{notification}</span>
          </div>
        )}

        {/* 1. MASTER LOCK & TIME LIMIT CONTROLS */}
        {activeTab === 'lock-controls' && (
          <div>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Schedule Controls</h2>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div
                  style={{
                    background: uploadCountdown.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: uploadCountdown.status === 'ACTIVE' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                    color: uploadCountdown.status === 'ACTIVE' ? '#34d399' : '#f87171',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Timer size={14} />
                  <span>Upload: {uploadCountdown.text}</span>
                </div>

                <div
                  style={{
                    background: paperReleaseCountdown.status === 'ACTIVE' || paperReleaseCountdown.status === 'EMERGENCY_UNLOCKED' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: paperReleaseCountdown.status === 'ACTIVE' || paperReleaseCountdown.status === 'EMERGENCY_UNLOCKED' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                    color: paperReleaseCountdown.status === 'ACTIVE' || paperReleaseCountdown.status === 'EMERGENCY_UNLOCKED' ? '#38bdf8' : '#f87171',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <KeyRound size={14} />
                  <span>Paper Release: {paperReleaseCountdown.text}</span>
                </div>
              </div>
            </div>



            {/* PANEL 1: Question Upload Lock */}
            <div
              className="glass-panel"
              style={{
                padding: '20px',
                marginBottom: '20px',
                border: '1px solid rgba(244, 63, 94, 0.4)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Lock size={18} style={{ color: '#f43f5e' }} />
                  <h3 style={{ fontSize: '1rem', margin: 0, color: 'white' }}>Question Upload Window</h3>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem' }}>
                  <input
                    type="checkbox"
                    checked={uploadWindow.enabled}
                    onChange={(e) => {
                      setUploadWindow((prev) => ({ ...prev, enabled: e.target.checked }));
                      addAuditLog('SUPERVISOR_TOGGLED_UPLOAD_POLICY', user?.name || 'Admin Authority', 'Admin Authority', e.target.checked ? 'ENABLED' : 'DISABLED', null);
                      triggerNotify(e.target.checked ? 'Upload policy enabled.' : 'Upload policy disabled.');
                    }}
                  />
                  <span style={{ color: '#fda4af', fontWeight: 600 }}>Enforce Policy</span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: '16px', alignItems: 'end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem' }}>Start Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={uploadWindow.startTime}
                    onChange={(e) => setUploadWindow((prev) => ({ ...prev, startTime: e.target.value }))}
                    style={{ fontSize: '0.82rem' }}
                    disabled={!uploadWindow.enabled}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem' }}>End Time (Deadline)</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={uploadWindow.endTime}
                    onChange={(e) => setUploadWindow((prev) => ({ ...prev, endTime: e.target.value }))}
                    style={{ fontSize: '0.82rem' }}
                    disabled={!uploadWindow.enabled}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={() => handleExtendUploadWindow(15)} style={{ padding: '6px 10px', fontSize: '0.74rem' }}>+15m</button>
                    <button className="btn btn-secondary" onClick={() => handleExtendUploadWindow(30)} style={{ padding: '6px 10px', fontSize: '0.74rem' }}>+30m</button>
                    <button className="btn btn-secondary" onClick={() => handleExtendUploadWindow(60)} style={{ padding: '6px 10px', fontSize: '0.74rem' }}>+1h</button>
                    <button className="btn btn-danger" onClick={handleCloseUploadWindow} style={{ padding: '6px 10px', fontSize: '0.74rem', background: '#e11d48' }}>
                      Lock Now
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL 2: Question Paper Release Lock */}
            <div
              className="glass-panel"
              style={{
                padding: '20px',
                marginBottom: '20px',
                border: '1px solid rgba(56, 189, 248, 0.4)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileLock2 size={18} style={{ color: '#38bdf8' }} />
                  <h3 style={{ fontSize: '1rem', margin: 0, color: 'white' }}>Question Paper Release Lock</h3>
                </div>

                <span
                  style={{
                    background: paperReleaseWindow.mode === 'EMERGENCY_LOCKED' ? 'rgba(239,68,68,0.2)' : 'rgba(56,189,248,0.2)',
                    color: paperReleaseWindow.mode === 'EMERGENCY_LOCKED' ? '#f87171' : '#38bdf8',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.76rem',
                    fontWeight: 700
                  }}
                >
                  {paperReleaseWindow.mode}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: '16px', alignItems: 'end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem' }}>Release Start</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={paperReleaseWindow.startTime}
                    onChange={(e) => setPaperReleaseWindow((prev) => ({ ...prev, startTime: e.target.value }))}
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem' }}>Release End</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={paperReleaseWindow.endTime}
                    onChange={(e) => setPaperReleaseWindow((prev) => ({ ...prev, endTime: e.target.value }))}
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleSetPaperReleaseMode('SCHEDULED')}
                      style={{ padding: '6px 10px', fontSize: '0.74rem' }}
                    >
                      Scheduled
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleSetPaperReleaseMode('EMERGENCY_UNLOCKED')}
                      style={{ padding: '6px 10px', fontSize: '0.74rem', color: '#34d399' }}
                    >
                      Unlock All
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleSetPaperReleaseMode('EMERGENCY_LOCKED')}
                      style={{ padding: '6px 10px', fontSize: '0.74rem', background: '#dc2626' }}
                    >
                      Lock All
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Overview Summary Grid */}
            <div className="stats-grid">
              <div className="glass-panel stat-card" onClick={() => setActiveTab('admin-verify')} style={{ cursor: 'pointer' }}>
                <div>
                  <div className="stat-title">Pending Admin Changes</div>
                  <div className="stat-value">{pendingAdminChangesCount}</div>
                </div>
                <BadgeCheck size={24} style={{ color: '#f43f5e', opacity: 0.8 }} />
              </div>

              <div className="glass-panel stat-card" onClick={() => setActiveTab('student-immutable')} style={{ cursor: 'pointer' }}>
                <div>
                  <div className="stat-title">Student Action Blocks</div>
                  <div className="stat-value">{studentActions.length}</div>
                </div>
                <Cpu size={24} style={{ color: '#38bdf8', opacity: 0.8 }} />
              </div>

              <div className="glass-panel stat-card" onClick={() => setActiveTab('audit-logs')} style={{ cursor: 'pointer' }}>
                <div>
                  <div className="stat-title">Audit Log Trail</div>
                  <div className="stat-value">{auditLogs.length}</div>
                </div>
                <Link2 size={24} style={{ color: '#a855f7', opacity: 0.8 }} />
              </div>
            </div>
          </div>
        )}

        {/* 2. SCRUTINY MANAGEMENT */}
        {activeTab === 'scrutiny-mgt' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Scrutiny Management</h2>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '14px' }}>Review Queue</h3>
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

        {/* 3. PAPER GENERATION */}
        {activeTab === 'ai-gen' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Paper Generation</h2>
            </div>

            <div className="glass-panel" style={{ padding: '24px', maxWidth: '640px' }}>
              <div className="form-group">
                <label className="form-label">Subject</label>
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
                    placeholder="Subject name"
                    value={selectedGenSubject}
                    onChange={(e) => setSelectedGenSubject(e.target.value)}
                  />
                )}
              </div>

              <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '14px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>
                  Questions Available:{' '}
                  <strong>
                    {questions.filter((q) => q.subject === selectedGenSubject || !selectedGenSubject).length}
                  </strong>
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleGenerateAIPaper} style={{ width: '100%', padding: '12px', fontSize: '0.95rem', background: '#f43f5e', borderColor: '#f43f5e' }}>
                <Sparkles size={16} />
                <span>Generate Question Paper</span>
              </button>
            </div>
          </div>
        )}



        {/* 5. USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>Role-Based User Management</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Manage Scrutiny Officers, Security Auditors, and System Users.
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowUserModal(true)} style={{ background: '#f43f5e', borderColor: '#f43f5e' }}>
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
                                deleteUser(u.id, user?.name || 'Admin Authority');
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

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', background: '#f43f5e', borderColor: '#f43f5e' }}>
                  Create User Account
                </button>
              </form>
            </Modal>
          </div>
        )}

        {/* 6. VERIFY ADMIN CHANGES */}
        {activeTab === 'admin-verify' && (
          <div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Admin Changes Verification</h2>

              <button
                className="btn btn-primary"
                onClick={() => {
                  verifyAllAdminChanges(user?.name || 'Admin Authority');
                  triggerNotify('All pending admin changes verified!');
                }}
                style={{ padding: '7px 14px', fontSize: '0.8rem', background: '#f43f5e', borderColor: '#f43f5e' }}
              >
                <BadgeCheck size={15} />
                <span>Verify All Pending</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="glass-panel" style={{ padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search admin changes..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', padding: 0, fontSize: '0.84rem' }}
              />
              {adminSearch && (
                <button onClick={() => setAdminSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.76rem' }}>
                  Clear
                </button>
              )}
            </div>

            {/* Table */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div className="table-container">
                {filteredAdminChanges.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No matching changes found.
                  </div>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Change ID</th>
                        <th>Admin User</th>
                        <th>Category</th>
                        <th>Details</th>
                        <th>Timestamp</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdminChanges.map((item) => {
                        const isVerified = item.status === 'VERIFIED_BY_SUPERVISOR';
                        return (
                          <tr key={item.id}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>{item.id}</td>
                            <td>{item.adminName}</td>
                            <td>
                              <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>
                                {item.changeType}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.82rem', maxWidth: '280px' }}>{item.details}</td>
                            <td style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}>{item.timestamp}</td>
                            <td>
                              {isVerified ? (
                                <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '3px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700 }}>
                                  VERIFIED
                                </span>
                              ) : (
                                <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '3px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700 }}>
                                  PENDING
                                </span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => setSelectedAdminChange(item)}
                                  style={{ padding: '3px 7px', fontSize: '0.72rem' }}
                                >
                                  <Eye size={12} />
                                </button>
                                {!isVerified && (
                                  <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                      verifyAdminChange(item.id, user?.name || 'Admin Authority');
                                      triggerNotify(`Admin change ${item.id} verified!`);
                                    }}
                                    style={{ padding: '3px 8px', fontSize: '0.72rem', color: '#fda4af', borderColor: 'rgba(244,63,94,0.4)' }}
                                  >
                                    Sign
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 7. STUDENT SUBMISSIONS */}
        {activeTab === 'student-immutable' && (
          <div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Student Submissions</h2>

              <button
                className="btn btn-primary"
                onClick={() => {
                  verifyAllStudentActions(user?.name || 'Admin Authority');
                  triggerNotify('All student actions verified.');
                }}
                style={{ padding: '7px 14px', fontSize: '0.8rem', background: '#f43f5e', borderColor: '#f43f5e' }}
              >
                <CheckCircle2 size={15} />
                <span>Verify All</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="glass-panel" style={{ padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search student submissions..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', padding: 0, fontSize: '0.84rem' }}
              />
              {studentSearch && (
                <button onClick={() => setStudentSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.76rem' }}>
                  Clear
                </button>
              )}
            </div>

            {/* Table */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div className="table-container">
                {filteredStudentActions.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No matching student records found.
                  </div>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Record #</th>
                        <th>Roll Number</th>
                        <th>Event</th>
                        <th>Details</th>
                        <th>Timestamp</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudentActions.map((act) => (
                        <tr key={act.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#a855f7' }}>#{act.blockIndex}</td>
                          <td style={{ fontWeight: 600 }}>
                            <div>{act.rollNumber}</div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px' }}>
                              {act.actionType}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem', maxWidth: '260px' }}>{act.details}</td>
                          <td style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}>{act.timestamp}</td>
                          <td>
                            {act.immutableVerified ? (
                              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '3px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700 }}>
                                VERIFIED
                              </span>
                            ) : (
                              <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '3px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700 }}>
                                UNVERIFIED
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                className="btn btn-secondary"
                                onClick={() => setSelectedStudentAction(act)}
                                style={{ padding: '3px 7px', fontSize: '0.72rem' }}
                              >
                                <Eye size={12} />
                              </button>
                              {!act.immutableVerified && (
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => {
                                    verifyStudentAction(act.id, user?.name || 'Admin Authority');
                                    triggerNotify(`Student Block #${act.blockIndex} verified!`);
                                  }}
                                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                >
                                  Verify
                                </button>
                              )}
                            </div>
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

        {/* 8. AUDIT LOGS */}
        {activeTab === 'audit-logs' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Audit Logs</h2>
            </div>

            {/* Search Bar */}
            <div className="glass-panel" style={{ padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search audit trail..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', padding: 0, fontSize: '0.84rem' }}
              />
              {auditSearch && (
                <button onClick={() => setAuditSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.76rem' }}>
                  Clear
                </button>
              )}
            </div>

            <div className="glass-panel" style={{ padding: '16px' }}>
              <div className="table-container">
                {filteredAuditLogs.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No audit records match your search.
                  </div>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Tx ID</th>
                        <th>Timestamp</th>
                        <th>Action</th>
                        <th>User</th>
                        <th>Role</th>
                        <th>Transaction Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuditLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#38bdf8' }}>{log.id}</td>
                          <td style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}>{log.timestamp}</td>
                          <td>
                            <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>
                              {log.action}
                            </span>
                          </td>
                          <td>{log.user}</td>
                          <td>{log.role}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {log.txHash}
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
      </main>

      {/* Admin Change Detail Inspection Modal */}
      <Modal
        isOpen={!!selectedAdminChange}
        onClose={() => setSelectedAdminChange(null)}
        title="Admin Change Details"
      >
        {selectedAdminChange && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 700 }}>
                {selectedAdminChange.id}
              </span>
              <span
                style={{
                  background: selectedAdminChange.status === 'VERIFIED_BY_SUPERVISOR' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: selectedAdminChange.status === 'VERIFIED_BY_SUPERVISOR' ? '#34d399' : '#f87171',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.76rem',
                  fontWeight: 700
                }}
              >
                {selectedAdminChange.status}
              </span>
            </div>

            <div style={{ marginBottom: '8px', fontSize: '0.84rem' }}>
              <strong>Admin:</strong> {selectedAdminChange.adminName}
            </div>
            <div style={{ marginBottom: '12px', fontSize: '0.84rem' }}>
              <strong>Type:</strong> {selectedAdminChange.changeType}
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', fontSize: '0.84rem', marginBottom: '14px' }}>
              {selectedAdminChange.details}
            </div>

            {selectedAdminChange.verificationHash && (
              <div style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#34d399', marginBottom: '14px' }}>
                Stamp Hash: {selectedAdminChange.verificationHash}
              </div>
            )}

            {selectedAdminChange.status !== 'VERIFIED_BY_SUPERVISOR' && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  const hash = verifyAdminChange(selectedAdminChange.id, user?.name || 'Admin Authority');
                  setSelectedAdminChange((prev) => ({
                    ...prev,
                    status: 'VERIFIED_BY_SUPERVISOR',
                    verificationHash: hash
                  }));
                  triggerNotify(`Admin operation ${selectedAdminChange.id} verified!`);
                }}
                style={{ width: '100%', padding: '8px', background: '#f43f5e', borderColor: '#f43f5e' }}
              >
                <span>Verify Change</span>
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Student Action Detail Inspection Modal */}
      <Modal
        isOpen={!!selectedStudentAction}
        onClose={() => setSelectedStudentAction(null)}
        title="Student Block Details"
      >
        {selectedStudentAction && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#a855f7', fontWeight: 700 }}>
                Block #{selectedStudentAction.blockIndex}
              </span>
              <span
                style={{
                  background: selectedStudentAction.immutableVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: selectedStudentAction.immutableVerified ? '#34d399' : '#fbbf24',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.76rem',
                  fontWeight: 700
                }}
              >
                {selectedStudentAction.immutableVerified ? 'VERIFIED' : 'UNVERIFIED'}
              </span>
            </div>

            <div style={{ marginBottom: '8px', fontSize: '0.84rem' }}>
              <strong>Student:</strong> {selectedStudentAction.studentName} ({selectedStudentAction.rollNumber})
            </div>
            <div style={{ marginBottom: '12px', fontSize: '0.84rem' }}>
              <strong>Event:</strong> {selectedStudentAction.actionType}
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', fontSize: '0.84rem', marginBottom: '12px' }}>
              {selectedStudentAction.details}
            </div>

            <div style={{ background: 'rgba(15,23,42,0.7)', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
              <div style={{ color: 'var(--text-muted)' }}>PrevHash: {selectedStudentAction.prevHash}</div>
              <div style={{ color: '#34d399', marginTop: '4px' }}>ActionHash: {selectedStudentAction.actionHash}</div>
            </div>

            {!selectedStudentAction.immutableVerified && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  verifyStudentAction(selectedStudentAction.id, user?.name || 'Admin Authority');
                  setSelectedStudentAction((prev) => ({
                    ...prev,
                    immutableVerified: true
                  }));
                  triggerNotify(`Student Block #${selectedStudentAction.blockIndex} verified!`);
                }}
                style={{ width: '100%', padding: '8px', background: '#f43f5e', borderColor: '#f43f5e' }}
              >
                <span>Verify Block Hash</span>
              </button>
            )}
          </div>
        )}
      </Modal>

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
    </div>
  );
}
