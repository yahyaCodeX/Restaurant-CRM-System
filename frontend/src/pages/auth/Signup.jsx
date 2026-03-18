import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Signup() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    restaurantName: '', restaurantPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.restaurantName || !form.restaurantPhone)
      return toast.error('Please fill all required fields');
    if (form.password !== form.confirmPassword)
      return toast.error('Passwords do not match');
    if (form.password.length < 8)
      return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await signup({
        name: form.name, email: form.email, password: form.password,
        restaurantName: form.restaurantName, restaurantPhone: form.restaurantPhone,
      });
      toast.success('Account created! Please verify your email.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
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

      <div className="auth-card" style={{ maxWidth: 500, animation: 'slideUp 0.5s ease' }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">🍽️</div>
          <div className="auth-logo-text">
            RestoCRM
            <span>Start your free account</span>
          </div>
        </div>

        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">Join thousands of restaurants managing orders smarter</p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Your Name *</label>
              <div className="input-with-icon">
                <span className="input-icon">👤</span>
                <input type="text" name="name" className="form-input" placeholder="John Doe"
                  value={form.name} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email *</label>
              <div className="input-with-icon">
                <span className="input-icon">📧</span>
                <input type="email" name="email" className="form-input" placeholder="you@email.com"
                  value={form.email} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div style={{ height: 16 }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Restaurant Name *</label>
              <div className="input-with-icon">
                <span className="input-icon">🍽️</span>
                <input type="text" name="restaurantName" className="form-input" placeholder="My Restaurant"
                  value={form.restaurantName} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Restaurant Phone *</label>
              <div className="input-with-icon">
                <span className="input-icon">📞</span>
                <input type="tel" name="restaurantPhone" className="form-input" placeholder="+92 300 1234567"
                  value={form.restaurantPhone} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div style={{ height: 16 }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password *</label>
              <div className="input-with-icon">
                <span className="input-icon">🔒</span>
                <input type="password" name="password" className="form-input" placeholder="Min 8 chars"
                  value={form.password} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirm Password *</label>
              <div className="input-with-icon">
                <span className="input-icon">🔒</span>
                <input type="password" name="confirmPassword" className="form-input" placeholder="Repeat password"
                  value={form.confirmPassword} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div style={{ 
            margin: '20px 0 16px', 
            padding: '12px 16px', 
            background: 'rgba(124,58,237,0.08)', 
            border: '1px solid rgba(124,58,237,0.2)', 
            borderRadius: 'var(--radius-sm)',
            fontSize: 13, color: 'var(--text-secondary)'
          }}>
            ℹ️ Your account will require admin approval before you can access the dashboard.
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? (
              <><span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating account...</>
            ) : 'Create Account →'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
