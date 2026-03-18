import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const restaurantNavItems = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/orders', icon: '📦', label: 'Orders' },
  { to: '/customers', icon: '👥', label: 'Customers' },
  { to: '/menu', icon: '🍔', label: 'Menu' },
  { to: '/tables', icon: '🪑', label: 'Tables' },
  { to: '/analytics', icon: '📊', label: 'Analytics' },
  { to: '/whatsapp', icon: '💬', label: 'WhatsApp' },
  { to: '/notifications', icon: '🔔', label: 'Notifications' },
  { to: '/profile', icon: '⚙️', label: 'Settings' },
];

const adminNavItems = [
  { to: '/admin', icon: '🏠', label: 'Dashboard' },
  { to: '/admin/restaurants', icon: '🍽️', label: 'Restaurants' },
  { to: '/admin/logs', icon: '📋', label: 'Audit Logs' },
];

export default function Sidebar({ isAdmin }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = isAdmin ? adminNavItems : restaurantNavItems;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🍽️</div>
        <div className="sidebar-logo-text">
          RestoCRM
          <span>{isAdmin ? 'Admin Panel' : 'Restaurant Panel'}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">
          {isAdmin ? 'Administration' : 'Management'}
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && <span className="sidebar-badge">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name || 'User'}</div>
          <div className="sidebar-user-role">{user?.role?.replace('_', ' ')}</div>
        </div>
        <button
          onClick={handleLogout}
          style={{ color: 'var(--text-muted)', fontSize: 16, padding: 4, cursor: 'pointer' }}
          title="Logout"
        >
          🚪
        </button>
      </div>
    </aside>
  );
}
