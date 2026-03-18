import { useState, useEffect } from 'react';
import { menuApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function Menu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [form, setForm] = useState({
    name: '', description: '', price: '', category: '', isAvailable: true
  });
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [menuRes, catRes] = await Promise.all([
        menuApi.getAll(),
        menuApi.getCategories()
      ]);
      setItems(menuRes.data.data);
      setCategories(catRes.data.data);
    } catch (err) {
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      // Optimistic update
      setItems(items.map(i => i._id === id ? { ...i, isAvailable: !currentStatus } : i));
      await menuApi.toggleAvailability(id);
      toast.success(currentStatus ? 'Item marked unavailable' : 'Item marked available');
    } catch (err) {
      // Revert on failure
      setItems(items.map(i => i._id === id ? { ...i, isAvailable: currentStatus } : i));
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await menuApi.delete(id);
      setItems(items.filter(i => i._id !== id));
      toast.success('Item deleted successfully');
      fetchData(); // Refresh categories
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  const openForm = (item = null) => {
    if (item) {
      setEditingId(item._id);
      setForm({
        name: item.name,
        description: item.description || '',
        price: item.price,
        category: item.category,
        isAvailable: item.isAvailable
      });
    } else {
      setEditingId(null);
      setForm({ name: '', description: '', price: '', category: '', isAvailable: true });
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) return toast.error('Fill required fields');
    
    try {
      let savedItem;
      if (editingId) {
        const { data } = await menuApi.update(editingId, form);
        savedItem = data.data;
        toast.success('Item updated');
      } else {
        const { data } = await menuApi.create(form);
        savedItem = data.data;
        toast.success('Item created');
      }

      // Handle image upload if selected
      if (imageFile) {
        try {
          const formData = new FormData();
          formData.append('image', imageFile);
          await menuApi.uploadImage(savedItem._id, formData);
          toast.success('Image uploaded successfully');
        } catch (uploadErr) {
          toast.error(uploadErr?.response?.data?.message || 'Item saved, but image upload failed');
        }
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save item');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCat = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (loading) return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Menu Management</h2>
          <p className="page-subtitle">Manage your dishes, pricing, and availability.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => openForm()}>
            + Add Menu Item
          </button>
        </div>
      </div>

      <div className="filters-bar" style={{ marginBottom: 24, justifyContent: 'space-between' }}>
        <div className="tabs" style={{ margin: 0 }}>
          <div 
            className={`tab-btn ${activeCategory === 'All' ? 'active' : ''}`}
            onClick={() => setActiveCategory('All')}
          >
            All Items
          </div>
          {categories.map(cat => (
            <div 
              key={cat._id}
              className={`tab-btn ${activeCategory === cat._id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat._id)}
            >
              {cat._id} <span className="text-muted text-sm">({cat.count})</span>
            </div>
          ))}
        </div>

        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search menu..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">🍽️</div>
          <h3 className="empty-title">No menu items found</h3>
          <p className="empty-subtitle">
            {search ? `No results for "${search}"` : "You haven't added any items to this category yet."}
          </p>
          {!search && (
            <button className="btn btn-primary mt-4" onClick={() => openForm()}>
              Add First Item
            </button>
          )}
        </div>
      ) : (
        <div className="menu-grid animate-in">
          {filteredItems.map(item => (
            <div key={item._id} className="menu-card">
              {item.image || item.imageUrl ? (
                <img src={item.image || item.imageUrl} alt={item.name} className="menu-card-img" />
              ) : (
                <div className="menu-card-img text-muted">🍽️</div>
              )}
              
              <div className="menu-card-body">
                <div className="menu-card-category">{item.category}</div>
                <div className="flex-between">
                  <div className="menu-card-name" style={{ opacity: item.isAvailable ? 1 : 0.5 }}>
                    {item.name}
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={item.isAvailable} 
                      onChange={() => handleToggle(item._id, item.isAvailable)}
                    />
                    <span className="toggle-track" />
                  </label>
                </div>
                
                <div className="menu-card-desc">{item.description || 'No description provided.'}</div>
                
                <div className="menu-card-footer mt-4">
                  <div className="menu-card-price">PKR {item.price}</div>
                  <div className="flex gap-2">
                    <button 
                      className="btn-icon" 
                      style={{ background: 'var(--bg-secondary)' }}
                      onClick={() => openForm(item)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-icon" 
                      style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                      onClick={() => handleDelete(item._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setIsModalOpen(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Item Name *</label>
                  <input 
                    type="text" className="form-input" required placeholder="e.g. Chicken Biryani"
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  />
                </div>

                <div className="two-col" style={{ gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Price (PKR) *</label>
                    <input 
                      type="number" className="form-input" required placeholder="0.00" min="0" step="0.01"
                      value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <input 
                      type="text" className="form-input" required placeholder="e.g. Mains, Drinks"
                      value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                      list="categories-list"
                    />
                    <datalist id="categories-list">
                      {categories.map(cat => <option key={cat._id} value={cat._id} />)}
                    </datalist>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <textarea 
                    className="form-textarea" placeholder="Delicious spicy chicken biryani..."
                    style={{ minHeight: 80 }}
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Image (optional)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="form-input"
                    onChange={e => setImageFile(e.target.files[0])}
                    style={{ padding: '8px 16px' }}
                  />
                  <div className="text-sm text-muted mt-2">
                    {editingId ? "Leave empty to keep current image." : "Upload a mouth-watering image."}
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
