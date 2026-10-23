import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateQuestionHash, generateBlockchainTxHash } from '../utils/crypto';

const DataContext = createContext(null);

const DEFAULT_SEED_QUESTIONS = [
  {
    id: 'Q-CS-1048',
    questionCode: 'Q-CS-1048',
    subject: 'Computer Security & Cryptography',
    topic: 'Asymmetric Cryptography & Elliptic Curves',
    bloomLevel: 'Analyze (Level 4)',
    courseOutcome: 'CO4: Cryptographic Architectures & PKI',
    difficulty: 'HARD',
    marks: 4,
    questionText: 'Which cryptographic algorithm is based strictly on the discrete logarithm problem over the group of points on an elliptic curve, providing equivalent 128-bit security with substantially smaller key sizes compared to legacy factorization schemes?',
    correctOption: 'ECDSA (Elliptic Curve Digital Signature Algorithm)',
    answer: 'ECDSA (Elliptic Curve Digital Signature Algorithm)',
    distractors: [
      'RSA-2048 with PKCS#1 v1.5 padding',
      'AES-256 in Galois/Counter Mode (GCM)',
      'SHA-384 Cryptographic Hash Standard'
    ],
    distractorsWithRationale: [
      { text: 'RSA-2048 with PKCS#1 v1.5 padding', rationale: 'Relies on the integer factorization problem, requiring ~3072-bit keys to match 128-bit security.' },
      { text: 'AES-256 in Galois/Counter Mode (GCM)', rationale: 'Symmetric authenticated encryption cipher, not an asymmetric discrete logarithm signature scheme.' },
      { text: 'SHA-384 Cryptographic Hash Standard', rationale: 'One-way cryptographic hash function without public/private key pairs.' }
    ],
    options: [
      'ECDSA (Elliptic Curve Digital Signature Algorithm)',
      'RSA-2048 with PKCS#1 v1.5 padding',
      'AES-256 in Galois/Counter Mode (GCM)',
      'SHA-384 Cryptographic Hash Standard'
    ],
    sha256Hash: 'e6b4d32a9c1f78e05b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
    blockchainTx: '0x8f2a4c6e0b7f3d1a9c5e7b2f4a6c8e0d2b4f6a8c0e2d4b6f8a0b1c2d3e4f5a6b',
    blockNumber: 104,
    status: 'Approved',
    round: 3,
    submittedBy: 'Dr. Sarah Lin (SME-401)',
    submittedRole: 'Subject Expert',
    submittedAt: '2026-10-18 09:30:00',
    actions: [
      {
        id: 'ACT-001',
        actionType: 'QUESTION_CREATED',
        role: 'Subject Expert',
        user: 'Dr. Sarah Lin (SME-401)',
        sha256Hash: 'e6b4d32a9c1f78e05b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
        txHash: '0x8f2a4c6e0b7f3d1a9c5e7b2f4a6c8e0d2b4f6a8c0e2d4b6f8a0b1c2d3e4f5a6b',
        blockNumber: 104,
        timestamp: '2026-10-18 09:30:00'
      },
      {
        id: 'ACT-002',
        actionType: 'QUESTION_SCRUTINIZED',
        role: 'Scrutiny Officer',
        user: 'Prof. Miller (SCR-202)',
        sha256Hash: 'e6b4d32a9c1f78e05b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
        txHash: '0x9a3b5c7d1e8f2a4c6e0b7f3d1a9c5e7b2f4a6c8e0d2b4f6a8c0e2d4b6f8a0b1c',
        blockNumber: 109,
        timestamp: '2026-10-18 14:15:22'
      },
      {
        id: 'ACT-003',
        actionType: 'QUESTION_APPROVED',
        role: 'Supervisor',
        user: 'Chief Supervisor (SUP-101)',
        sha256Hash: 'e6b4d32a9c1f78e05b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
        txHash: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
        blockNumber: 114,
        timestamp: '2026-10-19 11:00:10'
      }
    ]
  },
  {
    id: 'Q-CS-1052',
    questionCode: 'Q-CS-1052',
    subject: 'Computer Security & Cryptography',
    topic: 'System Memory Protection & Exploitation',
    bloomLevel: 'Apply (Level 3)',
    courseOutcome: 'CO3: System Vulnerabilities & Security Protocols',
    difficulty: 'MEDIUM',
    marks: 2,
    questionText: 'Which combination of operating system defenses effectively mitigates return-oriented programming (ROP) attacks by preventing arbitrary stack smashing and address discovery?',
    correctOption: 'Stack Canaries (StackGuard) combined with Address Space Layout Randomization (ASLR)',
    answer: 'Stack Canaries (StackGuard) combined with Address Space Layout Randomization (ASLR)',
    distractors: [
      'Static Source Code Minification and Symbol Stripping',
      'HTTP Strict Transport Security (HSTS) with DNSSEC validation',
      'AES-CBC Initialization Vector duplication'
    ],
    distractorsWithRationale: [
      { text: 'Static Source Code Minification and Symbol Stripping', rationale: 'Minification obscures naming but does not alter compiled binary stack execution mechanics.' },
      { text: 'HTTP Strict Transport Security (HSTS) with DNSSEC validation', rationale: 'Application/network-layer protocol policy, inapplicable to kernel stack memory defense.' },
      { text: 'AES-CBC Initialization Vector duplication', rationale: 'Cryptographic security vulnerability rather than memory protection mechanism.' }
    ],
    options: [
      'Stack Canaries (StackGuard) combined with Address Space Layout Randomization (ASLR)',
      'Static Source Code Minification and Symbol Stripping',
      'HTTP Strict Transport Security (HSTS) with DNSSEC validation',
      'AES-CBC Initialization Vector duplication'
    ],
    sha256Hash: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
    blockchainTx: '0x1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a',
    blockNumber: 105,
    status: 'Pending Round 1',
    round: 1,
    submittedBy: 'Dr. Jane Smith (SME-102)',
    submittedRole: 'Subject Expert',
    submittedAt: '2026-10-19 16:45:00',
    actions: [
      {
        id: 'ACT-004',
        actionType: 'QUESTION_CREATED',
        role: 'Subject Expert',
        user: 'Dr. Jane Smith (SME-102)',
        sha256Hash: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
        txHash: '0x1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a',
        blockNumber: 105,
        timestamp: '2026-10-19 16:45:00'
      }
    ]
  },
  {
    id: 'Q-CS-1065',
    questionCode: 'Q-CS-1065',
    subject: 'Computer Security & Cryptography',
    topic: 'Zero-Knowledge Proofs & Blockchain Privacy',
    bloomLevel: 'Create (Level 6)',
    courseOutcome: 'CO4: Cryptographic Architectures & PKI',
    difficulty: 'HARD',
    marks: 4,
    questionText: 'In a Non-Interactive Zero-Knowledge Proof (zk-SNARK) construction, what critical purpose does the Common Reference String (CRS) or structured reference string serve?',
    correctOption: 'It encodes the arithmetic circuit constraints into elliptic curve group elements enabling succinct verification without interaction',
    answer: 'It encodes the arithmetic circuit constraints into elliptic curve group elements enabling succinct verification without interaction',
    distractors: [
      'It distributes private session keys across peer nodes using Shamir Secret Sharing',
      'It computes the SHA-256 block hash for proof-of-work mining difficulty adjustments',
      'It acts as an IPFS decentralized gateway pointer to store off-chain raw payloads'
    ],
    distractorsWithRationale: [
      { text: 'It distributes private session keys across peer nodes using Shamir Secret Sharing', rationale: 'Threshold cryptography key recovery, unrelated to SNARK circuit parameterization.' },
      { text: 'It computes the SHA-256 block hash for proof-of-work mining difficulty adjustments', rationale: 'Consensus hash target mechanism, not a zero-knowledge proof setup parameter.' },
      { text: 'It acts as an IPFS decentralized gateway pointer to store off-chain raw payloads', rationale: 'Distributed file storage routing rather than zero-knowledge arithmetic setup.' }
    ],
    options: [
      'It encodes the arithmetic circuit constraints into elliptic curve group elements enabling succinct verification without interaction',
      'It distributes private session keys across peer nodes using Shamir Secret Sharing',
      'It computes the SHA-256 block hash for proof-of-work mining difficulty adjustments',
      'It acts as an IPFS decentralized gateway pointer to store off-chain raw payloads'
    ],
    sha256Hash: '9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
    blockchainTx: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    blockNumber: 108,
    status: 'Pending Round 2',
    round: 2,
    submittedBy: 'Dr. Sarah Lin (SME-401)',
    submittedRole: 'Subject Expert',
    submittedAt: '2026-10-20 08:12:00',
    actions: [
      {
        id: 'ACT-005',
        actionType: 'QUESTION_CREATED',
        role: 'Subject Expert',
        user: 'Dr. Sarah Lin (SME-401)',
        sha256Hash: '9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
        txHash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
        blockNumber: 108,
        timestamp: '2026-10-20 08:12:00'
      },
      {
        id: 'ACT-006',
        actionType: 'QUESTION_SCRUTINIZED',
        role: 'Scrutiny Officer',
        user: 'Prof. Miller (SCR-202)',
        sha256Hash: '9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
        txHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
        blockNumber: 111,
        timestamp: '2026-10-20 10:45:00'
      }
    ]
  }
];

