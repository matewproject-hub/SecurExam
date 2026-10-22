import React from 'react';
import { Shield, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout, theme, toggleTheme } = useAuth();

  const getRoleBadge = (userObj) => {
    if (!userObj) return null;
    switch (userObj.role) {
      case 'Supervisor':
        return { label: 'Admin (Authority)', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' };
      case 'Admin':
        return { label: 'Staff', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' };
      case 'Scrutiny Officer':
        return { label: 'Scrutiny Officer', color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' };
      case 'Auditor':
        return { label: 'Auditor', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)' };
      case 'Center':
        return { label: userObj.centerId || 'Exam Center', color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' };
      case 'Student':
        return { label: `Student (${userObj.rollNumber || 'Candidate'})`, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      default:
        return { label: 'Public Portal', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' };
    }
  };

  const badge = getRoleBadge(user);

  return (
    <header className="main-header">
      <div className="brand-title-group">
        <div className="emblem-icon">
          <Shield size={18} />
        </div>
        <div className="brand-text-title">Secure Examination Portal</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={15} style={{ color: '#f59e0b' }} /> : <Moon size={15} style={{ color: '#0284c7' }} />}
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 9px',
                borderRadius: '4px',
                background: badge.bg,
                color: badge.color,
                fontWeight: 600
              }}
            >
              {badge.label}
            </span>
            <button
              onClick={logout}
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.76rem' }}
              title="Sign Out"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
