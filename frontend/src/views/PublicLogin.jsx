import React, { useState } from 'react';
import { Shield, KeyRound, ArrowRight, ShieldAlert, UserCheck, BookOpen, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PublicLogin() {
  const { login } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRoleSelect = (roleId, pass = 'secure123') => {
    setUserId(roleId);
    setPassword(pass);
    setError('');
  };

  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    const cleanId = userId.trim().toUpperCase();
    if (!cleanId || !password.trim()) {
      setError('Please enter a valid User ID and Password.');
      return;
    }

    // Role Categorization
    if (cleanId.includes('EXP') || cleanId.includes('SME') || cleanId.includes('EXPERT')) {
      setError('');
      login('Subject Expert', `${cleanId.toLowerCase()}@faculty.exam.gov.in`, {
        name: `Dr. Sarah Lin (${cleanId})`,
        expertId: cleanId,
        specialization: 'Computer Systems & Applied Cryptography'
      });
    } else if (cleanId.includes('ADM') || cleanId.includes('ADMIN') || cleanId.includes('SUP') || cleanId.includes('SUPERVISOR')) {
      setError('');
      login('Supervisor', `${cleanId.toLowerCase()}@authority.gov.in`, {
        name: `Admin Authority (${cleanId})`,
        supervisorId: cleanId
      });
    } else if (cleanId.includes('STA') || cleanId.includes('STF') || cleanId.includes('STAFF')) {
      setError('');
      login('Admin', `${cleanId.toLowerCase()}@authority.gov.in`, {
        name: `Staff Member (${cleanId})`,
        adminId: cleanId
      });
    } else if (cleanId.includes('CEN') || cleanId.includes('CTR') || cleanId.includes('CENTER')) {
      setError('');
      login('Center', `${cleanId.toLowerCase()}@exam-centers.gov.in`, {
        name: `Exam Center (${cleanId})`,
        centerId: cleanId
      });
    } else if (cleanId.includes('STD') || cleanId.startsWith('ROLL') || cleanId.startsWith('STUDENT')) {
      setError('Student logins must be accessed through an Authorized Examination Center.');
    } else if (cleanId.includes('SCR') || cleanId.includes('SCRUTINY')) {
      setError('');
      login('Scrutiny Officer', `${cleanId.toLowerCase()}@authority.gov.in`, {
        name: `Scrutiny Officer (${cleanId})`
      });
    } else if (cleanId.includes('AUD') || cleanId.includes('AUDITOR')) {
      setError('');
      login('Auditor', `${cleanId.toLowerCase()}@authority.gov.in`, {
        name: `Auditor (${cleanId})`
      });
    } else {
      setError('Invalid User ID or Password.');
    }
  };

  // 1. PUBLIC LOGIN
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '36px',
          border: '1px solid rgba(0, 120, 212, 0.25)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0078d4 0%, #7c3aed 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              marginBottom: '12px',
              boxShadow: '0 0 20px rgba(124, 58, 237, 0.35)'
            }}
          >
            <Shield size={26} />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            SecurExam
          </h1>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)', margin: 0 }}>
            Gateway Authentication
          </h2>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(220, 38, 38, 0.12)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              color: '#f87171',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCredentialsSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={14} />
              <span>User ID</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. EXP-101, SUP-101, ADM-101"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={14} />
              <span>Password</span>
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
          >
            <span>Authenticate & Access Dashboard</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Selector */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={12} style={{ color: '#a855f7' }} />
            <span>Quick Demo Role Credentials:</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleRoleSelect('EXP-101')}
              className="badge"
              style={{
                cursor: 'pointer',
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                padding: '5px 9px',
                fontSize: '0.74rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <BookOpen size={12} />
              <strong>EXP-101</strong> (Subject Expert)
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('SUP-101')}
              className="badge"
              style={{
                cursor: 'pointer',
                background: 'rgba(244, 63, 94, 0.15)',
                color: '#fb7185',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                padding: '5px 9px',
                fontSize: '0.74rem'
              }}
            >
              <strong>SUP-101</strong> (Supervisor)
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('ADM-101')}
              className="badge"
              style={{
                cursor: 'pointer',
                background: 'rgba(2, 132, 199, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(2, 132, 199, 0.3)',
                padding: '5px 9px',
                fontSize: '0.74rem'
              }}
            >
              <strong>ADM-101</strong> (Admin)
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('AUD-101')}
              className="badge"
              style={{
                cursor: 'pointer',
                background: 'rgba(124, 58, 237, 0.15)',
                color: '#a78bfa',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                padding: '5px 9px',
                fontSize: '0.74rem'
              }}
            >
              <strong>AUD-101</strong> (Auditor)
            </button>
          </div>
        </div>

        <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
          System Security: SHA-256 Hashing • Blockchain Anchoring • Zero-Knowledge Readiness
        </div>
      </div>
    </div>
  );
}
