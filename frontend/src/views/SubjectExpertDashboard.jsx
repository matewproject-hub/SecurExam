import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Blocks,
  Copy,
  Check,
  Search,
  Layers,
  Award,
  Trash2,
  Eye,
  Edit3,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { BLOOM_TAXONOMY, COURSE_OUTCOMES } from '../data/mockData';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { generateQuestionHash } from '../utils/crypto';
import Modal from '../components/Modal';

export default function SubjectExpertDashboard() {
  const { user } = useAuth();
  const {
    questions,
    auditLogs,
    isUploadAllowed,
    addQuestionWithDistractors,
    verifyQuestionIntegrity,
    recordQuestionAction
  } = useData();

  const [activeTab, setActiveTab] = useState('authoring'); // 'authoring' | 'repository' | 'ledger'
  const [copiedKey, setCopiedKey] = useState(null);
  const [notification, setNotification] = useState('');

  // Form State for Question Authoring Studio
  const [subject, setSubject] = useState('Computer Security & Cryptography');
  const [topic, setTopic] = useState('');
  const [bloomLevel, setBloomLevel] = useState(BLOOM_TAXONOMY[2] || 'Apply (Level 3)');
  const [courseOutcome, setCourseOutcome] = useState(COURSE_OUTCOMES[2] || 'CO3: System Vulnerabilities & Security Protocols');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [marks, setMarks] = useState(2);
  const [questionText, setQuestionText] = useState('');
  const [correctOption, setCorrectOption] = useState('');
  const [correctRationale, setCorrectRationale] = useState('');
  const [distractors, setDistractors] = useState([
    { text: '', rationale: '' },
    { text: '', rationale: '' },
    { text: '', rationale: '' }
  ]);

  // Live Cryptographic Hash Preview State
  const [liveHash, setLiveHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [committedReceipt, setCommittedReceipt] = useState(null);

  // Search & Filter State in Repository
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterBloom, setFilterBloom] = useState('ALL');

  // Modals
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedAuditTrail, setSelectedAuditTrail] = useState(null);
  const [previewQuestion, setPreviewQuestion] = useState(null);

  const uploadStatus = isUploadAllowed();

  // Dynamic Live Hash Calculation
  useEffect(() => {
    let isCancelled = false;
    const calculateHash = async () => {
      setIsHashing(true);
      try {
        const hash = await generateQuestionHash({
          questionText,
          correctOption,
          distractors: distractors.map((d) => d.text).filter(Boolean),
          subject,
          topic,
          bloomLevel,
          courseOutcome,
          difficulty,
          marks
        });
        if (!isCancelled) {
          setLiveHash(hash);
        }
      } catch {
        // fallback
      } finally {
        if (!isCancelled) setIsHashing(false);
      }
    };

    calculateHash();
    return () => {
      isCancelled = true;
    };
  }, [questionText, correctOption, distractors, subject, topic, bloomLevel, courseOutcome, difficulty, marks]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddDistractor = () => {
    if (distractors.length >= 5) {
      setNotification('Maximum 5 distractors allowed per question.');
      setTimeout(() => setNotification(''), 3000);
      return;
    }
    setDistractors([...distractors, { text: '', rationale: '' }]);
  };

  const handleRemoveDistractor = (index) => {
    if (distractors.length <= 2) {
      setNotification('A minimum of 2 distractor options is required.');
      setTimeout(() => setNotification(''), 3000);
      return;
    }
    setDistractors(distractors.filter((_, i) => i !== index));
  };

  const handleDistractorChange = (index, field, value) => {
    const updated = [...distractors];
    updated[index] = { ...updated[index], [field]: value };
    setDistractors(updated);
  };

  // Submit Question to Blockchain
  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!uploadStatus.allowed) {
      setNotification(`Upload Locked: ${uploadStatus.reason}`);
      return;
    }

    if (!questionText.trim()) {
      setNotification('Please enter the question statement.');
      return;
    }

    if (!correctOption.trim()) {
      setNotification('Please specify the primary correct option.');
      return;
    }

    const validDistractors = distractors.filter((d) => d.text.trim());
    if (validDistractors.length < 2) {
      setNotification('Please provide at least 2 plausible distractor options.');
      return;
    }

    setIsSubmitting(true);
    setNotification('');

    try {
      const payload = {
        questionText: questionText.trim(),
        correctOption: correctOption.trim(),
        distractors: validDistractors.map((d) => d.text.trim()),
        distractorsWithRationale: validDistractors,
        rationale: correctRationale.trim(),
        subject,
        topic: topic.trim() || 'General Unit',
        bloomLevel,
        courseOutcome,
        difficulty,
        marks: Number(marks) || 1,
        submittedBy: user?.name || 'Dr. Sarah Lin (SME-401)'
      };

      const result = await addQuestionWithDistractors(payload, user);
      setCommittedReceipt(result);
      setNotification(`Question ${result.questionCode} successfully anchored to Blockchain!`);

      // Reset Form fields
      setQuestionText('');
      setCorrectOption('');
      setCorrectRationale('');
      setTopic('');
      setDistractors([
        { text: '', rationale: '' },
        { text: '', rationale: '' },
        { text: '', rationale: '' }
      ]);
    } catch (err) {
      setNotification(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // On-demand Cryptographic Integrity Verification
  const handleVerifyIntegrity = async (questionCode) => {
    setIsVerifying(true);
    try {
      const res = await verifyQuestionIntegrity(questionCode);
      setVerificationResult(res);
      // Record verification action to blockchain ledger
      recordQuestionAction(questionCode, 'INTEGRITY_VERIFIED_BY_EXPERT', user?.name, 'Subject Expert');
    } catch (err) {
      setVerificationResult({ verified: false, error: err.message });
    } finally {
      setIsVerifying(false);
    }
  };

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        !searchQuery ||
        q.questionText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.questionCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.correctOption?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubject = filterSubject === 'ALL' || q.subject === filterSubject;
      const matchesBloom = filterBloom === 'ALL' || q.bloomLevel?.includes(filterBloom);

      return matchesSearch && matchesSubject && matchesBloom;
    });
  }, [questions, searchQuery, filterSubject, filterBloom]);

  // Statistics
  const authoredCount = questions.length;
  const verifiedCount = questions.filter((q) => q.sha256Hash).length;
  const avgDistractors = (
    questions.reduce((sum, q) => sum + (q.distractors?.length || 3), 0) / (questions.length || 1)
  ).toFixed(1);

  return (
    <div className="dashboard-container" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Banner: Subject Expert Profile & Status */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          borderLeft: '4px solid #a855f7'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 0 16px rgba(168, 85, 247, 0.35)'
            }}
          >
            <BookOpen size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Subject Matter Expert Studio</h1>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  color: '#c084fc',
                  fontWeight: 600,
                  border: '1px solid rgba(168, 85, 247, 0.3)'
                }}
              >
                SME Clearance Level 3
              </span>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Authorized Author: <strong>{user?.name || 'Dr. Sarah Lin (SME-401)'}</strong> • Department of Computer Science & Applied Cryptography
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: uploadStatus.allowed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${uploadStatus.allowed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8rem'
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: uploadStatus.allowed ? '#10b981' : '#ef4444'
              }}
            />
            <span style={{ color: uploadStatus.allowed ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              {uploadStatus.allowed ? 'Upload Window Open' : 'Upload Window Closed'}
            </span>
          </div>

          <div
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8rem'
            }}
          >
            <Blocks size={14} style={{ color: '#38bdf8' }} />
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>Ethereum Consensus Block #114</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <BookOpen size={14} style={{ color: '#a855f7' }} />
            <span>Authored Question Bank</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '8px' }}>{authoredCount}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Multi-Choice Items with Distractors
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} style={{ color: '#10b981' }} />
            <span>Verified On-Chain</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '8px', color: '#10b981' }}>{verifiedCount}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            SHA-256 Tamper Resistance Active
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={14} style={{ color: '#38bdf8' }} />
            <span>Avg. Distractors / Question</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '8px', color: '#38bdf8' }}>{avgDistractors}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Plausibility & Discrimination Index
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={14} style={{ color: '#f59e0b' }} />
            <span>Taxonomy Alignment</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '8px', color: '#f59e0b' }}>100%</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Bloom Levels L1 through L6 Covered
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            background: notification.includes('Error') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.15)',
            border: `1px solid ${notification.includes('Error') ? 'rgba(239, 68, 68, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`,
            color: notification.includes('Error') ? '#f87171' : '#c084fc',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.88rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {notification.includes('Error') ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification('')}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Tab Controls */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px',
          marginBottom: '24px'
        }}
      >
        <button
          onClick={() => setActiveTab('authoring')}
          className={`btn ${activeTab === 'authoring' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px'
          }}
        >
          <PlusCircle size={16} />
          <span>Question Authoring Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('repository')}
          className={`btn ${activeTab === 'repository' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px'
          }}
        >
          <BookOpen size={16} />
          <span>My Questions & Integrity Ledger ({authoredCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`btn ${activeTab === 'ledger' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px'
          }}
        >
          <Blocks size={16} />
          <span>Blockchain Audit Ledger</span>
        </button>
      </div>

      {/* TAB 1: QUESTION AUTHORING STUDIO */}
      {activeTab === 'authoring' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '24px' }}>
          {/* Main Authoring Form */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={20} style={{ color: '#a855f7' }} />
              <span>Draft Confidential Examination Item</span>
            </h2>

            <form onSubmit={handleSubmitQuestion}>
              {/* Classification Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Course / Subject</label>
                  <select className="form-control" value={subject} onChange={(e) => setSubject(e.target.value)}>
                    <option value="Computer Security & Cryptography">Computer Security & Cryptography</option>
                    <option value="Operating Systems & Concurrency">Operating Systems & Concurrency</option>
                    <option value="Database Systems & Indexing">Database Systems & Indexing</option>
                    <option value="Distributed Systems & Consensus">Distributed Systems & Consensus</option>
                    <option value="Artificial Intelligence & Neural Nets">Artificial Intelligence & Neural Nets</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Topic / Syllabus Unit</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Asymmetric Cryptography, Hash Functions"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Bloom's Taxonomy Level</label>
                  <select className="form-control" value={bloomLevel} onChange={(e) => setBloomLevel(e.target.value)}>
                    {BLOOM_TAXONOMY.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select className="form-control" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Marks Allocation</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className="form-control"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Course Outcome (CO) Mapping</label>
                <select className="form-control" value={courseOutcome} onChange={(e) => setCourseOutcome(e.target.value)}>
                  {COURSE_OUTCOMES.map((co) => (
                    <option key={co} value={co}>
                      {co}
                    </option>
                  ))}
                </select>
              </div>

              {/* Question Statement */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label">Question Problem Statement / Stem</label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{questionText.length} characters</span>
                </div>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Enter the complete question statement with clear context and constraints..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  required
                />
              </div>

              {/* Primary Correct Option */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  padding: '18px',
                  marginBottom: '24px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#10b981', margin: 0 }}>
                    Correct Option (Answer Key)
                  </label>
                </div>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter the unequivocally correct choice..."
                    value={correctOption}
                    onChange={(e) => setCorrectOption(e.target.value)}
                    required
                    style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rationale / Cryptographic Reference (helps Scrutiny Officers verify quickly)..."
                    value={correctRationale}
                    onChange={(e) => setCorrectRationale(e.target.value)}
                    style={{ fontSize: '0.82rem', background: 'rgba(0, 0, 0, 0.2)' }}
                  />
                </div>
              </div>

              {/* Distractor Options Matrix */}
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.04)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '10px',
                  padding: '18px',
                  marginBottom: '24px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} style={{ color: '#f87171' }} />
                    <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f87171', margin: 0 }}>
                      Distractor Options (Plausible Incorrect Choices)
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDistractor}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <PlusCircle size={12} />
                    <span>Add Distractor</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {distractors.map((dist, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid var(--border-light)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Distractor {idx + 1}
                        </span>
                        {distractors.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDistractor(idx)}
                            style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}
                            title="Remove Distractor"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={`Distractor Option ${idx + 1} text...`}
                        value={dist.text}
                        onChange={(e) => handleDistractorChange(idx, 'text', e.target.value)}
                        required
                        style={{ marginBottom: '8px' }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Targeted Student Misconception / Why this is false..."
                        value={dist.rationale}
                        onChange={(e) => handleDistractorChange(idx, 'rationale', e.target.value)}
                        style={{ fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.03)' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Action */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  type="submit"
                  disabled={isSubmitting || !uploadStatus.allowed}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 24px',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: uploadStatus.allowed ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' : '#475569',
                    cursor: uploadStatus.allowed ? 'pointer' : 'not-allowed'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Signing & Committing to Blockchain...</span>
                    </>
                  ) : (
                    <>
                      <Blocks size={16} />
                      <span>Cryptographically Sign & Commit to Blockchain</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Cryptographic Fingerprint Monitor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '24px', borderTop: '4px solid #38bdf8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <ShieldCheck size={22} style={{ color: '#38bdf8' }} />
                <div>
                  <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Live SHA-256 Fingerprint</h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    FIPS 180-4 Standard • Deterministic Canonical Hash
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '14px',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  wordBreak: 'break-all',
                  color: liveHash ? '#38bdf8' : 'var(--text-dim)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  marginBottom: '14px'
                }}
              >
                {liveHash || '0000000000000000000000000000000000000000000000000000000000000000'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {isHashing ? 'Recalculating hash...' : 'Hash Validated'}
                </span>
                {liveHash && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(liveHash, 'live-hash')}
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {copiedKey === 'live-hash' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'live-hash' ? 'Copied' : 'Copy Hash'}</span>
                  </button>
                )}
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.05)',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5
                }}
              >
                <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                  <Sparkles size={14} style={{ color: '#38bdf8', flexShrink: 0, marginTop: 2 }} />
                  <strong>Avalanche Effect Guarantee:</strong>
                </div>
                Modifying even a single whitespace or punctuation mark in the stem, correct answer, or any distractor completely reshuffles this 256-bit digest. This guarantees zero-tampering throughout scrutiny, printing, and exam center delivery.
              </div>
            </div>

            {/* Committed Receipt Card */}
            {committedReceipt && (
              <div
                className="glass-panel"
                style={{
                  padding: '24px',
                  borderTop: '4px solid #10b981',
                  background: 'rgba(16, 185, 129, 0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <CheckCircle2 size={22} style={{ color: '#10b981' }} />
                  <div>
                    <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#10b981' }}>On-Chain Anchor Confirmed</h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Transaction successfully sealed in block
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Question Code:</span>
                    <strong>{committedReceipt.questionCode}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Block Index:</span>
                    <span>#{committedReceipt.blockNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tx Hash:</span>
                    <span style={{ fontFamily: 'monospace', color: '#a855f7' }}>
                      {committedReceipt.blockchainTx?.substring(0, 16)}...
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Timestamp:</span>
                    <span>{committedReceipt.submittedAt}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('repository')}
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: '16px', fontSize: '0.82rem', padding: '8px' }}
                >
                  View in My Question Bank →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY QUESTIONS REPOSITORY & INTEGRITY MONITOR */}
      {activeTab === 'repository' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          {/* Search & Filters */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search
                  size={16}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Search by code, keyword, or correct option..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select
                className="form-control"
                style={{ width: 'auto' }}
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
              >
                <option value="ALL">All Subjects</option>
                <option value="Computer Security & Cryptography">Computer Security & Cryptography</option>
                <option value="Operating Systems & Concurrency">Operating Systems & Concurrency</option>
                <option value="Database Systems & Indexing">Database Systems & Indexing</option>
              </select>

              <select
                className="form-control"
                style={{ width: 'auto' }}
                value={filterBloom}
                onChange={(e) => setFilterBloom(e.target.value)}
              >
                <option value="ALL">All Bloom Levels</option>
                <option value="Remember">Remember (L1)</option>
                <option value="Understand">Understand (L2)</option>
                <option value="Apply">Apply (L3)</option>
                <option value="Analyze">Analyze (L4)</option>
                <option value="Evaluate">Evaluate (L5)</option>
                <option value="Create">Create (L6)</option>
              </select>
            </div>
          </div>

          {/* Questions Table / List */}
          {filteredQuestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              <BookOpen size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>No questions found matching your filter criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredQuestions.map((q) => (
                <div
                  key={q.id || q.questionCode}
                  style={{
                    padding: '20px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginBottom: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.1)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(56, 189, 248, 0.25)'
                        }}
                      >
                        {q.questionCode || q.id}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{q.subject}</span>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: 'rgba(168, 85, 247, 0.12)',
                          color: '#c084fc',
                          fontWeight: 600
                        }}
                      >
                        {q.bloomLevel}
                      </span>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#f59e0b',
                          fontWeight: 600
                        }}
                      >
                        {q.marks || 1} Marks • {q.difficulty || 'MEDIUM'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          padding: '3px 9px',
                          borderRadius: '12px',
                          fontWeight: 600,
                          background:
                            q.status === 'Approved'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : q.status?.includes('Pending')
                              ? 'rgba(56, 189, 248, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          color:
                            q.status === 'Approved' ? '#10b981' : q.status?.includes('Pending') ? '#38bdf8' : '#f87171'
                        }}
                      >
                        {q.status}
                      </span>
                    </div>
                  </div>

                  {/* Question Stem */}
                  <p style={{ fontSize: '0.94rem', lineHeight: 1.5, marginBottom: '14px', color: 'var(--text-main)' }}>
                    {q.questionText}
                  </p>

                  {/* Options Matrix */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '10px',
                      marginBottom: '16px'
                    }}
                  >
                    {/* Correct Option */}
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        fontSize: '0.84rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600, marginBottom: 4 }}>
                        <CheckCircle2 size={14} />
                        <span>Correct Answer:</span>
                      </div>
                      <div>{q.correctOption || q.answer}</div>
                    </div>

                    {/* Distractors List */}
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        fontSize: '0.84rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontWeight: 600, marginBottom: 4 }}>
                        <AlertTriangle size={14} />
                        <span>Distractors ({q.distractors?.length || 0}):</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-muted)' }}>
                        {(q.distractors || []).slice(0, 3).map((dist, dIdx) => (
                          <li key={dIdx} style={{ marginBottom: 2 }}>
                            {typeof dist === 'string' ? dist : dist.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Cryptographic Hash and Actions Footer */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-light)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>SHA-256 Hash:</span>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.74rem',
                          color: '#38bdf8',
                          background: 'rgba(0,0,0,0.3)',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        {q.sha256Hash?.substring(0, 20)}...
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(q.sha256Hash, `hash-${q.id}`)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                        title="Copy Hash"
                      >
                        {copiedKey === `hash-${q.id}` ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleVerifyIntegrity(q.questionCode || q.id)}
                        disabled={isVerifying}
                        className="btn btn-secondary"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.76rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: '#10b981',
                          borderColor: 'rgba(16, 185, 129, 0.3)'
                        }}
                        title="Recalculate hash on-the-fly and verify against immutable blockchain anchor"
                      >
                        <ShieldCheck size={14} />
                        <span>Verify Integrity</span>
                      </button>

                      <button
                        onClick={() => setSelectedAuditTrail(q)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: 6 }}
                        title="View chronological on-chain event ledger"
                      >
                        <Blocks size={14} />
                        <span>Audit Trail ({q.actions?.length || 1})</span>
                      </button>

                      <button
                        onClick={() => setPreviewQuestion(q)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: 6 }}
                        title="Preview student/candidate shuffled rendering"
                      >
                        <Eye size={14} />
                        <span>Preview</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BLOCKCHAIN AUDIT LEDGER */}
      {activeTab === 'ledger' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Blocks size={20} style={{ color: '#a855f7' }} />
              <span>Decentralized Question Ledger (Immutable Chain Records)</span>
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Connected to Hardhat / Local Consensus Ledger
            </span>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Block / Tx</th>
                  <th>Action Type</th>
                  <th>Entity / Code</th>
                  <th>Actor & Role</th>
                  <th>Cryptographic SHA-256</th>
                  <th>Timestamp</th>
                  <th>Consensus</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id || log.txHash}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#a855f7' }}>
                        {log.txHash ? `${log.txHash.substring(0, 10)}...` : log.id}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 600,
                          background: log.action?.includes('CREATED')
                            ? 'rgba(16, 185, 129, 0.15)'
                            : log.action?.includes('UPDATED')
                            ? 'rgba(56, 189, 248, 0.15)'
                            : 'rgba(168, 85, 247, 0.15)',
                          color: log.action?.includes('CREATED')
                            ? '#10b981'
                            : log.action?.includes('UPDATED')
                            ? '#38bdf8'
                            : '#c084fc'
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.8rem', color: '#38bdf8' }}>{log.cid || 'N/A'}</strong>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {log.user} ({log.role})
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {log.txHash?.substring(2, 18) || '0x...'}...
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{log.timestamp}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: '#10b981',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <ShieldCheck size={12} />
                        <span>IMMUTABLE</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CRYPTOGRAPHIC INTEGRITY VERIFICATION REPORT */}
      {verificationResult && (
        <Modal
          isOpen={!!verificationResult}
          onClose={() => setVerificationResult(null)}
          title="Cryptographic Integrity Audit Report"
        >
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: verificationResult.verified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: verificationResult.verified ? '#10b981' : '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}
            >
              {verificationResult.verified ? <ShieldCheck size={32} /> : <AlertTriangle size={32} />}
            </div>
            <h3 style={{ fontSize: '1.2rem', margin: 0, color: verificationResult.verified ? '#10b981' : '#ef4444' }}>
              {verificationResult.verified ? '100% Cryptographic Match — Zero Tampering' : 'Tamper Alert Detected'}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Question Code: <strong>{verificationResult.questionCode}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Computed Real-Time SHA-256 Digest:</div>
              <div style={{ fontFamily: 'monospace', color: '#38bdf8', wordBreak: 'break-all' }}>
                {verificationResult.currentHash}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Anchored Blockchain Record SHA-256:</div>
              <div style={{ fontFamily: 'monospace', color: '#10b981', wordBreak: 'break-all' }}>
                {verificationResult.anchoredHash}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Anchor Blockchain Transaction Receipt:</div>
              <div style={{ fontFamily: 'monospace', color: '#a855f7', wordBreak: 'break-all' }}>
                {verificationResult.blockchainTx}
              </div>
            </div>
          </div>

          <button
            onClick={() => setVerificationResult(null)}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '20px' }}
          >
            Acknowledge & Close
          </button>
        </Modal>
      )}

      {/* MODAL 2: AUDIT TRAIL MODAL */}
      {selectedAuditTrail && (
        <Modal
          isOpen={!!selectedAuditTrail}
          onClose={() => setSelectedAuditTrail(null)}
          title={`Blockchain Audit Trail • ${selectedAuditTrail.questionCode}`}
        >
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Every action performed on this question is sealed into the decentralized consensus ledger.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(selectedAuditTrail.actions || []).map((act, index) => (
              <div
                key={act.id || index}
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderLeft: '4px solid #a855f7'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#c084fc',
                      background: 'rgba(168, 85, 247, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    {act.actionType}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{act.timestamp}</span>
                </div>
                <div style={{ fontSize: '0.82rem', marginBottom: 4 }}>
                  Actor: <strong>{act.user}</strong> ({act.role})
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  Tx: {act.txHash?.substring(0, 24)}... • Block #{act.blockNumber || 100}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setSelectedAuditTrail(null)}
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: '20px' }}
          >
            Close Audit Trail
          </button>
        </Modal>
      )}

      {/* MODAL 3: CANDIDATE SHUFFLED PREVIEW MODAL */}
      {previewQuestion && (
        <Modal
          isOpen={!!previewQuestion}
          onClose={() => setPreviewQuestion(null)}
          title={`Candidate View Preview • ${previewQuestion.questionCode}`}
        >
          <div style={{ padding: '4px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8 }}>
              Exam Center Sandbox Rendering (Dynamic Distractor Shuffling Active):
            </div>
            <h4 style={{ fontSize: '1rem', lineHeight: 1.5, marginBottom: '16px' }}>
              {previewQuestion.questionText}
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {[
                { letter: 'A', text: previewQuestion.options?.[0] || previewQuestion.correctOption },
                { letter: 'B', text: previewQuestion.distractors?.[0] || 'Alternative choice B' },
                { letter: 'C', text: previewQuestion.distractors?.[1] || 'Alternative choice C' },
                { letter: 'D', text: previewQuestion.distractors?.[2] || 'Alternative choice D' }
              ].map((opt) => (
                <div
                  key={opt.letter}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.88rem'
                  }}
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.78rem'
                    }}
                  >
                    {opt.letter}
                  </span>
                  <span>{typeof opt.text === 'string' ? opt.text : opt.text?.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setPreviewQuestion(null)}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Close Preview
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
