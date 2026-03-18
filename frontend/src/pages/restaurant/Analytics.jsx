import { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

export default function Analytics() {
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const days = period === 'today' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 365;
      const [statsRes, chartRes] = await Promise.all([
        analyticsApi.getSales({ period }),
        analyticsApi.getDailySales({ days })
      ]);
      setData(statsRes.data.data);
      setChartData(chartRes.data.data);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#12131F', border: '1px solid rgba(255,255,255,0.1)', padding: 12, borderRadius: 8 }}>
          <p className="font-bold mb-2">{label}</p>
          <p style={{ color: payload[0].color, fontSize: 13, marginBottom: 4 }}>
            Revenue: PKR {payload[0].value.toLocaleString()}
          </p>
          {payload[1] && (
            <p style={{ color: payload[1].color, fontSize: 13 }}>
              Orders: {payload[1].value}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading && !data) return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Sales Analytics</h2>
          <p className="page-subtitle">Track your revenue, best sellers, and performance.</p>
        </div>
        <select 
          className="form-select" 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
          style={{ width: 'auto', background: 'var(--bg-card)', fontWeight: 'bold' }}
        >
          <option value="today">Today</option>
          <option value="week">Past 7 Days</option>
          <option value="month">Past 30 Days</option>
          <option value="year">Past Year</option>
        </select>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div className="stat-value">PKR {data?.sales?.totalRevenue?.toLocaleString() || 0}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
          <div className="stat-icon purple">💰</div>
        </div>
        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div className="stat-value">{data?.sales?.totalOrders || 0}</div>
            <div className="stat-label">Total Orders</div>
          </div>
          <div className="stat-icon blue">📦</div>
        </div>
        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div className="stat-value">PKR {Math.round(data?.sales?.averageOrderValue || 0).toLocaleString()}</div>
            <div className="stat-label">Avg. Order Value</div>
          </div>
          <div className="stat-icon green">📈</div>
        </div>
      </div>

      <div className="two-col mb-4">
        {/* Main Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Revenue & Orders Trend</h3>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            {chartData.length === 0 ? (
              <div className="flex-center" style={{ height: '100%', justifyContent: 'center' }}>
                <span className="text-muted">Not enough data to display chart</span>
              </div>
            ) : (
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="_id" stroke="#64748B" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#64748B" fontSize={11} tickFormatter={(val) => `PKR ${(val/1000)}k`} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={11} axisLine={false} tickLine={false} hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area yAxisId="left" type="monotone" name="Revenue" dataKey="revenue" stroke="#7C3AED" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  <Area yAxisId="right" type="monotone" name="Orders" dataKey="orders" stroke="#3B82F6" strokeWidth={3} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Items Table */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Top Selling Items</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {data?.topSellingItems?.length === 0 ? (
               <div className="text-center text-muted py-5 text-sm">No items sold in this period</div>
            ) : (
              <table className="data-table" style={{ marginTop: -10 }}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty Sold</th>
                    <th>Revenue generated</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.topSellingItems?.map((item, i) => (
                    <tr key={i}>
                      <td className="font-bold">
                         <span style={{ display: 'inline-block', width: 24, fontSize: 12, color: 'var(--text-muted)' }}>#{i+1}</span>
                         {item._id}
                      </td>
                      <td className="font-bold text-accent-tertiary">{item.totalQuantity}</td>
                      <td>PKR {item.totalRevenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
