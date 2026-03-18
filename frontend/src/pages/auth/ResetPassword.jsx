import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.password || !form.confirmPassword) return toast.error('Fill all fields');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 8) return toast.error('Password too short (min 8 chars)');

    setLoading(true);
    try {
      await authApi.resetPassword(token, { password: form.password });
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid or expired token');
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
          <div className="auth-logo-icon">🔐</div>
          <div className="auth-logo-text">
            RestoCRM
            <span>Secure Password Reset</span>
          </div>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h2 className="auth-title">Password Reset!</h2>
            <p className="auth-subtitle" style={{ marginBottom: 24 }}>
              Your password has been successfully updated.
            </p>
            <Link to="/login" className="btn btn-primary btn-full">
              Continue to Login →
            </Link>
          </div>
        ) : (
          <>
            <h2 className="auth-title">Create New Password</h2>
            <p className="auth-subtitle">Please create a strong password for your account.</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-with-icon">
                  <span className="input-icon">🔒</span>
                  <input type="password" name="password" className="form-input" placeholder="Min 8 chars"
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoFocus />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="input-with-icon">
                  <span className="input-icon">🔒</span>
                  <input type="password" name="confirmPassword" className="form-input" placeholder="Repeat password"
                    value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? (
                  <><span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Resetting...</>
                ) : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
