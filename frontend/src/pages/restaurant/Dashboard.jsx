import { useState, useEffect } from 'react';
import { analyticsApi, ordersApi, menuApi, customersApi, tablesApi } from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const createOrderItem = () => ({
  menuItem: '',
  name: '',
  price: '',
  quantity: 1,
  specialInstructions: '',
});

const initialOrderForm = {
  customerMode: 'existing',
  customer: '',
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  orderType: 'dine_in',
  table: '',
  paymentMethod: 'cash',
  discount: '',
  notes: '',
  items: [createOrderItem()],
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [menuHighlights, setMenuHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderForm, setOrderForm] = useState(initialOrderForm);
  const [customers, setCustomers] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        analyticsApi.getSales({ period: 'today' }),
        ordersApi.getAll({ limit: 5 })
      ]);
      setStats(statsRes.data.data);
      setRecentOrders(ordersRes.data.data.slice(0, 5)); // Just top 5

      const menuRes = await menuApi.getAll({ limit: 4 });
      setMenuHighlights((menuRes.data.data || []).slice(0, 4));
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const openManualOrderModal = async () => {
    setIsOrderModalOpen(true);

    if (manualLoading || (customers.length > 0 && menuItems.length > 0)) return;

    setManualLoading(true);
    try {
      const [customersRes, menuRes, tablesRes] = await Promise.all([
        customersApi.getAll({ limit: 200 }),
        menuApi.getAll({ limit: 200 }),
        tablesApi.getAll(),
      ]);

      setCustomers(customersRes.data.data || []);
      setMenuItems(menuRes.data.data || []);
      setTables((tablesRes.data.data || []).filter((t) => t.status === 'available' || !t.isOccupied));
    } catch (err) {
      toast.error('Failed to load booking data');
    } finally {
      setManualLoading(false);
    }
  };

  const resetManualOrderForm = () => {
    setOrderForm(initialOrderForm);
  };

  const closeManualOrderModal = () => {
    setIsOrderModalOpen(false);
    resetManualOrderForm();
  };

  const handleOrderFieldChange = (name, value) => {
    setOrderForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomerSelect = (customerId) => {
    const selected = customers.find((c) => c._id === customerId);
    setOrderForm((prev) => ({
      ...prev,
      customer: customerId,
      customerName: selected?.name || '',
      customerPhone: selected?.phone || '',
      customerAddress: selected?.address || '',
    }));
  };

  const handleItemChange = (index, key, value) => {
    setOrderForm((prev) => {
      const items = prev.items.map((item, i) => {
        if (i !== index) return item;

        if (key === 'menuItem') {
          const selected = menuItems.find((m) => m._id === value);
          return {
            ...item,
            menuItem: value,
            name: selected?.name || item.name,
            price: selected?.price ?? item.price,
          };
        }

        return { ...item, [key]: value };
      });

      return { ...prev, items };
    });
  };

  const addOrderItem = () => {
    setOrderForm((prev) => ({ ...prev, items: [...prev.items, createOrderItem()] }));
  };

  const removeOrderItem = (index) => {
    setOrderForm((prev) => {
      if (prev.items.length === 1) return prev;
      return { ...prev, items: prev.items.filter((_, i) => i !== index) };
    });
  };

  const computedTotals = orderForm.items.reduce(
    (acc, item) => {
      const price = Number(item.price || 0);
      const quantity = Number(item.quantity || 0);
      const lineTotal = price * quantity;
      return {
        subtotal: acc.subtotal + lineTotal,
        items: acc.items + quantity,
      };
    },
    { subtotal: 0, items: 0 }
  );

  const handleCreateManualOrder = async (e) => {
    e.preventDefault();

    const parsedItems = orderForm.items
      .map((item) => ({
        menuItem: item.menuItem || undefined,
        name: item.name?.trim(),
        price: Number(item.price),
        quantity: Number(item.quantity),
        specialInstructions: item.specialInstructions?.trim() || undefined,
      }))
      .filter((item) => item.name && item.price > 0 && item.quantity > 0);

    if (parsedItems.length === 0) {
      toast.error('Add at least one valid order item');
      return;
    }

    if (orderForm.orderType === 'delivery' && !orderForm.customerAddress?.trim()) {
      toast.error('Delivery orders require customer address');
      return;
    }

    if (orderForm.customerMode === 'existing' && !orderForm.customer) {
      toast.error('Select an existing customer or switch to new customer mode');
      return;
    }

    if (orderForm.customerMode === 'new' && !orderForm.customerName?.trim()) {
      toast.error('Customer name is required for new customer booking');
      return;
    }

    const payload = {
      items: parsedItems,
      orderType: orderForm.orderType,
      paymentMethod: orderForm.paymentMethod,
      source: 'dashboard',
      notes: orderForm.notes?.trim() || undefined,
      discount: orderForm.discount ? Number(orderForm.discount) : undefined,
      table: orderForm.orderType === 'dine_in' && orderForm.table ? orderForm.table : undefined,
      customerName: orderForm.customerName?.trim() || undefined,
      customerPhone: orderForm.customerPhone?.trim() || undefined,
      customerAddress: orderForm.customerAddress?.trim() || undefined,
      customer: orderForm.customerMode === 'existing' ? orderForm.customer : undefined,
    };

    setSubmittingOrder(true);
    try {
      await ordersApi.create(payload);
      toast.success('Manual order booked successfully');
      closeManualOrderModal();
      await fetchDashboardData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create manual order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (loading) return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Today's Overview</h2>
          <p className="page-subtitle">Here's what is happening at your restaurant today.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={openManualOrderModal}>
            + Manual Order Booking
          </button>
          <Link to="/orders" className="btn btn-primary">
            + New Walk-in Order
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div className="stat-value">PKR {stats?.sales?.totalRevenue?.toLocaleString() || 0}</div>
            <div className="stat-label">Total Revenue Today</div>
            <div className="stat-change up">↑ 12% vs yesterday</div>
          </div>
          <div className="stat-icon purple">💰</div>
        </div>

        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div className="stat-value">{stats?.sales?.totalOrders || 0}</div>
            <div className="stat-label">Total Orders</div>
            <div className="stat-change up">↑ 5% vs yesterday</div>
          </div>
          <div className="stat-icon blue">📦</div>
        </div>

        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div className="stat-value">{stats?.ordersByStatus?.pending || 0}</div>
            <div className="stat-label">Pending Orders</div>
            <div className="stat-change orange">Needs attention</div>
          </div>
          <div className="stat-icon orange">⏳</div>
        </div>

        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div className="stat-value">{stats?.customers?.totalCustomers || 0}</div>
            <div className="stat-label">Total Customers</div>
            <div className="stat-change up">↑ +3 new today</div>
          </div>
          <div className="stat-icon green">👥</div>
        </div>
      </div>

      <div className="two-col">
        {/* Recent Orders Table */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 className="font-bold">Recent Orders</h3>
            <Link to="/orders" className="text-sm text-gradient font-bold">View All →</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px' }} className="text-muted text-sm">
                      No orders today yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.map(order => (
                    <tr key={order._id}>
                      <td className="font-bold">{order.orderNumber}</td>
                      <td>
                        <div className="text-sm font-bold">{order.customerName || 'Walk-in'}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="font-bold text-sm">PKR {order.totalAmount}</td>
                      <td>
                        <span className={`badge badge-${order.status}`}>
                          <span className="badge-dot" /> {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & WhatsApp Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(37,211,102,0.1), rgba(18,140,126,0.1))', borderColor: 'rgba(37,211,102,0.3)' }}>
            <div className="flex-center gap-3 mb-4">
              <div className="avatar" style={{ background: '#25D366' }}>💬</div>
              <div>
                <h3 className="font-bold">WhatsApp AI Ordering</h3>
                <div className="text-sm" style={{ color: '#25D366' }}>Live & Active</div>
              </div>
            </div>
            <p className="text-sm text-secondary mb-4">
              Your AI assistant is actively listening for customer orders via WhatsApp. Auto-replies are enabled.
            </p>
            <div className="flex gap-2">
              <Link to="/whatsapp" className="btn btn-sm" style={{ background: '#25D366', color: '#000' }}>
                View Settings
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="table-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <Link to="/menu" className="table-card" style={{ padding: 16 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🍔</div>
                <div className="text-sm font-bold">Update Menu</div>
              </Link>
              <Link to="/tables" className="table-card" style={{ padding: 16 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🪑</div>
                <div className="text-sm font-bold">Manage Tables</div>
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="flex-between mb-4">
              <h3 className="font-bold">Menu Highlights</h3>
              <Link to="/menu" className="text-sm text-gradient font-bold">Manage →</Link>
            </div>

            {menuHighlights.length === 0 ? (
              <div className="text-sm text-muted">No menu items yet. Add items with images in Menu Management.</div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {menuHighlights.map((item) => (
                  <div key={item._id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {item.image || item.imageUrl ? (
                      <img
                        src={item.image || item.imageUrl}
                        alt={item.name}
                        style={{ width: 54, height: 54, borderRadius: 10, objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 54,
                          height: 54,
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(255,255,255,0.04)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        🍽️
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div className="font-bold text-sm">{item.name}</div>
                      <div className="text-xs text-muted">{item.category} • PKR {item.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isOrderModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeManualOrderModal(); }}>
          <div className="modal" style={{ maxWidth: 860 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Manual Order Booking</h3>
                <div className="text-sm text-muted">Create walk-in, phone, or delivery orders directly from dashboard</div>
              </div>
              <button className="modal-close" onClick={closeManualOrderModal}>✕</button>
            </div>

            {manualLoading ? (
              <div className="modal-body">
                <div className="loading-overlay" style={{ position: 'relative', minHeight: 140, background: 'transparent' }}>
                  <div className="loading-spinner" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateManualOrder}>
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className="form-group">
                    <label className="form-label">Customer Source</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className={`btn ${orderForm.customerMode === 'existing' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleOrderFieldChange('customerMode', 'existing')}
                      >
                        Existing Customer
                      </button>
                      <button
                        type="button"
                        className={`btn ${orderForm.customerMode === 'new' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleOrderFieldChange('customerMode', 'new')}
                      >
                        New / Walk-in Customer
                      </button>
                    </div>
                  </div>

                  {orderForm.customerMode === 'existing' ? (
                    <div className="form-group">
                      <label className="form-label">Select Customer *</label>
                      <select
                        className="form-select"
                        value={orderForm.customer}
                        onChange={(e) => handleCustomerSelect(e.target.value)}
                        required
                      >
                        <option value="">Choose customer</option>
                        {customers.map((c) => (
                          <option key={c._id} value={c._id}>{c.name} • {c.phone}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="two-col" style={{ gap: 16 }}>
                      <div className="form-group">
                        <label className="form-label">Customer Name *</label>
                        <input
                          className="form-input"
                          value={orderForm.customerName}
                          onChange={(e) => handleOrderFieldChange('customerName', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                          className="form-input"
                          value={orderForm.customerPhone}
                          onChange={(e) => handleOrderFieldChange('customerPhone', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="three-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Order Type</label>
                      <select
                        className="form-select"
                        value={orderForm.orderType}
                        onChange={(e) => handleOrderFieldChange('orderType', e.target.value)}
                      >
                        <option value="dine_in">Dine In</option>
                        <option value="takeaway">Takeaway</option>
                        <option value="delivery">Delivery</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Payment Method</label>
                      <select
                        className="form-select"
                        value={orderForm.paymentMethod}
                        onChange={(e) => handleOrderFieldChange('paymentMethod', e.target.value)}
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="online">Online</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Discount</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-input"
                        value={orderForm.discount}
                        onChange={(e) => handleOrderFieldChange('discount', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {orderForm.orderType === 'dine_in' && (
                    <div className="form-group">
                      <label className="form-label">Table (optional)</label>
                      <select
                        className="form-select"
                        value={orderForm.table}
                        onChange={(e) => handleOrderFieldChange('table', e.target.value)}
                      >
                        <option value="">No table</option>
                        {tables.map((t) => (
                          <option key={t._id} value={t._id}>Table {t.tableNumber} • {t.capacity} seats</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {orderForm.orderType === 'delivery' && (
                    <div className="form-group">
                      <label className="form-label">Delivery Address *</label>
                      <textarea
                        className="form-textarea"
                        style={{ minHeight: 70 }}
                        value={orderForm.customerAddress}
                        onChange={(e) => handleOrderFieldChange('customerAddress', e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="divider" />
                  <div className="flex-between mb-3">
                    <h4 className="font-bold">Order Items</h4>
                    <button type="button" className="btn btn-secondary" onClick={addOrderItem}>+ Add Item</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {orderForm.items.map((item, index) => (
                      <div key={index} className="card" style={{ padding: 14, background: 'rgba(255,255,255,0.02)' }}>
                        <div className="two-col" style={{ gap: 12 }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Menu Item</label>
                            <select
                              className="form-select"
                              value={item.menuItem}
                              onChange={(e) => handleItemChange(index, 'menuItem', e.target.value)}
                            >
                              <option value="">Custom / Not in menu</option>
                              {menuItems.map((m) => (
                                <option key={m._id} value={m._id}>{m.name} • PKR {m.price}</option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Item Name *</label>
                            <input
                              className="form-input"
                              value={item.name}
                              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="three-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, marginTop: 10 }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Price *</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="form-input"
                              value={item.price}
                              onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                              required
                            />
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Qty *</label>
                            <input
                              type="number"
                              min="1"
                              className="form-input"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              required
                            />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'end' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => removeOrderItem(index)}
                              disabled={orderForm.items.length === 1}
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="form-group" style={{ marginTop: 10, marginBottom: 0 }}>
                          <label className="form-label">Special Instructions</label>
                          <input
                            className="form-input"
                            value={item.specialInstructions}
                            onChange={(e) => handleItemChange(index, 'specialInstructions', e.target.value)}
                            placeholder="Less spicy, no onions, extra cheese..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label className="form-label">Order Notes</label>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: 70 }}
                      value={orderForm.notes}
                      onChange={(e) => handleOrderFieldChange('notes', e.target.value)}
                      placeholder="Internal notes for kitchen or cashier"
                    />
                  </div>

                  <div className="divider" />
                  <div className="flex-between">
                    <div className="text-sm text-muted">{computedTotals.items} item(s)</div>
                    <div className="font-bold">Estimated Subtotal: PKR {computedTotals.subtotal.toFixed(2)}</div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeManualOrderModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submittingOrder}>
                    {submittingOrder ? 'Booking...' : 'Create Manual Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
