import { useState, useEffect } from 'react';
import { tablesApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ tableNumber: '', capacity: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const { data } = await tablesApi.getAll();
      setTables(data.data);
    } catch (err) {
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      setTables(tables.map(t => t._id === id ? { ...t, isOccupied: !currentStatus } : t));
      await tablesApi.toggle(id);
      toast.success(currentStatus ? 'Table marked free' : 'Table marked occupied');
    } catch (err) {
      setTables(tables.map(t => t._id === id ? { ...t, isOccupied: currentStatus } : t));
      toast.error('Failed to update table status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    try {
      await tablesApi.remove(id);
      setTables(tables.filter(t => t._id !== id));
      toast.success('Table deleted');
    } catch (err) {
      toast.error('Failed to delete table');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tableNumber || !form.capacity) return toast.error('Check fields');
    try {
      if (editingId) {
        await tablesApi.update(editingId, form);
        toast.success('Table updated');
      } else {
        await tablesApi.add(form);
        toast.success('Table added');
      }
      setIsModalOpen(false);
      fetchTables();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save table');
    }
  };

  const openForm = (table = null) => {
    if (table) {
      setEditingId(table._id);
      setForm({ tableNumber: table.tableNumber, capacity: table.capacity });
    } else {
      setEditingId(null);
      setForm({ tableNumber: '', capacity: '' });
    }
    setIsModalOpen(true);
  };

  const maxCapacity = Math.max(...tables.map(t => t.capacity), 0);
  const allOccupied = tables.filter(t => t.isOccupied).length;

  if (loading) return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Table Floorplan</h2>
          <p className="page-subtitle">Manage dine-in seating and table availability.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => openForm()}>
            + Add Table
          </button>
        </div>
      </div>

      <div className="filters-bar" style={{ display: 'flex', gap: 24, marginBottom: 30 }}>
        <div className="text-sm">
          <span className="text-muted">Total Tables:</span> <strong className="ml-1">{tables.length}</strong>
        </div>
        <div className="text-sm">
          <span className="text-muted">Occupied:</span> <strong className="ml-1 text-danger">{allOccupied}</strong>
        </div>
        <div className="text-sm">
          <span className="text-muted">Available:</span> <strong className="ml-1 text-success">{tables.length - allOccupied}</strong>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">🪑</div>
          <h3 className="empty-title">No tables set up</h3>
          <p className="empty-subtitle">Add your first table to manage dine-in customers.</p>
          <button className="btn btn-primary mt-4" onClick={() => openForm()}>Create Table</button>
        </div>
      ) : (
        <div className="table-grid animate-in">
          {tables.map(table => (
            <div 
              key={table._id} 
              className={`table-card ${table.isOccupied ? 'occupied' : 'free'}`}
              onClick={() => handleToggle(table._id, table.isOccupied)}
            >
              <div className="flex-between mb-2">
                <div className="text-sm font-bold text-muted">Seats: {table.capacity}</div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button className="text-muted hover:text-primary" onClick={() => openForm(table)}>✏️</button>
                  <button className="text-danger hover:text-danger" onClick={() => handleDelete(table._id)}>✕</button>
                </div>
              </div>
              
              <div className="table-num">{table.tableNumber}</div>
              <div className="table-status">
                {table.isOccupied ? '🔴 Occupied' : '🟢 Free'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal form */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setIsModalOpen(false) }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Table' : 'Add New Table'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Table Number / Name *</label>
                  <input type="text" className="form-input" required placeholder="e.g. T-1, Window-1"
                    value={form.tableNumber} onChange={e => setForm({...form, tableNumber: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Seating Capacity *</label>
                  <input type="number" className="form-input" required placeholder="e.g. 4" min="1"
                    value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Table</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
