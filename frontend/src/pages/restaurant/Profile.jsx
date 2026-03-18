import { useState, useEffect } from 'react';
import { restaurantApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', address: '', description: '',
    openingHours: { open: '09:00', close: '22:00' }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await restaurantApi.getProfile();
      const restaurant = data.data || {};
      const addressText = [
        restaurant.address?.street,
        restaurant.address?.city,
        restaurant.address?.state,
        restaurant.address?.zipCode,
        restaurant.address?.country,
      ]
        .filter(Boolean)
        .join(', ');

      const mondayHours = restaurant.operatingHours?.monday || {};

      setProfile({
        name: restaurant.name || '',
        email: restaurant.email || '',
        phone: restaurant.phone || '',
        address: addressText,
        description: restaurant.description || '',
        openingHours: {
          open: mondayHours.open || '09:00',
          close: mondayHours.close || '22:00',
        }
      });
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const parts = name.split('.');
      setProfile(p => ({ ...p, [parts[0]]: { ...p[parts[0]], [parts[1]]: value } }));
    } else {
      setProfile(p => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: profile.name,
        email: profile.email || '',
        phone: profile.phone,
      };

      const description = profile.description?.trim();
      if (description) {
        payload.description = description;
      }

      const address = profile.address?.trim();
      if (address) {
        payload.address = { street: address };
      }

      await restaurantApi.updateProfile(payload);
      toast.success('Profile updated successfully');
      await fetchProfile();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      toast.loading('Uploading logo...', { id: 'upload' });
      await restaurantApi.uploadLogo(formData);
      toast.success('Logo updated', { id: 'upload' });
    } catch {
      toast.error('Failed to upload logo', { id: 'upload' });
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('coverImage', file);

    try {
      toast.loading('Uploading cover...', { id: 'cover-upload' });
      await restaurantApi.uploadCover(formData);
      toast.success('Cover image updated', { id: 'cover-upload' });
      await fetchProfile();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to upload cover image', { id: 'cover-upload' });
    }
  };

  if (loading) return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
    </div>
  );

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Restaurant Profile</h2>
          <p className="page-subtitle">Manage your public information and branding.</p>
        </div>
      </div>

      <div className="two-col" style={{ gap: 30 }}>
        <div>
          <form className="card animate-in" onSubmit={handleSubmit}>
            <h3 className="font-bold mb-4">Basic Information</h3>
            
            <div className="form-group">
              <label className="form-label">Restaurant Name</label>
              <input type="text" name="name" className="form-input" value={profile.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">Business Email</label>
              <input type="email" name="email" className="form-input" value={profile.email} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" name="phone" className="form-input" value={profile.phone} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea name="address" className="form-textarea" style={{ minHeight: 60 }} value={profile.address} onChange={handleChange} />
            </div>

            <div className="two-col" style={{ gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Opening Time</label>
                <input type="time" name="openingHours.open" className="form-input" value={profile.openingHours.open} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Closing Time</label>
                <input type="time" name="openingHours.close" className="form-input" value={profile.openingHours.close} onChange={handleChange} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary mt-4" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        <div>
          <div className="card animate-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="font-bold mb-4">Brand Identity</h3>
            <p className="text-secondary text-sm mb-4">
              Your logo is visible on receipts, customer emails, and the WhatsApp AI profile.
            </p>

            <div className="form-group">
              <label className="form-label">Restaurant Logo</label>
              <div style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '30px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.02)'
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
                <div className="text-sm font-bold mb-2">Upload New Logo</div>
                <div className="text-xs text-muted mb-4">JPG, PNG up to 2MB</div>
                <label className="btn btn-secondary cursor-pointer" style={{ display: 'inline-block' }}>
                  Choose File
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                </label>
              </div>
            </div>
            
            <div className="divider" />
            
            <div className="form-group mb-0">
              <label className="form-label">Cover Image</label>
              <div className="text-sm text-secondary mb-3">
                Background image for your digital storefront.
              </div>
              <label className="btn btn-secondary cursor-pointer" style={{ width: '100%', textAlign: 'center' }}>
                Upload Cover
                <input 
                  type="file" accept="image/*" style={{ display: 'none' }} 
                  onChange={handleCoverUpload}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
