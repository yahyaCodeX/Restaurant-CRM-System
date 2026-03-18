import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, [filter]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await adminApi.getRestaurants(params);
      setRestaurants(data.data.restaurants || data.data);
    } catch (err) {
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action, name) => {
    const actions = {
      approve: { method: adminApi.approve, label: 'Approve' },
      reject: { method: adminApi.reject, label: 'Reject', confirm: true },
      suspend: { method: adminApi.suspend, label: 'Suspend', confirm: true },
      delete: { method: adminApi.remove, label: 'Delete', confirm: true }
    };

    const cfg = actions[action];
    if (cfg.confirm && !window.confirm(`Are you sure you want to ${action} ${name}?`)) return;

    try {
      await cfg.method(id);
      toast.success(`Restaurant ${cfg.label.toLowerCase()}ed successfully`);
      fetchRestaurants();
    } catch (err) {
      toast.error(`Failed to ${action} restaurant`);
    }
  };

  const filtered = restaurants.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.owner?.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Manage Restaurants</h2>
          <p className="page-subtitle">Review applications and manage tenant status.</p>
        </div>
      </div>

      <div className="filters-bar" style={{ justifyContent: 'space-between' }}>
        <div className="tabs" style={{ margin: 0 }}>
          {['all', 'pending', 'approved', 'suspended', 'rejected'].map(tab => (
            <div 
              key={tab}
              className={`tab-btn ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
              style={{ textTransform: 'capitalize' }}
            >
              {tab}
            </div>
          ))}
        </div>

        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container animate-in">
        {loading ? (
           <div className="text-center py-10"><div className="loading-spinner mx-auto" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>Owner Contact</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-10">
                    No restaurants found in this category.
                  </td>
                </tr>
              ) : (
                filtered.map(r => (
                  <tr key={r._id}>
                    <td>
                      <div className="font-bold">{r.name}</div>
                      <div className="text-sm text-muted">{r.whatsappNumber || 'No WA config'}</div>
                    </td>
                    <td>
                      <div className="font-bold text-sm">{r.owner?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted">{r.owner?.email}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${r.status}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="text-sm text-muted">
                      {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        {r.status === 'pending' && (
                          <>
                            <button className="btn btn-sm btn-success" onClick={() => handleAction(r._id, 'approve', r.name)}>Approve</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleAction(r._id, 'reject', r.name)}>Reject</button>
                          </>
                        )}
                        {r.status === 'approved' && (
                          <button className="btn btn-sm btn-secondary text-warning" onClick={() => handleAction(r._id, 'suspend', r.name)}>Suspend</button>
                        )}
                        {r.status === 'suspended' && (
                          <button className="btn btn-sm btn-success" onClick={() => handleAction(r._id, 'approve', r.name)}>Unsuspend</button>
                        )}
                        <button className="btn-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', width: 30, height: 30 }} onClick={() => handleAction(r._id, 'delete', r.name)} title="Delete Permanently">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
