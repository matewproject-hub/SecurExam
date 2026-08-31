import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, Play, Lock, AlertCircle, CheckCircle2, Send, FileText, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { generatedPapers, questions, addAuditLog } = useData();
  const [currentTime, setCurrentTime] = useState(new Date());

  const [simulatedState, setSimulatedState] = useState('COUNTDOWN');
  const [countdownSeconds, setCountdownSeconds] = useState(30);
  const [isExamOpen, setIsExamOpen] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState(null);

  const safePapers = generatedPapers || [];
  const safeQuestions = questions || [];

  // Active Paper selection
  const activePaper = safePapers.find((p) => p.subject === user?.subject || p.paperCode === user?.paperCode) || safePapers[0] || null;

  const displayQuestions = activePaper?.questions && activePaper.questions.length > 0
    ? activePaper.questions
    : safeQuestions.filter((q) => q.status === 'Approved' && (!activePaper || q.subject === activePaper.subject));

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

  const studentInfo = {
    rollNumber: user?.rollNumber || 'STD-T78',
    name: user?.name || `Candidate (${user?.rollNumber || 'STD-T78'})`,
    subject: activePaper?.subject || user?.subject || 'Computer Security & Cryptography',
    paperCode: activePaper?.paperCode || 'N/A',
    duration: activePaper?.duration || 'N/A',
    totalMarks: activePaper?.totalMarks || 0
  };

  const handleAnswerChange = (qId, text) => {
    setSubmittedAnswers((prev) => ({
      ...prev,
      [qId]: text
    }));
  };

  const handleSubmitExam = (e) => {
    e.preventDefault();
    const receiptId = `SUB-${Math.floor(100000 + Math.random() * 900000)}`;
    const tx = addAuditLog(
      'STUDENT_ANSWER_SHEET_SUBMITTED',
      `${studentInfo.name} (${studentInfo.rollNumber})`,
      'Candidate Student',
      receiptId,
      activePaper?.ipfsCID || null
    );

    setIsSubmitted(true);
    setSubmissionReceipt({
      receiptId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      txHash: tx.txHash,
      answeredCount: Object.keys(submittedAnswers).length,
      totalCount: displayQuestions.length
    });
  };

  const formatCountdown = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', width: '100%', padding: '16px 0' }}>
      {/* Student Details Card */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              <UserCheck size={14} />
              <span>CANDIDATE ROLL NO: {studentInfo.rollNumber}</span>
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              {studentInfo.name}
            </h2>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Subject: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{studentInfo.subject}</span>
              <span style={{ marginLeft: 12, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                [{studentInfo.paperCode}]
              </span>
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
            <span className="meta-item-label">Total Questions</span>
            <span className="meta-item-value">{displayQuestions.length} Questions</span>
          </div>

          <div className="meta-item-box">
            <span className="meta-item-label">Total Marks</span>
            <span className="meta-item-value" style={{ color: 'var(--primary)' }}>{studentInfo.totalMarks} Marks</span>
          </div>

          <div className="meta-item-box">
            <span className="meta-item-label">Duration</span>
            <span className="meta-item-value" style={{ color: 'var(--text-muted)' }}>{studentInfo.duration}</span>
          </div>
        </div>
      </div>

      {/* Clock Simulator Toolbar */}
      <div className="sim-toolbar">
        <div className="sim-toolbar-title">
          <Clock size={15} style={{ color: 'var(--primary)' }} />
          <span>Clock Status Simulator:</span>
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
            <span>Before Exam</span>
          </button>

          <button
            onClick={() => {
              setSimulatedState('LIVE');
              setIsExamOpen(false);
            }}
            className={`segmented-btn ${simulatedState === 'LIVE' ? 'active-live' : ''}`}
          >
            <CheckCircle2 size={12} />
            <span>Exam Live</span>
          </button>

          <button
            onClick={() => {
              setSimulatedState('CONCLUDED');
              setIsExamOpen(false);
            }}
            className={`segmented-btn ${simulatedState === 'CONCLUDED' ? 'active-concluded' : ''}`}
          >
            <AlertCircle size={12} />
            <span>Exam Ended</span>
          </button>
        </div>
      </div>

      {/* Main Status & Action Card */}
      <div className={`status-action-card status-${simulatedState.toLowerCase()}`}>
        {simulatedState === 'COUNTDOWN' && (
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 12px', borderRadius: '12px', marginBottom: '8px' }}>
              <Lock size={13} />
              <span>EXAMINATION PAPER LOCKED • WAITING FOR START TIME</span>
            </div>

            <div className="timer-large highlight-amber">
              {formatCountdown(countdownSeconds)}
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              The examination paper is encrypted. Access will open automatically once the countdown reaches zero.
            </p>

            <button
              className="btn btn-secondary"
              disabled
              style={{ width: '100%', maxWidth: '420px', padding: '12px', opacity: 0.65, cursor: 'not-allowed' }}
            >
              <Lock size={16} />
              <span>Locked (Unlocks Automatically at Exam Start Time)</span>
            </button>
          </div>
        )}

        {simulatedState === 'LIVE' && (
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '12px', marginBottom: '12px' }}>
              <ShieldCheck size={14} />
              <span>EXAMINATION SESSION ACTIVE</span>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
              {isSubmitted ? 'Answer Sheet Successfully Submitted' : 'Your Examination Paper is Ready'}
            </h3>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.5 }}>
              {isSubmitted
                ? 'Your responses have been cryptographically signed and stored in the evaluation ledger.'
                : 'Click below to launch the online question paper & answer workspace.'}
            </p>

            <button
              className="btn btn-success"
              onClick={() => setIsExamOpen(true)}
              style={{ width: '100%', maxWidth: '420px', padding: '14px 24px', fontSize: '0.95rem', fontWeight: 600, gap: 8, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
            >
              <Play size={18} />
              <span>{isSubmitted ? 'View Submitted Answer Sheet' : 'Start / Open Examination Paper'}</span>
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
              Examination Window Closed
            </h3>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 20px' }}>
              The time limit for this examination has expired. Further submissions are disabled.
            </p>

            <button
              className="btn btn-secondary"
              disabled
              style={{ width: '100%', maxWidth: '420px', padding: '12px', opacity: 0.5 }}
            >
              <Lock size={16} />
              <span>Session Closed</span>
            </button>
          </div>
        )}
      </div>

      {/* Submission Receipt Banner */}
      {isSubmitted && submissionReceipt && (
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            marginTop: '20px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#34d399', fontWeight: 700, marginBottom: '8px' }}>
            <CheckCircle2 size={20} />
            <span>SUBMISSION CONFIRMED: DIGITAL RECEIPT GENERATED</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.82rem', marginTop: '12px' }}>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Receipt ID:</span>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{submissionReceipt.receiptId}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Audit Hash:</span>
              <div style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{submissionReceipt.txHash.substring(0, 18)}...</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Submitted At:</span>
              <div>{submissionReceipt.timestamp}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Answered Questions:</span>
              <div>{submissionReceipt.answeredCount} of {submissionReceipt.totalCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* Student Exam Modal Workspace */}
      <Modal
        isOpen={isExamOpen}
        onClose={() => setIsExamOpen(false)}
        title={`Student Examination - ${studentInfo.subject}`}
      >
        <form onSubmit={handleSubmitExam}>
          <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '14px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
              {studentInfo.subject}
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Candidate: <strong>{studentInfo.name}</strong> ({studentInfo.rollNumber})
            </div>
          </div>

          <div>
            {!displayQuestions || displayQuestions.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No examination questions are currently loaded for this subject.
              </div>
            ) : (
              displayQuestions.map((q, idx) => (
                <div key={q.id || idx} className="question-item" style={{ marginBottom: '20px' }}>
                  <div className="question-header">
                    <span className="question-title">Q{idx + 1}. {q.courseOutcome || `Question ${idx + 1}`}</span>
                    <span className="marks-pill">{q.marks} Marks</span>
                  </div>
                  <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '12px' }}>
                    {q.questionText}
                  </p>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Your Written Answer / Solution:
                    </label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="Type your answer here..."
                      value={submittedAnswers[q.id || idx] || ''}
                      onChange={(e) => handleAnswerChange(q.id || idx, e.target.value)}
                      disabled={isSubmitted}
                      style={{ fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {!isSubmitted && displayQuestions.length > 0 && (
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
              <button
                type="submit"
                className="btn btn-success"
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
              >
                <Send size={16} />
                <span>Submit Final Answer Sheet</span>
              </button>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
