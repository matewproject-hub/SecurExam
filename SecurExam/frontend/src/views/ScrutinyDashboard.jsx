import React, { useState, useEffect } from 'react';
import {
  XCircle,
  Edit3,
  CheckCircle,
  ListChecks,
  Eye
} from 'lucide-react';
import { BLOOM_TAXONOMY } from '../data/mockData';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function ScrutinyDashboard() {
  const { questions, approveQuestion, rejectQuestion } = useData();
  const { user } = useAuth();

  const pendingQueue = questions.filter((q) => q.status.includes('Pending') || q.status.includes('Round'));
  const [activeQuestion, setActiveQuestion] = useState(pendingQueue[0] || questions[0] || null);

  useEffect(() => {
    if (!activeQuestion && questions.length > 0) {
      setActiveQuestion(questions[0]);
    }
  }, [questions, activeQuestion]);

  // Editable version state for the currently active question
  const [editedText, setEditedText] = useState(activeQuestion?.questionText || '');
  const [editedAnswer, setEditedAnswer] = useState(activeQuestion?.answer || '');
  const [editedBloom, setEditedBloom] = useState(activeQuestion?.bloomLevel || 'Apply');
  const [editedDifficulty, setEditedDifficulty] = useState(activeQuestion?.difficulty || 'Medium');

  useEffect(() => {
    if (activeQuestion) {
      setEditedText(activeQuestion.questionText);
      setEditedAnswer(activeQuestion.answer);
      setEditedBloom(activeQuestion.bloomLevel);
      setEditedDifficulty(activeQuestion.difficulty);
    }
  }, [activeQuestion]);

  // Verification Checklist State (Defaults to false for honest audit)
  const [checklist, setChecklist] = useState({
    grammar: false,
    duplication: false,
    ambiguity: false,
    correctness: false,
    bloomClassification: false,
    difficultyAlignment: false
  });

  const [notification, setNotification] = useState('');

  const handleSelectQuestion = (q) => {
    setActiveQuestion(q);
    // Reset checklist on selection
    setChecklist({
      grammar: false,
      duplication: false,
      ambiguity: false,
      correctness: false,
      bloomClassification: false,
      difficultyAlignment: false
    });
  };

  const handleToggleCheck = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecksPassed = Object.values(checklist).every(Boolean);

  const handleApprove = () => {
    if (!activeQuestion) return;
    const currRound = activeQuestion.round || 1;
    const reviewerName = user?.name || `Scrutiny Officer (Level ${currRound})`;

    approveQuestion(
      activeQuestion.id,
      currRound,
      {
        questionText: editedText,
        answer: editedAnswer,
        bloomLevel: editedBloom,
        difficulty: editedDifficulty,
        approvedBy: reviewerName
      },
      reviewerName
    );

    setNotification(
      `Question ${activeQuestion.id} approved by ${reviewerName}! Advanced from Round ${currRound} to ${
        currRound === 3 ? 'Final Verified Question Bank' : `Round ${currRound + 1}`
      }.`
    );

    const nextQ = questions.find((item) => item.id !== activeQuestion.id && item.status.includes('Pending'));
    setActiveQuestion(nextQ || null);
  };

  const handleReject = () => {
    if (!activeQuestion) return;
    const reviewerName = user?.name || 'Scrutiny Officer';
    rejectQuestion(activeQuestion.id, 'Revisions required by scrutiny officer', reviewerName);
    setNotification(`Question ${activeQuestion.id} rejected by ${reviewerName} and returned with feedback.`);
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: 'calc(100vh - 94px)' }}>
      <main className="content-viewport" style={{ width: '100%' }}>
        {/* Header Title */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.4rem' }}>Scrutiny Officer Review Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Multi-stage question validation, grammar audit, Bloom's Taxonomy check, and solution verification.
          </p>
        </div>

        {/* Floating Notification */}
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
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={18} />
              <span>{notification}</span>
            </div>
          </div>
        )}

        {/* Visual Pipeline Progression Header */}
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 700 }}>
            3-Tier Scrutiny Progression Workflow
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <div style={{ background: '#3b82f6', color: 'white', padding: '8px', borderRadius: 6, fontWeight: 700 }}>R1</div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#60a5fa' }}>Round 1: Grammar & Correctness</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Linguistic audit & answer verification</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <div style={{ background: '#f59e0b', color: 'white', padding: '8px', borderRadius: 6, fontWeight: 700 }}>R2</div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fbbf24' }}>Round 2: Duplication & Ambiguity</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Plagiarism check & clarity review</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <div style={{ background: '#10b981', color: 'white', padding: '8px', borderRadius: 6, fontWeight: 700 }}>R3</div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#34d399' }}>Round 3: Bloom's & Syllabus Alignment</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Final chief examiner authorization</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Review Workspace */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
          {/* Pending Queue List */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Assigned Review Queue</span>
              <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(0, 120, 212, 0.2)', color: '#38bdf8' }}>
                {questions.length} Items
              </span>
            </h3>

            {questions.length === 0 ? (
              <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No questions pending in queue.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {questions.map((q) => {
                  const isSelected = activeQuestion?.id === q.id;
                  return (
                    <div
                      key={q.id}
                      onClick={() => handleSelectQuestion(q)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(0, 120, 212, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                        border: isSelected ? '1px solid #0078d4' : '1px solid rgba(255, 255, 255, 0.06)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>
                          {q.id}
                        </span>
                        <span className={`round-pill round-${q.round || 1}`} style={{ fontSize: '0.65rem' }}>
                          Round {q.round || 1}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px', lineHeight: 1.2 }}>
                        {q.subject}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Marks: {q.marks} | Bloom: {q.bloomLevel}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Side-by-Side Review Section */}
          {activeQuestion ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Question Metadata Header */}
              <div className="glass-panel" style={{ padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 700, fontSize: '1.1rem' }}>
                      {activeQuestion.id}
                    </span>
                    <span className={`round-pill round-${activeQuestion.round || 1}`}>
                      Currently in Round {activeQuestion.round || 1} Scrutiny
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Submitted by <strong>{activeQuestion.submittedBy}</strong> at {activeQuestion.submittedAt}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-danger" onClick={handleReject} style={{ fontSize: '0.82rem' }}>
                    <XCircle size={15} />
                    <span>Reject / Request Changes</span>
                  </button>
                  <button className="btn btn-success" onClick={handleApprove} disabled={!allChecksPassed} style={{ fontSize: '0.82rem', opacity: allChecksPassed ? 1 : 0.6 }}>
                    <CheckCircle size={15} />
                    <span>Approve & Promote Question</span>
                  </button>
                </div>
              </div>

              {/* Side-by-Side View */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Left: Original Submitted Question */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                    <Eye size={16} style={{ color: '#94a3b8' }} />
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Original Submitted Version (Read Only)</h4>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>Question Text</label>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', fontSize: '0.86rem', marginTop: '4px', lineHeight: 1.5 }}>
                      {activeQuestion.questionText}
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>Model Answer Solution</label>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', fontSize: '0.82rem', marginTop: '4px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {activeQuestion.answer}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78rem' }}>
                    <div><strong style={{ color: 'var(--text-dim)' }}>Bloom Level:</strong> {activeQuestion.bloomLevel}</div>
                    <div><strong style={{ color: 'var(--text-dim)' }}>Difficulty:</strong> {activeQuestion.difficulty}</div>
                  </div>
                </div>

                {/* Right: Editable Scrutiny Version */}
                <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(0, 120, 212, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                    <Edit3 size={16} style={{ color: '#38bdf8' }} />
                    <h4 style={{ fontSize: '0.9rem', color: '#38bdf8' }}>Scrutiny Correction Version (Editable)</h4>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Edit Question Text</label>
                    <textarea
                      rows={4}
                      className="form-control"
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      style={{ fontSize: '0.86rem' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Edit Model Answer</label>
                    <textarea
                      rows={3}
                      className="form-control"
                      value={editedAnswer}
                      onChange={(e) => setEditedAnswer(e.target.value)}
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Bloom's Level</label>
                      <select className="form-select" value={editedBloom} onChange={(e) => setEditedBloom(e.target.value)}>
                        {BLOOM_TAXONOMY.map((b) => (
                          <option key={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Difficulty</label>
                      <select className="form-select" value={editedDifficulty} onChange={(e) => setEditedDifficulty(e.target.value)}>
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrutiny Checklists & Verification Checklist */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.92rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ListChecks size={18} style={{ color: '#10b981' }} />
                  <span>Mandatory Scrutiny Officer Verification Checklist (Check all to enable Approval)</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.grammar} onChange={() => handleToggleCheck('grammar')} />
                    <span>Grammar & Syntax Accurate</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.duplication} onChange={() => handleToggleCheck('duplication')} />
                    <span>Zero Plagiarism / Duplication</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.ambiguity} onChange={() => handleToggleCheck('ambiguity')} />
                    <span>Question Unambiguous & Clear</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.correctness} onChange={() => handleToggleCheck('correctness')} />
                    <span>Model Answer Solution Correct</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.bloomClassification} onChange={() => handleToggleCheck('bloomClassification')} />
                    <span>Bloom's Taxonomy Validated</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.difficultyAlignment} onChange={() => handleToggleCheck('difficultyAlignment')} />
                    <span>Difficulty Level Verified</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a question from the queue on the left to begin scrutiny review.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
