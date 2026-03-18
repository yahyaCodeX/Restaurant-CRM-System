import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent to your email');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send reset email');
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

      <div className="auth-card" style={{ animation: 'slideUp 0.5s ease' }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">🔑</div>
          <div className="auth-logo-text">
            RestoCRM
            <span>Password Recovery</span>
          </div>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✉️</div>
            <h2 className="auth-title">Check your email</h2>
            <p className="auth-subtitle" style={{ marginBottom: 24, padding: '0 20px' }}>
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
            <Link to="/login" className="btn btn-primary btn-full">
              Return to Login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="auth-title">Forgot Password?</h2>
            <p className="auth-subtitle">
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-with-icon">
                  <span className="input-icon">📧</span>
                  <input type="email" className="form-input" placeholder="you@restaurant.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? (
                  <><span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Sending...</>
                ) : 'Send Reset Link →'}
              </button>
            </form>

            <div className="auth-footer">
              Remember your password? <Link to="/login">Sign in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
