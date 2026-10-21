import React, { useState } from 'react';
import { Lock, KeyRound, Mail, UserCheck, ArrowRight } from 'lucide-react';
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

    const extraData = {};
    if (role === 'Center') {
      extraData.centerId = 'CEN-101';
      extraData.name = 'Exam Center (CEN-101)';
    } else if (role === 'Supervisor') {
      extraData.supervisorId = 'ADM-101';
      extraData.name = 'Admin Authority (ADM-101)';
    } else if (role === 'Admin') {
      extraData.adminId = 'STA-101';
      extraData.name = 'Staff Member (STA-101)';
    }

    login(role, email, extraData);
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
          maxWidth: '440px',
          padding: '36px',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          background: 'rgba(15, 23, 42, 0.85)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              marginBottom: '12px',
              boxShadow: '0 0 20px rgba(220, 38, 38, 0.4)'
            }}
          >
            <Lock size={26} />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            SecurExam
          </h1>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)', margin: 0 }}>
            Login
          </h2>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(220, 38, 38, 0.2)',
              border: '1px solid #ef4444',
              color: '#ffffff',
              padding: '10px 14px',
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
              <span>Role</span>
            </label>
            <select className="form-select" value={role} onChange={handleRoleChange} style={{ fontWeight: 600 }}>
              <option value="Supervisor">Admin Authority (ADM)</option>
              <option value="Admin">Staff Member (STA)</option>
              <option value="Center">Examination Center (CEN)</option>
              <option value="Scrutiny Officer">Scrutiny Officer</option>
              <option value="Auditor">Auditor</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} />
              <span>Email</span>
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              placeholder="Password"
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
            <span>Sign In</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
