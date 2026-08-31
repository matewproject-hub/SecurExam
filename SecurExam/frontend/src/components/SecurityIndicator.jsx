import React from 'react';
import { ShieldCheck, Database, Link2, CheckCircle2 } from 'lucide-react';

export default function SecurityIndicator() {
  return (
    <div className="security-banner">
      <div className="security-indicators-group">
        <div className="security-badge-item">
          <span className="pulse-dot"></span>
          <ShieldCheck size={13} />
          <span>Security Protocol Active</span>
        </div>
        <div className="security-badge-item">
          <CheckCircle2 size={13} />
          <span>Data Integrity Verified</span>
        </div>
        <div className="security-badge-item">
          <Database size={13} />
          <span>Secure Server Node Connected</span>
        </div>
        <div className="security-badge-item">
          <Link2 size={13} />
          <span>Audit Log Synchronized</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>GOVERNMENT EXAMINATION AUTHORITY - CONFIDENTIAL PORTAL</span>
        <span style={{ color: '#10b981', fontWeight: 600 }}>SYSTEM STATUS: OPTIMAL</span>
      </div>
    </div>
  );
}
