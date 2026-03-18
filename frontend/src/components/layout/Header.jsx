import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your restaurant' },
  '/orders': { title: 'Orders', subtitle: 'Manage and track all orders' },
  '/customers': { title: 'Customers', subtitle: 'Manage your customer base' },
  '/menu': { title: 'Menu', subtitle: 'Manage your food menu' },
  '/tables': { title: 'Tables', subtitle: 'Manage table occupancy' },
  '/analytics': { title: 'Analytics', subtitle: 'Sales performance insights' },
  '/whatsapp': { title: 'WhatsApp', subtitle: 'AI ordering integration' },
  '/notifications': { title: 'Notifications', subtitle: 'Your recent alerts' },
  '/profile': { title: 'Settings', subtitle: 'Restaurant profile & settings' },
  '/admin': { title: 'Admin Dashboard', subtitle: 'Platform overview' },
  '/admin/restaurants': { title: 'Restaurants', subtitle: 'Manage all restaurants' },
  '/admin/logs': { title: 'Audit Logs', subtitle: 'Track admin actions' },
};

export default function Header({ isAdmin }) {
  const { user } = useAuth();
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: 'RestoCRM', subtitle: '' };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">{page.title}</h1>
        {page.subtitle && <p className="header-subtitle">{page.subtitle}</p>}
      </div>
      <div className="header-right">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 14px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {isAdmin ? '🛡️ Admin' : '🍽️ Restaurant'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
