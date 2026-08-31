import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  Lock,
  Unlock,
  Users,
  CheckSquare,
  FileCheck,
  Link2,
  ShieldCheck,
  Eye,
  Timer,
  CheckCircle2,
  KeyRound,
  FileLock2,
  BadgeCheck,
  Cpu,
  Search
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function SupervisorDashboard() {
  const {
    questions,
    generatedPapers,
    auditLogs,
    users,
    uploadWindow,
    setUploadWindow,
    isUploadAllowed,
    paperReleaseWindow,
    setPaperReleaseWindow,
    isPaperReleaseAllowed,
    adminChanges,
    verifyAdminChange,
    verifyAllAdminChanges,
    studentActions,
    verifyStudentAction,
    verifyAllStudentActions,
    addAuditLog
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

  const uploadCheck = isUploadAllowed();
  const paperReleaseCheck = isPaperReleaseAllowed();

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

  // Presets Handlers
  const handlePresetOpenUploadWindow = () => {
    const now = new Date();
    const start = new Date(now.getTime() - 2 * 60 * 1000);
    const end = new Date(now.getTime() + 120 * 60 * 1000);
    setUploadWindow({
      enabled: true,
      startTime: formatDT(start),
      endTime: formatDT(end)
    });
    addAuditLog('SUPERVISOR_PRESET_OPEN_UPLOAD_2HRS', user?.name || 'Chief Supervisor', 'Chief Supervisor', '2_HOURS', null);
    triggerNotify('Upload window opened for 2 hours.');
  };

  const handlePresetReleasePapers = () => {
    setPaperReleaseWindow((prev) => ({
      ...prev,
      enabled: true,
      mode: 'EMERGENCY_UNLOCKED',
      lockedBySupervisor: false
    }));
    addAuditLog('SUPERVISOR_PRESET_RELEASE_PAPERS', user?.name || 'Chief Supervisor', 'Chief Supervisor', 'UNLOCKED', null);
    triggerNotify('Exam paper decryption unlocked for all centers.');
  };

  const handlePresetFullLockdown = () => {
    const now = new Date();
    setUploadWindow((prev) => ({
      ...prev,
      endTime: formatDT(now)
    }));
    setPaperReleaseWindow((prev) => ({
      ...prev,
      mode: 'EMERGENCY_LOCKED',
      lockedBySupervisor: true
    }));
    addAuditLog('SUPERVISOR_PRESET_FULL_LOCKDOWN', user?.name || 'Chief Supervisor', 'Chief Supervisor', 'EMERGENCY_LOCKDOWN', null);
    triggerNotify('Emergency lockdown activated.');
  };

  const handleExtendUploadWindow = (minutes) => {
    const currentEnd = new Date(uploadWindow.endTime);
    const baseTime = currentEnd > new Date() ? currentEnd : new Date();
    const newEnd = new Date(baseTime.getTime() + minutes * 60 * 1000);
    setUploadWindow((prev) => ({
      ...prev,
      enabled: true,
      endTime: formatDT(newEnd)
    }));
    addAuditLog('SUPERVISOR_EXTENDED_UPLOAD_WINDOW', user?.name || 'Chief Supervisor', 'Chief Supervisor', `+${minutes}m`, null);
    triggerNotify(`Upload window extended by ${minutes}m.`);
  };

  const handleCloseUploadWindow = () => {
    setUploadWindow((prev) => ({
      ...prev,
      endTime: formatDT(new Date())
    }));
    addAuditLog('SUPERVISOR_LOCKED_UPLOAD_WINDOW', user?.name || 'Chief Supervisor', 'Chief Supervisor', 'IMMEDIATE_LOCK', null);
    triggerNotify('Upload window locked.');
  };

  const handleSetPaperReleaseMode = (mode) => {
    setPaperReleaseWindow((prev) => ({
      ...prev,
      mode: mode,
      lockedBySupervisor: mode === 'EMERGENCY_LOCKED'
    }));
    addAuditLog('SUPERVISOR_SET_PAPER_RELEASE_MODE', user?.name || 'Chief Supervisor', 'Chief Supervisor', mode, null);
    triggerNotify(`Paper release mode: ${mode}`);
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
  const verifiedAdminChangesCount = adminChanges.filter((a) => a.status === 'VERIFIED_BY_SUPERVISOR').length;
  const unverifiedStudentActionsCount = studentActions.filter((s) => !s.immutableVerified).length;

  const navItems = [
    { id: 'lock-controls', label: 'Time Locks & Controls', icon: Lock },
    { id: 'admin-verify', label: `Verify Admin (${pendingAdminChangesCount})`, icon: BadgeCheck },
    { id: 'student-immutable', label: `Student Ledger (${unverifiedStudentActionsCount})`, icon: ShieldCheck },
    { id: 'audit-logs', label: 'Audit Trail', icon: Link2 }
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar-nav">
        <div className="nav-section-label" style={{ color: '#f43f5e', fontWeight: 800 }}>
          CHIEF SUPERVISOR
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
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Supervisor Master Lock Controls</h2>

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

            {/* Quick Actions Presets Bar */}
            <div
              className="glass-panel"
              style={{
                padding: '14px 18px',
                marginBottom: '20px',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10
              }}
            >
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fda4af' }}>Quick Actions:</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handlePresetOpenUploadWindow}
                  style={{ fontSize: '0.78rem', padding: '5px 11px', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
                >
                  Open Upload 2 Hours
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handlePresetReleasePapers}
                  style={{ fontSize: '0.78rem', padding: '5px 11px', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
                >
                  Unlock Papers
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handlePresetFullLockdown}
                  style={{ fontSize: '0.78rem', padding: '5px 11px', background: '#dc2626' }}
                >
                  Emergency Lock
                </button>
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
                      addAuditLog('SUPERVISOR_TOGGLED_UPLOAD_POLICY', user?.name || 'Chief Supervisor', 'Chief Supervisor', e.target.checked ? 'ENABLED' : 'DISABLED', null);
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

              <div className="glass-panel stat-card">
                <div>
                  <div className="stat-title">Generated Papers</div>
                  <div className="stat-value">{generatedPapers.length}</div>
                </div>
                <FileCheck size={24} style={{ color: '#10b981', opacity: 0.8 }} />
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

        {/* 2. VERIFY ADMIN CHANGES */}
        {activeTab === 'admin-verify' && (
          <div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Admin Changes Verification</h2>

              <button
                className="btn btn-primary"
                onClick={() => {
                  verifyAllAdminChanges(user?.name || 'Chief Supervisor');
                  triggerNotify('All pending admin changes verified!');
                }}
                style={{ padding: '7px 14px', fontSize: '0.8rem' }}
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
                                      const hash = verifyAdminChange(item.id, user?.name || 'Chief Supervisor');
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

        {/* 3. IMMUTABLE STUDENT ACTIONS & VERIFICATION */}
        {activeTab === 'student-immutable' && (
          <div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Student Action Ledger</h2>

              <button
                className="btn btn-primary"
                onClick={() => {
                  verifyAllStudentActions(user?.name || 'Chief Supervisor');
                  triggerNotify('All student action blocks verified!');
                }}
                style={{ padding: '7px 14px', fontSize: '0.8rem' }}
              >
                <Cpu size={15} />
                <span>Verify Chain</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="glass-panel" style={{ padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search student action ledger..."
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
                    No matching student action blocks found.
                  </div>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Block #</th>
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
                                    verifyStudentAction(act.id, user?.name || 'Chief Supervisor');
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

        {/* 4. SECURITY AUDIT LEDGER */}
        {activeTab === 'audit-logs' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>System Audit Ledger</h2>
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
                  const hash = verifyAdminChange(selectedAdminChange.id, user?.name || 'Chief Supervisor');
                  setSelectedAdminChange((prev) => ({
                    ...prev,
                    status: 'VERIFIED_BY_SUPERVISOR',
                    verificationHash: hash
                  }));
                  triggerNotify(`Admin operation ${selectedAdminChange.id} verified!`);
                }}
                style={{ width: '100%', padding: '8px' }}
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
                  verifyStudentAction(selectedStudentAction.id, user?.name || 'Chief Supervisor');
                  setSelectedStudentAction((prev) => ({
                    ...prev,
                    immutableVerified: true
                  }));
                  triggerNotify(`Student Block #${selectedStudentAction.blockIndex} verified!`);
                }}
                style={{ width: '100%', padding: '8px' }}
              >
                <span>Verify Block Hash</span>
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
