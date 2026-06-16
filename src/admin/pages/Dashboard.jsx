import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Area, AreaChart,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  DollarSign, ShoppingCart, Users, Package,
  TrendingUp, TrendingDown, ArrowRight, AlertTriangle, Star
} from 'lucide-react';
import useAdminStore from '../store/adminStore';
import { getDashboardStats, getSalesChart, getOrderStatusChart, getRecentOrders, getLowStockProducts, getTopSellingProducts } from '../adminApi';
import { useCurrency } from '../../utils/currency';

const CORAL = '#111111';

const STATUS_COLORS = {
  delivered: '#10b981', shipped: '#3b82f6', processing: '#C9A96E',
  pending: '#8b5cf6', cancelled: '#ef4444',
};

const STATUS_CONFIG = {
  delivered:  { label: 'Delivered',  bg: '#dcfce7', text: '#16a34a' },
  shipped:    { label: 'Shipped',    bg: '#dbeafe', text: '#2563eb' },
  processing: { label: 'Processing', bg: '#fef3c7', text: '#d97706' },
  pending:    { label: 'Pending',    bg: '#f3e8ff', text: '#7c3aed' },
  cancelled:  { label: 'Cancelled',  bg: '#fee2e2', text: '#dc2626' },
};

const GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)', 'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)', 'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)', 'linear-gradient(135deg,#a18cd1,#fbc2eb)',
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-sm p-5 border border-[#E8E8E4] animate-pulse">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-11 h-11 rounded-sm bg-[#E8E8E4]" />
        <div className="h-3 w-24 bg-[#E8E8E4] rounded-full" />
      </div>
      <div className="h-8 w-32 bg-[#E8E8E4] rounded-full mb-2" />
      <div className="h-3 w-28 bg-[#E8E8E4] rounded-full" />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ stat }) {
  const Icon = stat.icon;
  return (
    <div className="bg-white rounded-sm p-5 border border-[#E8E8E4] hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-sm flex items-center justify-center" style={{ background: `${CORAL}15` }}>
          <Icon size={20} style={{ color: CORAL }} />
        </div>
      </div>
      <p className="text-[#6B6B6B] text-xs font-medium mb-1">{stat.label}</p>
      <p className="text-3xl font-black text-[#111111]">{stat.value}</p>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  const { formatPrice } = useCurrency();
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E8E8E4] rounded-sm shadow-xl px-4 py-3">
        <p className="text-xs text-[#6B6B6B] mb-1">{label}</p>
        <p className="font-bold text-[#111111]">{formatPrice(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

// ─── Revenue Chart ────────────────────────────────────────────────────────────
function RevenueChart({ data }) {
  const { symbol } = useCurrency();
  return (
    <div className="bg-white rounded-sm p-5 border border-[#E8E8E4]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-[#111111]">Revenue Last 30 Days</h3>
          <p className="text-xs text-[#9E9E9E] mt-0.5">Daily revenue overview</p>
        </div>
      </div>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="coralGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CORAL} stopOpacity={0.2} />
                <stop offset="95%" stopColor={CORAL} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F8F8F6" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6B6B6B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#6B6B6B' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `${symbol}${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke={CORAL} strokeWidth={2.5}
              fill="url(#coralGradient)" dot={false} activeDot={{ r: 5, fill: CORAL }} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-60 text-[#9E9E9E] text-sm">No sales data yet</div>
      )}
    </div>
  );
}

// ─── Order Status Donut ───────────────────────────────────────────────────────
function OrderStatusChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="bg-white rounded-sm p-5 border border-[#E8E8E4]">
      <div className="mb-4">
        <h3 className="font-bold text-[#111111]">Order Status</h3>
        <p className="text-xs text-[#9E9E9E] mt-0.5">Breakdown by status</p>
      </div>
      {total > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                paddingAngle={3} dataKey="value">
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(val, name) => [`${val} orders`, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center -mt-20 mb-14 pointer-events-none">
            <p className="text-2xl font-black text-[#111111]">{total.toLocaleString()}</p>
            <p className="text-xs text-[#9E9E9E]">Total Orders</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-xs text-[#6B6B6B]">{d.name}</span>
                <span className="text-xs font-semibold text-[#111111] ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-60 text-[#9E9E9E] text-sm">No orders yet</div>
      )}
    </div>
  );
}

// ─── Recent Orders Table ──────────────────────────────────────────────────────
function RecentOrdersTable({ orders }) {
  const { formatPrice } = useCurrency();
  return (
    <div className="bg-white rounded-sm border border-[#E8E8E4] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E8E4]">
        <h3 className="font-bold text-[#111111]">Recent Orders</h3>
        <Link to="/admin/orders" className="text-xs font-semibold flex items-center gap-1 hover:underline"
          style={{ color: CORAL }}>
          View All <ArrowRight size={12} />
        </Link>
      </div>
      {orders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8E8E4]">
                {['Order #', 'Customer', 'Date', 'Items', 'Total', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#9E9E9E] uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => {
                const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
                return (
                  <tr key={i} className="border-b border-[#E8E8E4] hover:bg-[#F8F8F6]/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-[#111111] whitespace-nowrap">{o.number || o.orderNumber || `#ORD-${i}`}</td>
                    <td className="px-4 py-3 text-sm text-[#6B6B6B] whitespace-nowrap">{o.customer}</td>
                    <td className="px-4 py-3 text-xs text-[#9E9E9E] whitespace-nowrap">{o.date}</td>
                    <td className="px-4 py-3 text-sm text-[#6B6B6B] text-center">{o.items}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#111111] whitespace-nowrap">{formatPrice(o.total)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap"
                        style={{ background: sc.bg, color: sc.text }}>
                        {sc.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-[#9E9E9E] text-sm">No orders yet</div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const { setBreadcrumbs } = useAdminStore();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Dashboard', path: '/admin' }]);

    // Load all dashboard data from backend in parallel
    Promise.allSettled([
      getDashboardStats(),
      getSalesChart(30),
      getOrderStatusChart(),
      getRecentOrders(),
      getLowStockProducts(),
      getTopSellingProducts(),
    ]).then(([statsRes, salesRes, orderStatusRes, recentRes, lowStockRes, topSellingRes]) => {
      // Stats cards
      if (statsRes.status === 'fulfilled' && statsRes.value?.stats) {
        const s = statsRes.value.stats;
        setStats([
          { label: 'Total Revenue',   value: formatPrice(s.revenue || 0), icon: DollarSign },
          { label: 'Total Orders',    value: (s.totalOrders || 0).toLocaleString(),    icon: ShoppingCart },
          { label: 'Total Customers', value: (s.totalCustomers || 0).toLocaleString(), icon: Users },
          { label: 'Total Products',  value: (s.totalProducts || 0).toLocaleString(),  icon: Package },
        ]);
      } else {
        setStats([
          { label: 'Total Revenue', value: formatPrice(0), icon: DollarSign },
          { label: 'Total Orders', value: '0', icon: ShoppingCart },
          { label: 'Total Customers', value: '0', icon: Users },
          { label: 'Total Products', value: '0', icon: Package },
        ]);
      }

      // Sales chart
      if (salesRes.status === 'fulfilled') {
        const items = Array.isArray(salesRes.value) ? salesRes.value : [];
        setSalesData(items.map(d => ({ day: d.day || d._id || '', revenue: d.revenue || d.total || 0 })));
      }

      // Order status donut
      if (orderStatusRes.status === 'fulfilled') {
        const items = Array.isArray(orderStatusRes.value) ? orderStatusRes.value : [];
        setOrderStatusData(items.map(d => ({
          name: d.name || d._id || d.status || '',
          value: d.value || d.count || 0,
          color: STATUS_COLORS[(d.name || d._id || d.status || '').toLowerCase()] || '#6B6B6B',
        })));
      }

      // Recent orders
      if (recentRes.status === 'fulfilled') {
        const items = Array.isArray(recentRes.value) ? recentRes.value : [];
        setRecentOrders(items.map(o => ({
          number: o.orderNumber || o._id,
          customer: o.customer?.name || o.customerName || 'Customer',
          date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
          items: o.items?.length || o.itemCount || 0,
          total: o.total || o.totalAmount || 0,
          status: o.status || 'pending',
        })));
      }

      // Low stock
      if (lowStockRes.status === 'fulfilled') {
        const items = Array.isArray(lowStockRes.value) ? lowStockRes.value : [];
        setLowStock(items.map((p, i) => ({
          name: p.name, stock: p.stock, bg: GRADIENTS[i % GRADIENTS.length],
        })));
      }

      // Top selling
      if (topSellingRes.status === 'fulfilled') {
        const items = Array.isArray(topSellingRes.value) ? topSellingRes.value : [];
        setTopSelling(items.map((p, i) => ({
          name: p.name, sold: p.sold || p.totalSold || 0, bg: GRADIENTS[i % GRADIENTS.length],
        })));
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/admin/products"
          className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
          style={{ background: CORAL }}>
          + Add Product
        </Link>
        <Link to="/admin/orders"
          className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-sm font-semibold border-2 transition-all hover:bg-[#F8F8F6]"
          style={{ borderColor: CORAL, color: CORAL }}>
          View All Orders
        </Link>
        <Link to="/admin/coupons"
          className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-sm font-semibold border-2 transition-all hover:bg-[#F8F8F6]"
          style={{ borderColor: CORAL, color: CORAL }}>
          + Add Coupon
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map((stat) => <StatCard key={stat.label} stat={stat} />)
        }
      </div>

      {/* Charts row */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3"><RevenueChart data={salesData} /></div>
          <div className="lg:col-span-2"><OrderStatusChart data={orderStatusData} /></div>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 h-64 bg-white rounded-sm border border-[#E8E8E4] animate-pulse" />
          <div className="lg:col-span-2 h-64 bg-white rounded-sm border border-[#E8E8E4] animate-pulse" />
        </div>
      )}

      {/* Bottom row */}
      {!loading && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Recent Orders Table */}
          <div className="xl:col-span-2">
            <RecentOrdersTable orders={recentOrders} />
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Low Stock */}
            <div className="bg-white rounded-sm border border-[#E8E8E4] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E8E8E4]">
                <h3 className="font-bold text-[#111111] text-sm flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-500" /> Low Stock Alerts
                </h3>
                <Link to="/admin/products" className="text-xs font-medium hover:underline" style={{ color: CORAL }}>
                  Update
                </Link>
              </div>
              {lowStock.length > 0 ? lowStock.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#E8E8E4] last:border-0 hover:bg-[#F8F8F6]/50 transition-colors">
                  <div className="w-8 h-8 rounded-sm shrink-0" style={{ background: p.bg }} />
                  <p className="text-xs text-[#111111] font-medium flex-1 truncate">{p.name}</p>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#fee2e2', color: '#dc2626' }}>
                    {p.stock}
                  </span>
                </div>
              )) : (
                <p className="text-center py-6 text-[#9E9E9E] text-xs">No low stock items</p>
              )}
            </div>

            {/* Top Selling */}
            <div className="bg-white rounded-sm border border-[#E8E8E4] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E8E8E4]">
                <h3 className="font-bold text-[#111111] text-sm flex items-center gap-2">
                  <Star size={15} className="text-amber-400" /> Top Selling
                </h3>
              </div>
              {topSelling.length > 0 ? topSelling.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#E8E8E4] last:border-0 hover:bg-[#F8F8F6]/50 transition-colors">
                  <span className="text-xs font-black text-[#9E9E9E] w-4">{i + 1}</span>
                  <div className="w-8 h-8 rounded-sm shrink-0" style={{ background: p.bg }} />
                  <p className="text-xs text-[#111111] font-medium flex-1 truncate">{p.name}</p>
                  <span className="text-xs font-bold text-[#6B6B6B]">{(p.sold || 0).toLocaleString()}</span>
                </div>
              )) : (
                <p className="text-center py-6 text-[#9E9E9E] text-xs">No sales data yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
