import React, { useState } from 'react';
import { Shield, KeyRound, ArrowRight, ShieldAlert, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PublicLogin() {
  const { login } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanId = userId.trim().toUpperCase();
    if (!cleanId || !password.trim()) {
      setError('Please enter a valid User ID and Password.');
      return;
    }

    // Keyword-based routing determination
    if (cleanId.includes('SUP') || cleanId.includes('AUTH') || cleanId.includes('SUPERVISOR')) {
      setError('');
      login('Supervisor', `${cleanId.toLowerCase()}@authority.gov.in`, {
        name: `Chief Supervisor (${cleanId})`,
        supervisorId: cleanId
      });
    } else if (cleanId.includes('ADM') || cleanId.startsWith('ADMIN')) {
      setError('');
      login('Admin', `${cleanId.toLowerCase()}@authority.gov.in`, {
        name: `Administrator (${cleanId})`,
        adminId: cleanId
      });
    } else if (cleanId.includes('STD') || cleanId.startsWith('ROLL') || cleanId.startsWith('STUDENT')) {
      setError('');
      login('Student', `${cleanId.toLowerCase()}@student.gov.in`, {
        name: `Candidate (${cleanId})`,
        rollNumber: cleanId,
        subject: 'Computer Security & Cryptography'
      });
    } else if (cleanId.includes('CTR') || cleanId.includes('CENTER')) {
      setError('');
      login('Center', `${cleanId.toLowerCase()}@exam-centers.gov.in`, {
        name: `Exam Center ${cleanId}`,
        centerId: cleanId
      });
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
      setError('Unrecognized ID prefix. Include SUP- for Supervisor, ADM- for Admin, or STD- for Student.');
    }
  };

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
          maxWidth: '460px',
          padding: '36px',
          border: '1px solid rgba(0, 120, 212, 0.25)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0078d4 0%, #0284c7 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              marginBottom: '16px',
              boxShadow: '0 0 20px rgba(0, 120, 212, 0.4)'
            }}
          >
            <Shield size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>Secure Portal Gateway</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Enter ID (<strong>SUP-</strong> Chief Supervisor, <strong>ADM-</strong> Admin, <strong>STD-</strong> Student)
          </p>
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
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={14} />
              <span>User / Identification ID</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. SUP-101, ADM-101, STD-2026-001"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={14} />
              <span>Password</span>
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
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
            <span>Sign In to Portal</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          System Status: Operational • Automatic Role Routing Active
        </div>
      </div>
    </div>
  );
}
