import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Layout
import AppLayout from './components/layout/AppLayout';

// Restaurant Pages
import RestaurantDashboard from './pages/restaurant/Dashboard';
import Orders from './pages/restaurant/Orders';
import Customers from './pages/restaurant/Customers';
import Menu from './pages/restaurant/Menu';
import Tables from './pages/restaurant/Tables';
import Analytics from './pages/restaurant/Analytics';
import Notifications from './pages/restaurant/Notifications';
import WhatsApp from './pages/restaurant/WhatsApp';
import Profile from './pages/restaurant/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminRestaurants from './pages/admin/Restaurants';
import AdminLogs from './pages/admin/AuditLogs';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="loading-spinner" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />

      {/* Restaurant Owner */}
      <Route path="/" element={<ProtectedRoute role="restaurant_owner"><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<RestaurantDashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="customers" element={<Customers />} />
        <Route path="menu" element={<Menu />} />
        <Route path="tables" element={<Tables />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="whatsapp" element={<WhatsApp />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AppLayout isAdmin /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="restaurants" element={<AdminRestaurants />} />
        <Route path="logs" element={<AdminLogs />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1b2e',
              color: '#f8fafc',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
