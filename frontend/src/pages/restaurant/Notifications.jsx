import { useState, useEffect } from 'react';
import { notificationsApi } from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationsApi.getAll();
      const payload = data.data || {};
      const list = Array.isArray(payload.notifications) ? payload.notifications : [];
      setNotifications(list);
      setUnreadCount(typeof payload.unreadCount === 'number'
        ? payload.unreadCount
        : list.filter((n) => !n.isRead).length);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const markAsRead = async (id) => {
    const notif = notifications.find((n) => n._id === id);
    if (!notif) return;
    if (notif.isRead) return;
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Failed to mark read');
    }
  };

  const getRelativeTime = (value) => {
    if (!value) return 'just now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'just now';
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (loading) return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title flex-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="badge-dot" style={{ background: 'var(--danger)', width: 10, height: 10 }} />
            )}
          </h2>
          <p className="page-subtitle">Alerts for new orders, customer interactions, and system updates.</p>
        </div>
        {unreadCount > 0 && (
          <div className="page-actions">
            <button className="btn btn-secondary" onClick={markAllRead}>
              Mark All as Read
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔕</div>
            <h3 className="empty-title">You're all caught up!</h3>
            <p className="empty-subtitle">No new notifications right now.</p>
          </div>
        ) : (
          <div className="animate-in">
            {notifications.map(notif => (
              <div 
                key={notif._id} 
                className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                onClick={() => markAsRead(notif._id)}
              >
                <div className="notif-icon" style={{ 
                  background: notif.type === 'order' ? 'rgba(59,130,246,0.1)' : 'rgba(124,58,237,0.1)',
                  color: notif.type === 'order' ? 'var(--info)' : 'var(--accent-tertiary)'
                }}>
                  {notif.type === 'order' ? '📦' : '🔔'}
                </div>
                
                <div className="notif-content">
                  <div className="notif-title">{notif.title}</div>
                  <div className="notif-message">{notif.message}</div>
                  <div className="notif-time">
                    {getRelativeTime(notif.createdAt)}
                  </div>
                </div>
                
                {!notif.isRead && <div className="notif-unread-dot" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
