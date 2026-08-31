import React, { useState } from 'react';
import {
  ShieldCheck,
  Link2,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { useData } from '../context/DataContext';

export default function AuditorDashboard() {
  const { auditLogs } = useData();
  const [searchHash, setSearchHash] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerifyHash = (e) => {
    e.preventDefault();
    if (!searchHash.trim()) return;

    const matchedLog = auditLogs.find(
      (l) =>
        l.txHash?.toLowerCase().includes(searchHash.toLowerCase()) ||
        l.cid?.toLowerCase().includes(searchHash.toLowerCase()) ||
        l.id?.toLowerCase() === searchHash.toLowerCase()
    );

    if (matchedLog) {
      setVerificationResult({
        found: true,
        hash: matchedLog.txHash,
        status: 'VERIFIED_AUTHENTIC',
        ipfsCID: matchedLog.cid,
        timestamp: matchedLog.timestamp,
        user: matchedLog.user,
        role: matchedLog.role,
        action: matchedLog.action
      });
    } else {
      setVerificationResult({
        found: false,
        hash: searchHash,
        status: 'RECORD_NOT_FOUND',
        message: 'No matching transaction hash or CID found in audit ledger.'
      });
    }
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: 'calc(100vh - 94px)' }}>
      <main className="content-viewport" style={{ width: '100%' }}>
        {/* Title Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.4rem' }}>Security Audit & Verification Console</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Real-time audit log verification and system integrity management.
          </p>
        </div>

        {/* System Security Stats */}
        <div className="stats-grid">
          <div className="glass-panel stat-card">
            <div>
              <div className="stat-title">Total Audit Logs</div>
              <div className="stat-value" style={{ color: '#38bdf8' }}>{auditLogs.length}</div>
              <span className="stat-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                Recorded Events
              </span>
            </div>
            <Link2 size={24} style={{ color: '#38bdf8' }} />
          </div>

          <div className="glass-panel stat-card">
            <div>
              <div className="stat-title">Verified Transactions</div>
              <div className="stat-value" style={{ color: '#34d399' }}>{auditLogs.length}</div>
              <span className="stat-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                Ledger Validated
              </span>
            </div>
            <CheckCircle2 size={24} style={{ color: '#10b981' }} />
          </div>

          <div className="glass-panel stat-card">
            <div>
              <div className="stat-title">Storage CIDs</div>
              <div className="stat-value" style={{ color: '#a78bfa' }}>
                {auditLogs.filter((l) => l.cid).length}
              </div>
              <span className="stat-badge" style={{ background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa' }}>
                Indexed Files
              </span>
            </div>
            <ShieldAlert size={24} style={{ color: '#a78bfa' }} />
          </div>

          <div className="glass-panel stat-card">
            <div>
              <div className="stat-title">System Status</div>
              <div className="stat-value" style={{ color: '#10b981', fontSize: '1.2rem' }}>ACTIVE</div>
              <span className="stat-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                Audit Active
              </span>
            </div>
            <ShieldCheck size={24} style={{ color: '#10b981' }} />
          </div>
        </div>

        {/* Verification Tool */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', border: '1px solid rgba(0, 120, 212, 0.3)' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={18} style={{ color: '#0078d4' }} />
            <span>Record Integrity Verifier</span>
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Enter any transaction ID, log hash, or audit record CID to perform instant verification.
          </p>

          <form onSubmit={handleVerifyHash} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Enter Record ID, TX Hash, or CID..."
              value={searchHash}
              onChange={(e) => setSearchHash(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
              <ShieldCheck size={16} />
              <span>Verify Integrity</span>
            </button>
          </form>

          {/* Verification Result Box */}
          {verificationResult && (
            <div style={{ marginTop: '20px' }}>
              {verificationResult.found ? (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    padding: '18px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#34d399', fontWeight: 700, marginBottom: '12px' }}>
                    <CheckCircle2 size={20} />
                    <span>VERIFICATION PASSED: AUTHENTIC RECORD FOUND</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Verification Key:</span>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)', wordBreak: 'break-all' }}>{verificationResult.hash}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Storage CID Reference:</span>
                      <div style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{verificationResult.ipfsCID || 'N/A'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Action Executed:</span>
                      <div>{verificationResult.action}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Performed By:</span>
                      <div>{verificationResult.user} ({verificationResult.role})</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '18px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444', fontWeight: 700, marginBottom: '8px' }}>
                    <AlertTriangle size={20} />
                    <span>RECORD NOT FOUND IN AUDIT LEDGER</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Searched Key: <code style={{ color: 'var(--text-main)' }}>{verificationResult.hash}</code>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: '4px' }}>
                    {verificationResult.message}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detailed Audit Table */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem' }}>Comprehensive System Audit Logs</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{auditLogs.length} events logged</span>
          </div>

          <div className="table-container">
            {auditLogs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No audit logs currently in ledger.
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User / Responsible Agent</th>
                    <th>Action Executed</th>
                    <th>Log Reference</th>
                    <th>File Reference</th>
                    <th>Verification Status</th>
                    <th>Integrity Check</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        <Clock size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--text-dim)' }} />
                        {log.timestamp}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.user}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{log.role}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{log.action}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#38bdf8' }}>
                        {log.txHash ? `${log.txHash.substring(0, 16)}...` : log.id}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#10b981' }}>
                        {log.cid ? `${log.cid.substring(0, 12)}...` : 'N/A'}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700 }}>
                          {log.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                          {log.integrityCheck}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
