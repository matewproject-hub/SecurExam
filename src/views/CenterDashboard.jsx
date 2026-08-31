import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, Play, Lock, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';

export default function CenterDashboard() {
  const { user } = useAuth();
  const { generatedPapers, questions } = useData();
  const [currentTime, setCurrentTime] = useState(new Date());

  const [simulatedState, setSimulatedState] = useState('COUNTDOWN');
  const [countdownSeconds, setCountdownSeconds] = useState(45);
  const [isExamOpen, setIsExamOpen] = useState(false);

  // Active Paper selection
  const [selectedPaperCode, setSelectedPaperCode] = useState(generatedPapers[0]?.paperCode || '');

  useEffect(() => {
    if (!selectedPaperCode && generatedPapers.length > 0) {
      setSelectedPaperCode(generatedPapers[0].paperCode);
    }
  }, [generatedPapers, selectedPaperCode]);

  const activePaper = generatedPapers.find((p) => p.paperCode === selectedPaperCode) || generatedPapers[0];

  // Derive active paper questions (from paper.questions or approved questions matching subject)
  const displayQuestions = activePaper?.questions && activePaper.questions.length > 0
    ? activePaper.questions
    : questions.filter((q) => q.status === 'Approved' && (!activePaper || q.subject === activePaper.subject));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer;
    if (simulatedState === 'COUNTDOWN') {
      timer = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            setSimulatedState('LIVE');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [simulatedState]);

  const examInfo = {
    name: activePaper ? activePaper.title : 'No Active Examination Paper',
    subject: activePaper ? activePaper.subject : 'Unassigned',
    paperCode: activePaper ? activePaper.paperCode : 'N/A',
    date: currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    reportingTime: activePaper ? '30 Mins Before Start' : 'N/A',
    startTime: activePaper ? activePaper.scheduledStartTime : 'N/A',
    endTime: activePaper ? activePaper.scheduledEndTime : 'N/A',
    duration: activePaper ? activePaper.duration : 'N/A',
    centerId: user?.centerId || 'CENTER-MAIN',
    centerName: user?.name || 'Authorized Examination Center'
  };

  const formatCountdown = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', width: '100%', padding: '8px 0' }}>
      {/* Paper Selector if multiple papers generated */}
      {generatedPapers.length > 1 && (
        <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Select Released Examination Paper:
          </label>
          <select
            className="form-select"
            value={selectedPaperCode}
            onChange={(e) => setSelectedPaperCode(e.target.value)}
            style={{ width: 'auto', minWidth: '240px', fontSize: '0.82rem' }}
          >
            {generatedPapers.map((p) => (
              <option key={p.paperCode} value={p.paperCode}>
                {p.paperCode} - {p.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Clock Simulator Toolbar */}
      <div className="sim-toolbar">
        <div className="sim-toolbar-title">
          <Clock size={15} style={{ color: 'var(--primary)' }} />
          <span>Interactive Clock Simulator:</span>
        </div>

        <div className="segmented-control">
          <button
            onClick={() => {
              setSimulatedState('COUNTDOWN');
              setCountdownSeconds(30);
              setIsExamOpen(false);
            }}
            className={`segmented-btn ${simulatedState === 'COUNTDOWN' ? 'active-countdown' : ''}`}
          >
            <Lock size={12} />
            <span>Before Start</span>
          </button>

          <button
            onClick={() => {
              setSimulatedState('LIVE');
              setIsExamOpen(false);
            }}
            className={`segmented-btn ${simulatedState === 'LIVE' ? 'active-live' : ''}`}
          >
            <CheckCircle2 size={12} />
            <span>Start Time Reached</span>
          </button>

          <button
            onClick={() => {
              setSimulatedState('CONCLUDED');
              setIsExamOpen(false);
            }}
            className={`segmented-btn ${simulatedState === 'CONCLUDED' ? 'active-concluded' : ''}`}
          >
            <AlertCircle size={12} />
            <span>Concluded</span>
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Center Code: {examInfo.centerId} • {examInfo.centerName}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              {examInfo.name}
            </h2>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Subject: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{examInfo.subject}</span>
              {examInfo.paperCode !== 'N/A' && (
                <span style={{ marginLeft: 12, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                  [{examInfo.paperCode}]
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 16px',
              textAlign: 'right'
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              System Time (IST)
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>
              {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>

        <div className="exam-meta-grid">
          <div className="meta-item-box">
            <span className="meta-item-label">Reporting Time</span>
            <span className="meta-item-value">{examInfo.reportingTime}</span>
          </div>

          <div className="meta-item-box">
            <span className="meta-item-label">Scheduled Start</span>
            <span className="meta-item-value" style={{ color: 'var(--success)' }}>{examInfo.startTime}</span>
          </div>

          <div className="meta-item-box">
            <span className="meta-item-label">Scheduled End</span>
            <span className="meta-item-value" style={{ color: 'var(--text-muted)' }}>{examInfo.endTime}</span>
          </div>
        </div>
      </div>

      <div className={`status-action-card status-${simulatedState.toLowerCase()}`}>
        {simulatedState === 'COUNTDOWN' && (
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 12px', borderRadius: '12px', marginBottom: '8px' }}>
              <Lock size={13} />
              <span>PAPER LOCKED • COUNTDOWN IN PROGRESS</span>
            </div>

            <div className="timer-large highlight-amber">
              {formatCountdown(countdownSeconds)}
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              The examination paper is locked. Decryption key will be dispatched automatically when the countdown reaches 00:00:00.
            </p>

            <button
              className="btn btn-secondary"
              disabled
              style={{ width: '100%', maxWidth: '420px', padding: '12px', opacity: 0.65, cursor: 'not-allowed' }}
            >
              <Lock size={16} />
              <span>Locked (Unlocks Automatically at Start Time)</span>
            </button>
          </div>
        )}

        {simulatedState === 'LIVE' && (
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '12px', marginBottom: '12px' }}>
              <ShieldCheck size={14} />
              <span>EXAMINATION READY & UNLOCKED</span>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
              Scheduled Start Time Reached
            </h3>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.5 }}>
              Verification complete. You may now launch the online examination paper viewer.
            </p>

            <button
              className="btn btn-success"
              onClick={() => setIsExamOpen(true)}
              style={{ width: '100%', maxWidth: '420px', padding: '14px 24px', fontSize: '0.95rem', fontWeight: 600, gap: 8, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
            >
              <Play size={18} />
              <span>Open Online Examination Paper</span>
            </button>
          </div>
        )}

        {simulatedState === 'CONCLUDED' && (
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 12px', borderRadius: '12px', marginBottom: '12px' }}>
              <AlertCircle size={14} />
              <span>SESSION CONCLUDED</span>
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              Examination Period Ended
            </h3>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 20px' }}>
              The scheduled time window for this examination has closed. Decryption access is disabled.
            </p>

            <button
              className="btn btn-secondary"
              disabled
              style={{ width: '100%', maxWidth: '420px', padding: '12px', opacity: 0.5 }}
            >
              <Lock size={16} />
              <span>Examination Session Closed</span>
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isExamOpen}
        onClose={() => setIsExamOpen(false)}
        title="Secure Examination Viewer"
      >
        <div>
          <div
            style={{
              background: 'rgba(2, 132, 199, 0.08)',
              border: '1px solid rgba(2, 132, 199, 0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 600 }}>
              <ShieldAlert size={15} />
              <span>WATERMARKED SANDBOXED SESSION</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              CENTER: {examInfo.centerId}
            </span>
          </div>

          <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '14px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
              {examInfo.name}
            </h2>
            <div style={{ fontSize: '0.84rem', color: 'var(--primary)', fontWeight: 600 }}>
              {examInfo.subject} • Duration: {examInfo.duration}
            </div>
          </div>

          <div>
            {!displayQuestions || displayQuestions.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No examination questions are currently loaded for this paper code. Please generate an AI paper or approve questions in the admin console.
              </div>
            ) : (
              displayQuestions.map((q, idx) => (
                <div key={q.id || idx} className="question-item">
                  <div className="question-header">
                    <span className="question-title">Q{idx + 1}. {q.courseOutcome || `Question ${idx + 1}`}</span>
                    <span className="marks-pill">{q.marks} Marks</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.6 }}>
                    {q.questionText}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
