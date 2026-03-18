import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data } = await adminApi.getLogs();
      setLogs(data.data);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.includes('APPROVE') || action.includes('CREATE')) return 'var(--success)';
    if (action.includes('REJECT') || action.includes('DELETE')) return 'var(--danger)';
    if (action.includes('SUSPEND') || action.includes('UPDATE')) return 'var(--warning)';
    return 'var(--info)';
  };

  if (loading) return <div className="loading-overlay"><div className="loading-spinner" /></div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">System Audit Logs</h2>
          <p className="page-subtitle">Track administrative actions taken across the platform.</p>
        </div>
      </div>

      <div className="card animate-in" style={{ padding: 0 }}>
        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3 className="empty-title">No logs yet</h3>
            <p className="empty-subtitle">Admin activities will appear here.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>IP Address</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td>
                    <div className="font-bold text-sm">{log.admin?.name || 'System'}</div>
                    <div className="text-xs text-muted">{log.admin?.email}</div>
                  </td>
                  <td>
                    <span 
                      className="badge" 
                      style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        color: getActionColor(log.action),
                        border: `1px solid ${getActionColor(log.action)}` 
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="text-sm">
                    {log.targetRestaurant ? (
                      <div>
                        Restaurant: <span className="font-bold">{log.targetRestaurant.name}</span>
                      </div>
                    ) : 'System Config'}
                    {log.details && (
                      <div className="text-xs text-muted" style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.details}
                      </div>
                    )}
                  </td>
                  <td className="text-xs text-muted font-mono">{log.ipAddress}</td>
                  <td className="text-sm text-muted">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
