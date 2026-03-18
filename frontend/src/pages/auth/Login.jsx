import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}! 👋`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-orbs">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      {/* Floating particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            background: 'var(--accent-tertiary)',
            borderRadius: '50%',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            opacity: Math.random() * 0.4 + 0.1,
            animation: `float ${Math.random() * 6 + 5}s ease-in-out infinite`,
            animationDelay: Math.random() * 4 + 's',
          }} />
        ))}
      </div>

      <div className="auth-card" style={{ animation: 'slideUp 0.5s ease' }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">🍽️</div>
          <div className="auth-logo-text">
            RestoCRM
            <span>Restaurant Management Platform</span>
          </div>
        </div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        <a
          href="/api/auth/google"
          className="btn-google"
          style={{ marginBottom: 16 }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.2C33.8 33.6 29.4 36 24 36a12 12 0 1 1 0-24c3 0 5.7 1.1 7.8 2.8L37 9.6A20 20 0 1 0 44 24c0-1.4-.1-2.7-.4-4z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.7 1.1 7.8 2.8L37 9.6A20 20 0 0 0 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.4-5.2l-6.2-5.2A12 12 0 0 1 24 36a11.9 11.9 0 0 1-11.3-7.9L6 33.3A20 20 0 0 0 24 44z" />
            <path fill="#1976D2" d="M43.6 20H24v8h11.2a12.3 12.3 0 0 1-4 5.6l6.2 5.2A20 20 0 0 0 44 24c0-1.4-.1-2.7-.4-4z" />
          </svg>
          Continue with Google
        </a>

        <div className="auth-divider">or sign in with email</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <span className="input-icon">📧</span>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="you@restaurant.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--accent-tertiary)' }}>
                Forgot password?
              </Link>
            </div>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <span className="input-icon">🔒</span>
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: 16,
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? (
              <>
                <span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Signing in...
              </>
            ) : (
              <>Sign In →</>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/signup">Create one free</Link>
        </div>
      </div>
    </div>
  );
}
