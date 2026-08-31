import React, { useState } from 'react';
import { Lock, KeyRound, Mail, UserCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SecureLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [error, setError] = useState('');

  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide valid credentials.');
      return;
    }
    login(role, email);
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '36px',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          background: 'rgba(15, 23, 42, 0.85)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              marginBottom: '14px',
              boxShadow: '0 0 20px rgba(220, 38, 38, 0.4)'
            }}
          >
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '4px' }}>
            Authority Staff Access Gateway
          </h2>
          <div
            style={{
              fontSize: '0.72rem',
              color: '#ef4444',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontWeight: 700
            }}
          >
            HIGH-SECURITY AUTHORIZED PORTAL ONLY
          </div>
        </div>

        {/* RESTRICTED WARNING BANNER */}
        <div
          style={{
            background: 'rgba(220, 38, 38, 0.12)',
            border: '1px solid rgba(220, 38, 38, 0.4)',
            borderRadius: '8px',
            padding: '12px 14px',
            fontSize: '0.78rem',
            color: '#fca5a5',
            marginBottom: '24px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start'
          }}
        >
          <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#ffffff', display: 'block', marginBottom: '2px' }}>
              RESTRICTED GOVERNMENT PORTAL
            </strong>
            This area is strictly reserved for authorized examination staff. All unauthorized login attempts are logged with client IP address, device fingerprints, and submitted to cyber security auditing.
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(220, 38, 38, 0.2)',
              border: '1px solid #ef4444',
              color: '#ffffff',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              marginBottom: '16px'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={14} />
              <span>Select Authorized Staff Role</span>
            </label>
            <select className="form-select" value={role} onChange={handleRoleChange} style={{ fontWeight: 600 }}>
              <option value="Supervisor">Chief Supervisor (Authority)</option>
              <option value="Admin">Administrator</option>
              <option value="Scrutiny Officer">Scrutiny Officer</option>
              <option value="Auditor">Auditor</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} />
              <span>Official Government Email</span>
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. officer@authority.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={14} />
              <span>Secure Authentication Password</span>
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
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '0.95rem',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
            }}
          >
            <span>Authenticate & Access Console</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
          Session Monitoring: Active • Official Staff Portal
        </div>
      </div>
    </div>
  );
}