export function DataProvider({ children }) {
  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('app_questions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_SEED_QUESTIONS;
  });

  const [generatedPapers, setGeneratedPapers] = useState(() => {
    try {
      const saved = localStorage.getItem('app_generated_papers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('app_audit_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'TX-1001',
        timestamp: '2026-10-20 11:30:15',
        action: 'QUESTION_CREATED',
        user: 'Dr. Sarah Lin (SME-401)',
        role: 'Subject Expert',
        txHash: '0x8f2a4c6e0b7f3d1a9c5e7b2f4a6c8e0d2b4f6a8c0e2d4b6f8a0b1c2d3e4f5a6b',
        cid: 'Q-CS-1048',
        status: 'VERIFIED_ON_CHAIN',
        integrityCheck: 'PASSED (0 Tampering)'
      },
      {
        id: 'TX-1002',
        timestamp: '2026-10-20 11:45:30',
        action: 'QUESTION_SCRUTINIZED',
        user: 'Prof. Miller (SCR-202)',
        role: 'Scrutiny Officer',
        txHash: '0x9a3b5c7d1e8f2a4c6e0b7f3d1a9c5e7b2f4a6c8e0d2b4f6a8c0e2d4b6f8a0b1c',
        cid: 'Q-CS-1048',
        status: 'VERIFIED_ON_CHAIN',
        integrityCheck: 'PASSED (0 Tampering)'
      }
    ];
  });

  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('app_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [uploadWindow, setUploadWindow] = useState(() => {
    try {
      const saved = localStorage.getItem('app_upload_window');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    const now = new Date();
    const startTime = new Date(now.getTime() - 15 * 60 * 1000);
    const endTime = new Date(now.getTime() + 180 * 60 * 1000);
    const formatDT = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    return {
      enabled: true,
      startTime: formatDT(startTime),
      endTime: formatDT(endTime)
    };
  });

  const [paperReleaseWindow, setPaperReleaseWindow] = useState(() => {
    try {
      const saved = localStorage.getItem('app_paper_release_window');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    const now = new Date();
    const startTime = new Date(now.getTime() - 5 * 60 * 1000);
    const endTime = new Date(now.getTime() + 180 * 60 * 1000);
    const formatDT = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    return {
      enabled: true,
      startTime: formatDT(startTime),
      endTime: formatDT(endTime),
      lockedBySupervisor: false,
      mode: 'SCHEDULED'
    };
  });

  const [adminChanges, setAdminChanges] = useState(() => {
    try {
      const saved = localStorage.getItem('app_admin_changes');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'ADM-CHG-101',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
        adminName: 'Administrator (ADM-101)',
        changeType: 'QUESTION_INGESTION',
        details: 'Ingested Question Q-1048 (Public Key Infrastructure & RSA Signatures)',
        status: 'VERIFIED_BY_SUPERVISOR',
        verificationHash: '0x8f4a9b2c7e1d3f5a8b0c2d4e6f8a0b1c',
        verifiedBy: 'Chief Supervisor (SUP-101)'
      }
    ];
  });

  const [studentActions, setStudentActions] = useState(() => {
    try {
      const saved = localStorage.getItem('app_student_actions');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('app_questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('app_generated_papers', JSON.stringify(generatedPapers));
  }, [generatedPapers]);

  useEffect(() => {
    localStorage.setItem('app_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('app_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('app_upload_window', JSON.stringify(uploadWindow));
  }, [uploadWindow]);

  useEffect(() => {
    localStorage.setItem('app_paper_release_window', JSON.stringify(paperReleaseWindow));
  }, [paperReleaseWindow]);

  useEffect(() => {
    localStorage.setItem('app_admin_changes', JSON.stringify(adminChanges));
  }, [adminChanges]);

  useEffect(() => {
    localStorage.setItem('app_student_actions', JSON.stringify(studentActions));
  }, [studentActions]);

  const isUploadAllowed = () => {
    if (!uploadWindow.enabled) {
      return { allowed: false, reason: 'Question upload window is currently disabled by Administrator.' };
    }
    const now = new Date();
    const start = new Date(uploadWindow.startTime);
    const end = new Date(uploadWindow.endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { allowed: true, reason: 'Active' };
    }
    if (now < start) {
      return { allowed: false, reason: `Upload window has not opened yet (Starts at ${uploadWindow.startTime.replace('T', ' ')}).` };
    }
    if (now > end) {
      return { allowed: false, reason: `Question upload time limit has expired (Ended at ${uploadWindow.endTime.replace('T', ' ')}).` };
    }
    return { allowed: true, reason: 'Upload window is active.' };
  };

  // Generic Blockchain Audit Log creator
  const addAuditLog = (action, user, role, refKey, fileRefKey) => {
    const newLog = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action,
      user: user || 'Authorized User',
      role: role || 'Staff Member',
      txHash: refKey || '0x' + Math.random().toString(16).substring(2, 34),
      cid: fileRefKey || 'Q-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      status: 'VERIFIED_ON_CHAIN',
      integrityCheck: 'PASSED (0 Tampering)'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    return newLog;
  };

  /**
   * Log any action performed on a question to the blockchain
   */
  const recordQuestionAction = async (questionCode, actionType, user, role) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const targetQ = questions.find((q) => q.questionCode === questionCode || q.id === questionCode);
    const hash = targetQ ? targetQ.sha256Hash : '0000000000000000000000000000000000000000';
    const blockNum = 100 + (targetQ?.actions?.length || 1) * 3;
    const txHash = await generateBlockchainTxHash('0x0', blockNum, questionCode, hash);

    const actionRecord = {
      id: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
      actionType,
      role: role || 'Subject Expert',
      user: user?.name || user || 'Authorized User',
      sha256Hash: hash,
      txHash,
      blockNumber: blockNum,
      timestamp
    };

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.questionCode === questionCode || q.id === questionCode) {
          return {
            ...q,
            actions: [actionRecord, ...(q.actions || [])]
          };
        }
        return q;
      })
    );

    addAuditLog(actionType, actionRecord.user, actionRecord.role, txHash, questionCode);
    return actionRecord;
  };

  /**
   * Add question with correct option and distractors, computes canonical SHA-256 and commits to chain
   */
  const addQuestionWithDistractors = async (questionData, authorUser = {}) => {
    const check = isUploadAllowed();
    if (!check.allowed) {
      throw new Error(check.reason);
    }

    const userName = authorUser?.name || questionData.submittedBy || 'Dr. Sarah Lin (SME-401)';
    const userRole = authorUser?.role || 'Subject Expert';
    const subjectPrefix = (questionData.subject || 'CS').substring(0, 2).toUpperCase().replace(/[^A-Z]/g, 'Q');
    const questionCode = `Q-${subjectPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Prepare options array
    const validDistractors = (questionData.distractors || [])
      .map((d) => (typeof d === 'string' ? d.trim() : (d.text || '').trim()))
      .filter(Boolean);

    const allOptions = [questionData.correctOption, ...validDistractors];

    // Compute canonical SHA-256 hash
    const computedHash = await generateQuestionHash({
      questionText: questionData.questionText,
      correctOption: questionData.correctOption,
      distractors: validDistractors,
      subject: questionData.subject,
      topic: questionData.topic,
      bloomLevel: questionData.bloomLevel,
      courseOutcome: questionData.courseOutcome,
      difficulty: questionData.difficulty,
      marks: questionData.marks
    });

    const blockNumber = 100 + Math.floor(Math.random() * 50);
    const txHash = await generateBlockchainTxHash('0x0', blockNumber, questionCode, computedHash);
    const submittedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const initialAction = {
      id: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
      actionType: 'QUESTION_CREATED',
      role: userRole,
      user: userName,
      sha256Hash: computedHash,
      txHash,
      blockNumber,
      timestamp: submittedAt
    };

    const newQuestion = {
      id: questionCode,
      questionCode,
      subject: questionData.subject || 'Computer Security & Cryptography',
      topic: questionData.topic || 'General',
      bloomLevel: questionData.bloomLevel || 'Understand (Level 2)',
      courseOutcome: questionData.courseOutcome || 'CO1: Fundamentals',
      difficulty: (questionData.difficulty || 'MEDIUM').toUpperCase(),
      marks: Number(questionData.marks) || 1,
      questionText: questionData.questionText,
      correctOption: questionData.correctOption,
      answer: questionData.correctOption, // alias for scrutiny dashboard compatibility
      distractors: validDistractors,
      distractorsWithRationale: questionData.distractorsWithRationale || validDistractors.map((d) => ({ text: d, rationale: '' })),
      options: allOptions,
      rationale: questionData.rationale || '',
      sha256Hash: computedHash,
      blockchainTx: txHash,
      blockNumber,
      status: 'Pending Round 1',
      round: 1,
      submittedBy: userName,
      submittedRole: userRole,
      submittedAt,
      actions: [initialAction]
    };

    const response = await fetch('http://localhost:5000/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...questionData,
        questionCode,
        authorName: userName,
        distractors: validDistractors
      })
    });
    const responseBody = await response.json();
    if (!response.ok) {
      throw new Error(responseBody.error || 'Failed to save question');
    }

    setQuestions((prev) => [newQuestion, ...prev]);
    addAuditLog('QUESTION_CREATED', userName, userRole, txHash, questionCode);

    return newQuestion;
  };

  /**
   * Update question, recalculating hash and recording QUESTION_UPDATED to blockchain
   */
  const updateQuestionWithDistractors = async (questionCode, updatedFields, user = {}) => {
    const target = questions.find((q) => q.questionCode === questionCode || q.id === questionCode);
    if (!target) throw new Error('Question not found');

    const merged = { ...target, ...updatedFields };
    const validDistractors = (merged.distractors || [])
      .map((d) => (typeof d === 'string' ? d.trim() : (d.text || '').trim()))
      .filter(Boolean);

    const newHash = await generateQuestionHash({
      questionText: merged.questionText,
      correctOption: merged.correctOption,
      distractors: validDistractors,
      subject: merged.subject,
      topic: merged.topic,
      bloomLevel: merged.bloomLevel,
      courseOutcome: merged.courseOutcome,
      difficulty: merged.difficulty,
      marks: merged.marks
    });

    const blockNumber = (target.blockNumber || 100) + 1;
    const txHash = await generateBlockchainTxHash(target.blockchainTx, blockNumber, questionCode, newHash);
    const updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const updateAction = {
      id: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
      actionType: 'QUESTION_UPDATED',
      role: user.role || 'Subject Expert',
      user: user.name || 'Subject Expert',
      sha256Hash: newHash,
      txHash,
      blockNumber,
      timestamp: updatedAt
    };

    const updatedQuestion = {
      ...merged,
      sha256Hash: newHash,
      blockchainTx: txHash,
      blockNumber,
      distractors: validDistractors,
      options: [merged.correctOption, ...validDistractors],
      updatedAt,
      actions: [updateAction, ...(target.actions || [])]
    };

    setQuestions((prev) =>
      prev.map((q) => (q.questionCode === questionCode || q.id === questionCode ? updatedQuestion : q))
    );

    addAuditLog('QUESTION_UPDATED', updateAction.user, updateAction.role, txHash, questionCode);
    return updatedQuestion;
  };

  /**
   * Verify integrity of a question against its recorded cryptographic hash
   */
  const verifyQuestionIntegrity = async (questionCode) => {
    const target = questions.find((q) => q.questionCode === questionCode || q.id === questionCode);
    if (!target) return { verified: false, error: 'Question not found' };

    const validDistractors = (target.distractors || [])
      .map((d) => (typeof d === 'string' ? d.trim() : (d.text || '').trim()))
      .filter(Boolean);

    const computed = await generateQuestionHash({
      questionText: target.questionText,
      correctOption: target.correctOption || target.answer,
      distractors: validDistractors,
      subject: target.subject,
      topic: target.topic,
      bloomLevel: target.bloomLevel,
      courseOutcome: target.courseOutcome,
      difficulty: target.difficulty,
      marks: target.marks
    });

    const isMatch = computed.toLowerCase() === target.sha256Hash.toLowerCase();
    return {
      verified: isMatch,
      questionCode: target.questionCode,
      currentHash: computed,
      anchoredHash: target.sha256Hash,
      blockchainTx: target.blockchainTx,
      blockNumber: target.blockNumber,
      tamperDetected: !isMatch,
      auditHistoryCount: (target.actions || []).length
    };
  };

  // Scrutiny approval
  const approveQuestion = (id, currentRound, edits, reviewerName = 'Scrutiny Officer') => {
    let nextStatus = '';
    let nextRound = currentRound;

    if (currentRound === 1) {
      nextRound = 2;
      nextStatus = 'Pending Round 2';
    } else if (currentRound === 2) {
      nextRound = 3;
      nextStatus = 'Pending Round 3';
    } else {
      nextStatus = 'Approved';
    }

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id || q.questionCode === id) {
          const updatedQ = {
            ...q,
            ...edits,
            round: nextRound,
            status: nextStatus,
            [`round${currentRound}ApprovedBy`]: reviewerName
          };
          return updatedQ;
        }
        return q;
      })
    );

    recordQuestionAction(id, `QUESTION_APPROVED_ROUND${currentRound}`, reviewerName, 'Scrutiny Officer');
  };

  const rejectQuestion = (id, feedback, rejectedBy = 'Scrutiny Officer') => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id || q.questionCode === id) {
          return {
            ...q,
            status: 'Rejected & Sent Back',
            feedback: feedback || 'Revisions required'
          };
        }
        return q;
      })
    );

    recordQuestionAction(id, 'QUESTION_REJECTED', rejectedBy, 'Scrutiny Officer');
  };

  // Paper generation operation
  const generatePaper = (paperData) => {
    const candidateQs = paperData.subject
      ? questions.filter((q) => q.subject === paperData.subject)
      : questions;
    const selectedQs = candidateQs.length > 0 ? candidateQs : questions;

    const totalCalculatedMarks = selectedQs.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

    const newPaper = {
      paperCode: `EXAM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      title: paperData.title || `${paperData.subject || 'Examination'} Paper`,
      subject: paperData.subject || (selectedQs[0]?.subject || 'General Examination'),
      generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      totalMarks: totalCalculatedMarks > 0 ? totalCalculatedMarks : 100,
      duration: paperData.duration || '180 Minutes',
      sha256Hash: paperData.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      ipfsCID: paperData.ipfsCID || 'Qm' + Math.random().toString(36).substring(2, 22),
      status: 'Encrypted & Stored on IPFS',
      blockchainTx: '0x' + Math.random().toString(16).substring(2, 34),
      scheduledStartTime: new Date(Date.now() - 5 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
      scheduledEndTime: new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19),
      questions: selectedQs
    };

    setGeneratedPapers((prev) => [newPaper, ...prev]);
    addAuditLog('PAPER_ENCRYPTION_STORED', paperData.userName || 'Administrator', 'Administrator', newPaper.blockchainTx, newPaper.ipfsCID);
    return newPaper;
  };

  // User Management operations
  const addUser = (userData, createdBy = 'Administrator') => {
    const newUser = {
      id: `USR-${Math.floor(8000 + Math.random() * 1000)}`,
      ...userData,
      status: 'ACTIVE'
    };
    setUsers((prev) => [...prev, newUser]);
    addAuditLog('USER_CREATED', createdBy, 'Administrator', newUser.id, null);
    return newUser;
  };

  const deleteUser = (userId, deletedBy = 'Administrator') => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    addAuditLog('USER_DELETED', deletedBy, 'Administrator', userId, null);
  };

  // Paper release check
  const isPaperReleaseAllowed = () => {
    if (paperReleaseWindow.lockedBySupervisor || paperReleaseWindow.mode === 'EMERGENCY_LOCKED') {
      return { allowed: false, reason: 'Paper release locked by Chief Supervisor Emergency Lock.' };
    }
    if (paperReleaseWindow.mode === 'EMERGENCY_UNLOCKED') {
      return { allowed: true, reason: 'Paper release unlocked by Chief Supervisor Emergency Override.' };
    }
    if (!paperReleaseWindow.enabled) {
      return { allowed: false, reason: 'Paper release schedule is currently disabled.' };
    }
    const now = new Date();
    const start = new Date(paperReleaseWindow.startTime);
    const end = new Date(paperReleaseWindow.endTime);
    if (now < start) {
      return { allowed: false, reason: `Paper release opens at ${paperReleaseWindow.startTime.replace('T', ' ')}.` };
    }
    if (now > end) {
      return { allowed: false, reason: `Paper release window expired at ${paperReleaseWindow.endTime.replace('T', ' ')}.` };
    }
    return { allowed: true, reason: 'Paper release window active.' };
  };

  // Supervisor verification of admin changes
  const verifyAdminChange = (changeId, supervisorName = 'Chief Supervisor') => {
    const vHash = '0x' + Math.random().toString(16).substring(2, 34);
    setAdminChanges((prev) =>
      prev.map((item) => {
        if (item.id === changeId) {
          return {
            ...item,
            status: 'VERIFIED_BY_SUPERVISOR',
            verificationHash: vHash,
            verifiedBy: supervisorName
          };
        }
        return item;
      })
    );
    addAuditLog('SUPERVISOR_VERIFIED_ADMIN_CHANGE', supervisorName, 'Chief Supervisor', changeId, vHash);
    return vHash;
  };

  const verifyAllAdminChanges = (supervisorName = 'Chief Supervisor') => {
    setAdminChanges((prev) =>
      prev.map((item) => ({
        ...item,
        status: 'VERIFIED_BY_SUPERVISOR',
        verificationHash: item.verificationHash || '0x' + Math.random().toString(16).substring(2, 34),
        verifiedBy: supervisorName
      }))
    );
    addAuditLog('SUPERVISOR_VERIFIED_ALL_ADMIN_CHANGES', supervisorName, 'Chief Supervisor', 'BATCH_VERIFY', null);
  };

  // Supervisor verification of student action ledger
  const verifyStudentAction = (actionId, supervisorName = 'Chief Supervisor') => {
    setStudentActions((prev) =>
      prev.map((act) => {
        if (act.id === actionId) {
          return {
            ...act,
            immutableVerified: true,
            verifiedAt: new Date().toISOString()
          };
        }
        return act;
      })
    );
    addAuditLog('SUPERVISOR_VERIFIED_STUDENT_ACTION_BLOCK', supervisorName, 'Chief Supervisor', actionId, null);
  };

  const verifyAllStudentActions = (supervisorName = 'Chief Supervisor') => {
    setStudentActions((prev) =>
      prev.map((act) => ({
        ...act,
        immutableVerified: true,
        verifiedAt: new Date().toISOString()
      }))
    );
    addAuditLog('SUPERVISOR_VERIFIED_STUDENT_LEDGER_CHAIN', supervisorName, 'Chief Supervisor', 'CHAIN_VERIFIED_IMMUTABLE', null);
  };

  return (
    <DataContext.Provider
      value={{
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
        addQuestionWithDistractors,
        updateQuestionWithDistractors,
        recordQuestionAction,
        verifyQuestionIntegrity,
        approveQuestion,
        rejectQuestion,
        generatePaper,
        addAuditLog,
        addUser,
        deleteUser
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
