import { useState, useEffect } from 'react';
import { ordersApi } from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const STAGES = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
    // In a real app, you would set up a WebSocket connection here
    const interval = setInterval(fetchOrders, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await ordersApi.getAll();
      // Filter out cancelled orders from the board view
      setOrders(data.data.filter(o => o.status !== 'cancelled'));
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await ordersApi.updateStatus(id, { status });
      toast.success(`Order moved to ${status}`);
      fetchOrders();
      if (selectedOrder) setSelectedOrder({ ...selectedOrder, status });
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const cancelOrder = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await ordersApi.updateStatus(id, { status: 'cancelled' });
      toast.success('Order cancelled');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to cancel order');
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
          <h2 className="page-title">Orders Board</h2>
          <p className="page-subtitle">Manage fulfilling active orders</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {STAGES.map(stage => {
          const stageOrders = orders.filter(o => o.status === stage);
          
          return (
            <div key={stage} className="kanban-column">
              <div className="kanban-col-header">
                <div className="kanban-col-title">{stage}</div>
                <div className="kanban-col-count">{stageOrders.length}</div>
              </div>
              <div className="kanban-cards">
                {stageOrders.length === 0 ? (
                  <div className="text-center text-muted text-sm pt-4">No {stage} orders</div>
                ) : (
                  stageOrders.map(order => (
                    <div 
                      key={order._id} 
                      className="kanban-card"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex-between">
                        <div className="kanban-card-num">{order.orderNumber}</div>
                        <span className={`badge badge-${order.source}`}>
                          {order.source === 'whatsapp' ? '🟢 WA' : '💻 Dash'}
                        </span>
                      </div>
                      <div className="kanban-card-customer">{order.customerName || 'Walk-in'}</div>
                      <div className="kanban-card-items">
                        {order.items.length} items • {order.orderType.replace('_', ' ')}
                      </div>
                      <div className="kanban-card-footer">
                        <div className="kanban-card-price">PKR {order.totalAmount}</div>
                        <div className="text-muted" style={{ fontSize: 10 }}>
                          {formatDistanceToNow(new Date(order.createdAt))} ago
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setSelectedOrder(null) }}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Order {selectedOrder.orderNumber}</h3>
                <div className="text-sm text-muted">
                  Placed {new Date(selectedOrder.createdAt).toLocaleString()}
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="flex-between mb-4">
                <div>
                  <div className="text-sm font-bold text-muted uppercase">Customer</div>
                  <div className="font-bold">{selectedOrder.customerName || 'Guest'}</div>
                  <div className="text-sm">{selectedOrder.customerPhone || 'N/A'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-muted uppercase">Type</div>
                  <div className="font-bold capitalize">{selectedOrder.orderType.replace('_', ' ')}</div>
                  {selectedOrder.table && <div className="text-sm text-accent-primary">Table ID: {selectedOrder.table}</div>}
                </div>
              </div>

              <div className="divider" />

              <h4 className="font-bold mb-3">Order Items</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex-between">
                    <div className="flex gap-2">
                      <div className="font-bold text-muted">{item.quantity}x</div>
                      <div>
                        <div className="font-bold">{item.name}</div>
                        {item.specialInstructions && (
                          <div className="text-sm text-warning mt-1">Note: {item.specialInstructions}</div>
                        )}
                      </div>
                    </div>
                    <div className="font-bold">PKR {item.subtotal}</div>
                  </div>
                ))}
              </div>

              <div className="divider" />

              <div className="flex-between font-bold" style={{ fontSize: 18 }}>
                <div>Total</div>
                <div className="text-accent-tertiary">PKR {selectedOrder.totalAmount}</div>
              </div>

              {selectedOrder.notes && (
                <div className="mt-4 p-3 rounded-md" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <span className="font-bold text-warning text-sm uppercase">Order Notes: </span>
                  <span className="text-sm">{selectedOrder.notes}</span>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button 
                className="btn btn-secondary" style={{ color: 'var(--danger)' }}
                onClick={() => cancelOrder(selectedOrder._id)}
              >
                Cancel Order
              </button>
              
              <div className="flex gap-2">
                {selectedOrder.status !== 'delivered' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      const currentIndex = STAGES.indexOf(selectedOrder.status);
                      if (currentIndex < STAGES.length - 1) {
                        updateStatus(selectedOrder._id, STAGES[currentIndex + 1]);
                      }
                    }}
                  >
                    Mark as {STAGES[STAGES.indexOf(selectedOrder.status) + 1]}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
