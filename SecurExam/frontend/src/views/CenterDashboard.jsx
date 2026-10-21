import React, { useState, useEffect } from 'react';
import {
  Lock,
  Play,
  CheckCircle2,
  UserCheck,
  Send,
  ArrowRight,
  LogOut,
  FileText,
  User,
  KeyRound,
  Building2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function CenterDashboard() {
  const { user, logout } = useAuth();
  const { generatedPapers, questions, addAuditLog } = useData();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Page Step State: 'LOGIN' | 'TIME_LOCK' | 'QUESTION_PAPER' | 'SUBMITTED'
  const [candidateStep, setCandidateStep] = useState('LOGIN');

  // Exam Paper selection
  const [selectedPaperCode, setSelectedPaperCode] = useState(generatedPapers[0]?.paperCode || '');

  useEffect(() => {
    if (!selectedPaperCode && generatedPapers.length > 0) {
      setSelectedPaperCode(generatedPapers[0].paperCode);
    }
  }, [generatedPapers, selectedPaperCode]);

  const activePaper = generatedPapers.find((p) => p.paperCode === selectedPaperCode) || generatedPapers[0];

  // Derive questions
  const displayQuestions = activePaper?.questions && activePaper.questions.length > 0
    ? activePaper.questions
    : questions.filter((q) => (!activePaper || q.subject === activePaper.subject));

  // Candidate Login Form State
  const [studentIdInput, setStudentIdInput] = useState('');
  const [studentNameInput, setStudentNameInput] = useState('');
  const [studentPinInput, setStudentPinInput] = useState('2026');
  const [terminalError, setTerminalError] = useState('');

  // Active Candidate Session State
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [candidateAnswers, setCandidateAnswers] = useState({});
  const [candidateReceipt, setCandidateReceipt] = useState(null);

  // Time-lock countdown seconds
  const [countdownSeconds, setCountdownSeconds] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for time-locked waiting screen
  useEffect(() => {
    let timer;
    if (candidateStep === 'TIME_LOCK' && countdownSeconds > 0) {
      timer = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [candidateStep, countdownSeconds]);

  const centerInfo = {
    centerId: user?.centerId || 'CEN-101',
    centerName: user?.name || `Authorized Center (${user?.centerId || 'CEN-101'})`,
    paperName: activePaper ? activePaper.title : 'Examination Paper 2026',
    subject: activePaper ? activePaper.subject : 'Computer Security & Cryptography',
    paperCode: activePaper ? activePaper.paperCode : 'EXAM-2026-MAIN',
    duration: activePaper ? activePaper.duration : '3 Hours',
    startTime: activePaper?.scheduledStartTime || '10:00 AM IST',
    endTime: activePaper?.scheduledEndTime || '01:00 PM IST'
  };

  const formatCountdown = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Candidate Login
  const handleCandidateLogin = (e) => {
    e.preventDefault();
    const cleanStdId = studentIdInput.trim().toUpperCase();

    if (!cleanStdId) {
      setTerminalError('Please enter Student ID.');
      return;
    }

    if (!cleanStdId.includes('STD')) {
      setTerminalError("Invalid format. Student ID must contain 'STD' (e.g. STD-2026-001).");
      return;
    }

    const name = studentNameInput.trim() || `Candidate (${cleanStdId})`;

    addAuditLog(
      'CANDIDATE_TERMINAL_LOGIN',
      `${name} (${cleanStdId})`,
      'Candidate Student',
      `Center ${centerInfo.centerId}`,
      activePaper?.ipfsCID || null
    );

    setActiveCandidate({
      rollNumber: cleanStdId,
      name,
      centerId: centerInfo.centerId,
      subject: centerInfo.subject,
      paperCode: centerInfo.paperCode
    });

    setCandidateAnswers({});
    setCandidateReceipt(null);
    setTerminalError('');
    // Initialize countdown timer and direct to time-lock waiting page
    setCountdownSeconds(15);
    setCandidateStep('TIME_LOCK');
  };

  // 2. Candidate Answer Change
  const handleCandidateAnswerChange = (qId, text) => {
    setCandidateAnswers((prev) => ({
      ...prev,
      [qId]: text
    }));
  };

  // 3. Submit Final Exam Answer Sheet
  const handleCandidateSubmitExam = (e) => {
    e.preventDefault();
    if (!activeCandidate) return;

    const receiptId = `SUB-${Math.floor(100000 + Math.random() * 900000)}`;
    const tx = addAuditLog(
      'STUDENT_ANSWER_SHEET_SUBMITTED',
      `${activeCandidate.name} (${activeCandidate.rollNumber})`,
      'Candidate Student',
      receiptId,
      activePaper?.ipfsCID || null
    );

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const receipt = {
      receiptId,
      timestamp: nowStr,
      txHash: tx.txHash,
      answeredCount: Object.keys(candidateAnswers).length,
      totalCount: displayQuestions.length
    };

    setCandidateReceipt(receipt);
    setCandidateStep('SUBMITTED');
  };

  // 4. Reset & Return to Candidate Login
  const handleCandidateLogout = () => {
    if (candidateStep === 'QUESTION_PAPER' && Object.keys(candidateAnswers).length > 0) {
      if (!window.confirm('You have entered answers that will be lost. Are you sure you want to exit?')) {
        return;
      }
    }
    setActiveCandidate(null);
    setStudentIdInput('');
    setStudentNameInput('');
    setCandidateAnswers({});
    setCandidateReceipt(null);
    setTerminalError('');
    setCountdownSeconds(15);
    setCandidateStep('LOGIN');
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%', padding: '16px' }}>
      {/* Top Center Verification Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 0 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Examination Center
              </span>
              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {centerInfo.centerId}
              </span>
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              {centerInfo.centerName}
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
              System Time (IST)
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
          {candidateStep === 'LOGIN' && (
            <button
              onClick={logout}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
              title="Log out of Center"
            >
              <LogOut size={14} />
              <span>Center Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* PAGE 1: CANDIDATE LOGIN FORM */}
      {/* ============================================================== */}
      {candidateStep === 'LOGIN' && (
        <div
          className="glass-panel"
          style={{
            maxWidth: '520px',
            margin: '20px auto',
            padding: '36px',
            border: '1px solid rgba(2, 132, 199, 0.35)',
            background: 'rgba(15, 23, 42, 0.85)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                marginBottom: '14px',
                boxShadow: '0 0 20px rgba(2, 132, 199, 0.35)'
              }}
            >
              <UserCheck size={28} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Candidate Login
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
              Sign in to access your assigned examination paper
            </p>
          </div>

          {terminalError && (
            <div
              style={{
                background: 'rgba(220, 38, 38, 0.12)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                color: '#f87171',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <AlertCircle size={16} />
              <span>{terminalError}</span>
            </div>
          )}

          <form onSubmit={handleCandidateLogin}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={14} />
                <span>Student ID</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. STD-2026-001"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                required
                style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.95rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={14} />
                <span>Candidate Name (Optional)</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Full Name"
                value={studentNameInput}
                onChange={(e) => setStudentNameInput(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <KeyRound size={14} />
                <span>Passcode</span>
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Passcode"
                value={studentPinInput}
                onChange={(e) => setStudentPinInput(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            >
              <span>Login to Examination</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* PAGE 2: TIME-LOCKED WAITING ROOM (START EXAM BUTTON CANNOT BE CLICKED UNTIL TIME STARTS) */}
      {/* ============================================================== */}
      {candidateStep === 'TIME_LOCK' && activeCandidate && (
        <div>
          {/* Candidate Session Bar */}
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              marginBottom: '20px',
              border: '1px solid rgba(2, 132, 199, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '4px' }}>
                <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
                  Candidate Authenticated • {centerInfo.centerId}
                </span>
                <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {activeCandidate.rollNumber}
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                {activeCandidate.name}
              </h2>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Paper: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{activeCandidate.subject}</span> [{activeCandidate.paperCode}] • Duration: {centerInfo.duration}
              </div>
            </div>

            <button
              onClick={handleCandidateLogout}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.8rem' }}
            >
              <LogOut size={14} />
              <span>Exit Session</span>
            </button>
          </div>

          {/* Time Lock Card */}
          <div
            className="glass-panel"
            style={{
              textAlign: 'center',
              padding: '36px 24px',
              border: countdownSeconds > 0 ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(16, 185, 129, 0.4)'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.78rem',
                fontWeight: 700,
                color: countdownSeconds > 0 ? '#f59e0b' : '#34d399',
                background: countdownSeconds > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                padding: '6px 14px',
                borderRadius: '16px',
                marginBottom: '16px'
              }}
            >
              <Lock size={14} />
              <span>
                {countdownSeconds > 0 ? 'QUESTION PAPER TIME-LOCKED' : 'EXAM TIME HAS STARTED'}
              </span>
            </div>

            <div
              className={`timer-large ${countdownSeconds > 0 ? 'highlight-amber' : ''}`}
              style={{
                fontSize: '3.2rem',
                fontWeight: 800,
                margin: '12px 0',
                letterSpacing: '0.04em',
                color: countdownSeconds > 0 ? '#f59e0b' : '#34d399'
              }}
            >
              {formatCountdown(countdownSeconds)}
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 26px', lineHeight: 1.6 }}>
              {countdownSeconds > 0
                ? 'The examination paper is scheduled and locked. The "Start Exam" button below cannot be clicked until the start time is reached.'
                : 'The scheduled start time has arrived! Click "Start Exam" below to open the question paper.'}
            </p>

            {/* BUTTON CANNOT BE CLICKED UNTIL TIME STARTS */}
            <div>
              {countdownSeconds > 0 ? (
                <button
                  className="btn btn-secondary"
                  disabled
                  style={{
                    padding: '14px 32px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    opacity: 0.55,
                    cursor: 'not-allowed',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    minWidth: '220px',
                    justifyContent: 'center'
                  }}
                >
                  <Lock size={16} />
                  <span>Start Exam (Locked)</span>
                </button>
              ) : (
                <button
                  className="btn btn-success"
                  onClick={() => setCandidateStep('QUESTION_PAPER')}
                  style={{
                    padding: '14px 32px',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: '0 0 24px rgba(16, 185, 129, 0.45)',
                    minWidth: '220px',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Play size={18} />
                  <span>Start Exam</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PAGE 3: QUESTION PAPER PAGE (DIFFERENT PAGE VIEW) */}
      {/* ============================================================== */}
      {candidateStep === 'QUESTION_PAPER' && activeCandidate && (
        <div>
          {/* Question Paper Header Bar */}
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              marginBottom: '20px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '4px' }}>
                <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                  EXAMINATION IN PROGRESS • {centerInfo.centerId}
                </span>
                <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {activeCandidate.rollNumber}
                </span>
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                {centerInfo.paperName}
              </h2>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Subject: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{activeCandidate.subject}</span> • Code: [{activeCandidate.paperCode}] • Duration: {centerInfo.duration}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.82rem', color: '#38bdf8', fontWeight: 600 }}>
                Answered: {Object.keys(candidateAnswers).length} / {displayQuestions.length}
              </div>
              <button
                onClick={handleCandidateLogout}
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: '0.78rem' }}
              >
                <LogOut size={13} />
                <span>Exit</span>
              </button>
            </div>
          </div>

          {/* Question Paper Content */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <form onSubmit={handleCandidateSubmitExam}>
              {!displayQuestions || displayQuestions.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No examination questions are currently loaded for this paper code.
                </div>
              ) : (
                displayQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    style={{
                      marginBottom: '28px',
                      paddingBottom: '24px',
                      borderBottom: idx === displayQuestions.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.95rem' }}>
                        Question {idx + 1}
                      </span>
                      <span
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          padding: '3px 12px',
                          borderRadius: '12px',
                          fontSize: '0.76rem',
                          fontWeight: 600
                        }}
                      >
                        {q.marks} Marks
                      </span>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.94rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
                      {q.questionText}
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                        Your Written Answer:
                      </label>
                      <textarea
                        rows={4}
                        className="form-control"
                        placeholder="Type your answer here..."
                        value={candidateAnswers[q.id || idx] || ''}
                        onChange={(e) => handleCandidateAnswerChange(q.id || idx, e.target.value)}
                        style={{ fontSize: '0.88rem', lineHeight: 1.5, padding: '10px' }}
                      />
                    </div>
                  </div>
                ))
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                {displayQuestions.length > 0 && (
                  <button
                    type="submit"
                    className="btn btn-success"
                    style={{ flex: 1, padding: '12px', fontSize: '0.98rem', fontWeight: 700, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}
                  >
                    <Send size={16} />
                    <span>Submit Answer Sheet</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCandidateLogout}
                  style={{ padding: '12px 20px', fontSize: '0.86rem' }}
                >
                  Cancel & Exit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PAGE 4: SUBMISSION CONFIRMATION PAGE */}
      {/* ============================================================== */}
      {candidateStep === 'SUBMITTED' && candidateReceipt && (
        <div
          className="glass-panel"
          style={{
            maxWidth: '620px',
            margin: '20px auto',
            padding: '32px',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            background: 'rgba(15, 23, 42, 0.85)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                marginBottom: '14px',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
              }}
            >
              <CheckCircle2 size={30} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Answer Sheet Submitted Successfully
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
              Your examination answers have been recorded.
            </p>
          </div>

          <div
            style={{
              background: 'rgba(0,0,0,0.25)',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
              fontSize: '0.84rem'
            }}
          >
            <div>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>Receipt Number:</span>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)', fontWeight: 600 }}>
                {candidateReceipt.receiptId}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>Reference ID:</span>
              <div style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                {candidateReceipt.txHash.substring(0, 18)}...
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>Submission Time:</span>
              <div style={{ color: 'var(--text-main)' }}>{candidateReceipt.timestamp}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>Answered Questions:</span>
              <div style={{ fontWeight: 600, color: '#34d399' }}>
                {candidateReceipt.answeredCount} of {candidateReceipt.totalCount}
              </div>
            </div>
          </div>

          <button
            onClick={handleCandidateLogout}
            className="btn btn-success"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 700 }}
          >
            <UserCheck size={16} />
            <span>Next Candidate Login</span>
          </button>
        </div>
      )}
    </div>
  );
}
