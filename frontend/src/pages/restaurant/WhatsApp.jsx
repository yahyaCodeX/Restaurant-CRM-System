import { useState, useEffect } from 'react';
import { restaurantApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function WhatsApp() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await restaurantApi.getProfile();
        setProfile(data.data);
      } catch (err) {
        toast.error('Failed to load restaurant profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="loading-spinner mx-auto mt-20" />;

  const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;
  const whatsappNumber = profile?.whatsappNumber || 'Not configured in Meta';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">WhatsApp AI Setup</h2>
          <p className="page-subtitle">Configure your Meta Developer Webhook to enable AI ordering.</p>
        </div>
      </div>

      <div className="card animate-in mb-4" style={{ background: 'linear-gradient(135deg, rgba(37,211,102,0.1), rgba(18,140,126,0.1))', borderColor: 'rgba(37,211,102,0.3)' }}>
        <div className="flex-center gap-4 mb-2">
          <div className="avatar" style={{ background: '#25D366', width: 48, height: 48, fontSize: 24 }}>💬</div>
          <div>
            <h3 className="font-bold" style={{ fontSize: 20 }}>WhatsApp AI is {whatsappNumber ? 'Active' : 'Pending'}</h3>
            <p className="text-secondary text-sm">
              Customers can text <strong className="text-primary">{whatsappNumber}</strong> to place orders automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold mb-4">Webhook Configuration</h3>
        <p className="text-sm text-secondary mb-6">
          Paste these values into your Meta App Dashboard under WhatsApp &gt; Configuration &gt; Webhook.
        </p>

        <div className="form-group">
          <label className="form-label text-muted uppercase text-sm font-bold">Callback URL</label>
          <div className="flex gap-2">
            <input 
              type="text" className="form-input" readOnly value={webhookUrl} 
              style={{ fontFamily: 'monospace', color: 'var(--info)', background: 'rgba(0,0,0,0.2)' }}
            />
            <button 
              className="btn btn-secondary"
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
                toast.success('Callback URL copied to clipboard!');
              }}
            >
              Copy
            </button>
          </div>
        </div>

        <div className="form-group mb-0">
          <label className="form-label text-muted uppercase text-sm font-bold">Verify Token</label>
          <div className="flex gap-2">
            <input 
              type="text" className="form-input" readOnly value="resto_wa_secret_2024" // Hardcoded matching backend
              style={{ fontFamily: 'monospace', color: 'var(--info)', background: 'rgba(0,0,0,0.2)' }}
            />
            <button 
              className="btn btn-secondary"
              onClick={() => {
                navigator.clipboard.writeText('resto_wa_secret_2024');
                toast.success('Token copied to clipboard!');
              }}
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <h3 className="font-bold mb-3">How it works</h3>
        <div className="text-sm text-secondary" style={{ lineHeight: 1.8 }}>
          <ol style={{ paddingLeft: 20 }}>
            <li>A customer sends a message in Roman Urdu or English to your WhatsApp business number.</li>
            <li>Our backend receives the webhook event from Meta.</li>
            <li>The message is parsed by our connected AI (Llama/OpenAI) using your current Menu items as context.</li>
            <li>An order record is instantly generated. You will see it appear under the <strong>Dashboard</strong> and <strong>Orders Board</strong>.</li>
            <li>A confirmation receipt message is sent automatically back to the customer on WhatsApp.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
