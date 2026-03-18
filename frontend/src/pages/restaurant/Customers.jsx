import { useState, useEffect } from 'react';
import { customersApi } from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await customersApi.getAll();
      setCustomers(data.data);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  if (loading) return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Customers CRM</h2>
          <p className="page-subtitle">View and manage your customer database.</p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container animate-in">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Last Order</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-muted" style={{ padding: 40 }}>
                  No customers found. {search && 'Try a different search term.'}
                </td>
              </tr>
            ) : (
              filteredCustomers.map(customer => (
                <tr key={customer._id}>
                  <td>
                    <div className="flex-center gap-3">
                      <div className="avatar">{customer.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="font-bold">{customer.name}</div>
                        {customer.whatsappId && (
                          <div className="badge badge-whatsapp" style={{ marginTop: 4 }}>WhatsApp User</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="font-bold">{customer.phone}</div>
                    <div className="text-sm text-muted">{customer.email || 'No email provided'}</div>
                  </td>
                  <td className="font-bold">{customer.totalOrders} orders</td>
                  <td className="font-bold text-accent-tertiary">PKR {customer.totalSpent.toLocaleString()}</td>
                  <td>
                    {customer.lastOrderDate ? (
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(customer.lastOrderDate), { addSuffix: true })}
                      </span>
                    ) : 'Never'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
