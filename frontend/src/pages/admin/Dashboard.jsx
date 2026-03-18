import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await adminApi.getDashboard();
      setStats(data.data);
    } catch (err) {
      toast.error('Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-overlay"><div className="loading-spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">SaaS Platform Overview</h2>
          <p className="page-subtitle">Super admin dashboard across all tenant restaurants.</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card" style={{ borderColor: 'var(--accent-tertiary)' }}>
          <div style={{ flex: 1 }}>
            <div className="stat-value">{stats?.totalRestaurants || 0}</div>
            <div className="stat-label">Total Restaurants</div>
          </div>
          <div className="stat-icon purple">🏢</div>
        </div>

        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div className="stat-value">{stats?.restaurantsByStatus?.pending || 0}</div>
            <div className="stat-label">Pending Approval</div>
            <div className="stat-change orange">Needs review</div>
          </div>
          <div className="stat-icon orange">⏳</div>
        </div>

        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div className="stat-value">{stats?.totalOrdersPlatformWide || 0}</div>
            <div className="stat-label">Total Orders Processed</div>
          </div>
          <div className="stat-icon blue">📋</div>
        </div>
        
        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div className="stat-value">{stats?.totalCustomersPlatformWide || 0}</div>
            <div className="stat-label">Global Customers</div>
          </div>
          <div className="stat-icon green">👥</div>
        </div>
      </div>

      <div className="two-col mt-4">
        <div className="card">
          <h3 className="font-bold mb-4">Quick Links</h3>
          <div className="flex" style={{ flexDirection: 'column', gap: 12 }}>
            <Link to="/admin/restaurants" className="btn btn-secondary w-full" style={{ justifyContent: 'space-between' }}>
              <span>🍽️ Manage Restaurants</span>
              <span>→</span>
            </Link>
            <Link to="/admin/logs" className="btn btn-secondary w-full" style={{ justifyContent: 'space-between' }}>
              <span>📋 View Audit Logs</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        <div className="card" style={{ background: 'var(--danger-bg)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <h3 className="font-bold mb-2 text-danger">Platform Status</h3>
          <p className="text-secondary text-sm mb-4">
            The core APIs are fully functional. AI processing queue is healthy.
          </p>
          <div className="flex-between text-sm font-bold p-3" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
            <span>API Gateway</span>
            <span className="text-success">REST RESPONDING</span>
          </div>
          <div className="flex-between text-sm font-bold p-3 mt-2" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
            <span>Meta Webhooks</span>
            <span className="text-success">ALIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
