import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('app_questions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
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
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
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
    const startTime = new Date(now.getTime() - 5 * 60 * 1000);
    const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
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
        status: 'PENDING_VERIFICATION',
        verificationHash: null,
        verifiedBy: null
      },
      {
        id: 'ADM-CHG-102',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
        adminName: 'Administrator (ADM-101)',
        changeType: 'PAPER_GENERATION',
        details: 'Generated Exam Paper EXAM-2026-MAIN with AES-256 Encryption Payload',
        status: 'VERIFIED_BY_SUPERVISOR',
        verificationHash: '0x8f4a9b2c7e1d3f5a8b0c2d4e6f8a0b1c',
        verifiedBy: 'Chief Supervisor (SUP-101)'
      },
      {
        id: 'ADM-CHG-103',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
        adminName: 'Administrator (ADM-101)',
        changeType: 'USER_MANAGEMENT',
        details: 'Created User Account USR-8412: Scrutiny Officer (Level 2 Clearance)',
        status: 'PENDING_VERIFICATION',
        verificationHash: null,
        verifiedBy: null
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
    return [
      {
        id: 'STD-ACT-501',
        rollNumber: 'STD-2026-001',
        studentName: 'Candidate Candidate-01',
        actionType: 'SESSION_START',
        details: 'Biometric & Key Token Authenticated at Exam Center CTR-104-B',
        timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
        blockIndex: 101,
        prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
        actionHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        immutableVerified: true,
        proctorAlert: false
      },
      {
        id: 'STD-ACT-502',
        rollNumber: 'STD-2026-001',
        studentName: 'Candidate Candidate-01',
        actionType: 'PAPER_DECRYPT_REQUEST',
        details: 'Requested AES-256 decryption key for EXAM-2026-MAIN',
        timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
        blockIndex: 102,
        prevHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        actionHash: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
        immutableVerified: true,
        proctorAlert: false
      },
      {
        id: 'STD-ACT-503',
        rollNumber: 'STD-2026-001',
        studentName: 'Candidate Candidate-01',
        actionType: 'SANDBOX_PROCTOR_HEARTBEAT',
        details: 'Lockdown Browser active. Zero window defocus or tab switches.',
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
        blockIndex: 103,
        prevHash: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
        actionHash: 'b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
        immutableVerified: false,
        proctorAlert: false
      },
      {
        id: 'STD-ACT-504',
        rollNumber: 'STD-2026-002',
        studentName: 'Candidate Candidate-02',
        actionType: 'RESPONSE_SUBMISSION',
        details: 'Encrypted Answer Payload Submitted (Sections A, B, C)',
        timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
        blockIndex: 104,
        prevHash: 'b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
        actionHash: 'c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0',
        immutableVerified: false,
        proctorAlert: false
      }
    ];
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

  // Log creation helper
  const addAuditLog = (action, user, role, refKey, fileRefKey) => {
    const newLog = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action,
      user: user || 'Authorized User',
      role: role || 'Staff Member',
      txHash: refKey || '0x' + Math.random().toString(16).substring(2, 34),
      cid: fileRefKey || 'Qm' + Math.random().toString(36).substring(2, 20),
      status: 'VERIFIED_ON_CHAIN',
      integrityCheck: 'PASSED (0 Tampering)'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    return newLog;
  };

  // Question operations
  const addQuestion = (questionData, author = 'Authorized Staff') => {
    const check = isUploadAllowed();
    if (!check.allowed) {
      throw new Error(check.reason);
    }

    const newQ = {
      id: `Q-${Math.floor(1000 + Math.random() * 9000)}`,
      ...questionData,
      round: 1,
      status: 'Pending Round 1',
      submittedBy: questionData.submittedBy || author,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setQuestions((prev) => [newQ, ...prev]);
    addAuditLog('QUESTION_SUBMITTED_SCRUTINY', newQ.submittedBy, 'Question Author', newQ.id, null);
    return newQ;
  };

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
        if (q.id === id) {
          return {
            ...q,
            ...edits,
            round: nextRound,
            status: nextStatus,
            [`round${currentRound}ApprovedBy`]: reviewerName
          };
        }
        return q;
      })
    );

    addAuditLog(`QUESTION_APPROVED_ROUND${currentRound}`, reviewerName, 'Scrutiny Officer', id, null);
  };

  const rejectQuestion = (id, feedback, rejectedBy = 'Scrutiny Officer') => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          return {
            ...q,
            status: 'Rejected & Sent Back',
            feedback: feedback || 'Revisions required'
          };
        }
        return q;
      })
    );

    addAuditLog('QUESTION_REJECTED', rejectedBy, 'Scrutiny Officer', id, null);
  };

  // Paper generation operation
  const generatePaper = (paperData) => {
    const approvedQs = questions.filter((q) => q.status === 'Approved');
    const selectedQs = paperData.subject
      ? approvedQs.filter((q) => q.subject === paperData.subject)
      : approvedQs;

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
        addQuestion,
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
