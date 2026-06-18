import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import useSettingsStore from '../store/settingsStore';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, ShoppingBag, MapPin, LogOut, Check,
  ChevronDown, ChevronUp, Plus, Lock
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { getOrders, updateProfile } from '../services/api';



// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({ user }) {
  const [form, setForm] = useState({
    name: user?.name || 'John Doe',
    email: user?.email || 'john@example.com',
    phone: user?.phone || '+1 555-0100',
    oldPassword: '',
    newPassword: '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name: form.name, email: form.email, phone: form.phone });
    } catch (err) {
      // Ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#141410] border border-[#2C2C26] rounded-sm p-5 sm:p-8">
      <h2 className="font-cormorant text-[24px] font-medium text-[#F5F0E8] mb-8">My Profile</h2>
      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <div className="sm:col-span-2">
            <label className="font-dm text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6055] mb-1.5 block">Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="bg-[#1C1C17] border border-[#2C2C26] rounded-sm px-4 py-3 font-dm text-sm text-[#F5F0E8] placeholder:text-[#6B6055] focus:border-[#C9A96E] focus:outline-none focus:ring-0 focus:shadow-[0_0_0_3px_rgba(201,169,110,0.08)] transition-all w-full" />
          </div>
          <div className="sm:col-span-2">
            <label className="font-dm text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6055] mb-1.5 block">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="bg-[#1C1C17] border border-[#2C2C26] rounded-sm px-4 py-3 font-dm text-sm text-[#F5F0E8] placeholder:text-[#6B6055] focus:border-[#C9A96E] focus:outline-none focus:ring-0 focus:shadow-[0_0_0_3px_rgba(201,169,110,0.08)] transition-all w-full" />
          </div>
          <div>
            <label className="font-dm text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6055] mb-1.5 block">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="bg-[#1C1C17] border border-[#2C2C26] rounded-sm px-4 py-3 font-dm text-sm text-[#F5F0E8] placeholder:text-[#6B6055] focus:border-[#C9A96E] focus:outline-none focus:ring-0 focus:shadow-[0_0_0_3px_rgba(201,169,110,0.08)] transition-all w-full" />
          </div>
        </div>

        <button type="submit" disabled={saving} className="bg-[#F5F0E8] hover:bg-[#C9A96E] text-[#0D0D0B] border border-[#F5F0E8] rounded-sm px-8 py-3 font-dm font-medium text-sm uppercase tracking-[0.04em] transition-colors mt-6 w-full sm:w-auto min-h-[48px]">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  delivered: { bg: '#0D2B1A', text: '#4ADE80', border: '#166534' },
  shipped: { bg: '#0D2B1A', text: '#86EFAC', border: '#14532D' },
  processing: { bg: '#1A1224', text: '#C4B5FD', border: '#4C1D95' },
  confirmed: { bg: '#0D1529', text: '#93C5FD', border: '#1E3A8A' },
  pending: { bg: '#1C1508', text: '#C9A96E', border: '#5C4010' },
  cancelled: { bg: '#1A0808', text: '#F87171', border: '#7F1D1D' },
};

function OrdersTab() {
  const [expanded, setExpanded] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    getOrders()
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.orders || []);
        setOrders(items.map(o => ({
          id: o._id || o.orderNumber,
          number: o.orderNumber || `#ORD-${o._id?.slice(-6) || ''}`,
          date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
          total: o.total || o.totalAmount || 0,
          subtotal: o.subtotal || 0,
          discount: o.discount || 0,
          couponCode: o.couponCode || '',
          shippingCost: o.shippingCost || 0,
          status: o.orderStatus || o.status || 'pending',
          items: (o.items || []).map((item) => ({
            name: item.name || item.product?.name || 'Product',
            qty: item.quantity || 1,
            price: item.price || 0,
            image: item.product?.images?.[0]?.url || null,
          })),
        })));
      })
      .catch(() => setOrders([]));
  }, []);

  const filteredOrders = filter === 'All' ? orders : orders.filter(o => o.status === filter.toLowerCase());

  return (
    <div>
      <div className="flex gap-0 border-b border-[#2C2C26] mb-6 overflow-x-auto flex-nowrap">
        {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 min-h-[44px] font-dm text-[11px] uppercase tracking-[0.08em] px-3 sm:px-5 py-3 cursor-pointer border-b-2 -mb-px transition-colors ${filter === f ? 'text-[#F5F0E8] border-[#C9A96E]' : 'text-[#6B6055] border-transparent hover:text-[#A89880]'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <p className="font-dm text-[13px] text-[#6B6055] text-center py-10">No orders found.</p>
        ) : (
          filteredOrders.map((order) => {
            const isOpen = expanded === order.id;
            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
            return (
              <div key={order.id} className="bg-[#141410] border border-[#2C2C26] rounded-sm p-4 sm:p-6 hover:border-[#3D3D34] transition-all duration-250">
                <div className="flex justify-between items-start cursor-pointer flex-wrap gap-2" onClick={() => setExpanded(isOpen ? null : order.id)}>
                  <div>
                    <p className="font-dm text-[13px] font-medium text-[#F5F0E8]">{order.number}</p>
                    <p className="font-dm text-[12px] text-[#6B6055] mt-1">{order.date} · {order.items.length} items</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-dm font-medium uppercase tracking-[0.08em] px-3 py-1 border rounded-sm" style={{ backgroundColor: sc.bg, color: sc.text, borderColor: sc.border }}>
                      {order.status}
                    </span>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={16} className="text-[#6B6055]" />
                    </motion.div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {order.items.slice(0, 4).map((item, i) => (
                    <div key={i} className="w-12 h-12 sm:w-14 sm:h-14 border border-[#2C2C26] rounded-sm object-cover bg-[#1C1C17] overflow-hidden">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#1C1C17]" />}
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 border border-[#2C2C26] rounded-sm bg-[#1C1C17] flex items-center justify-center font-dm text-[11px] text-[#6B6055]">
                      +{order.items.length - 4} more
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-[#2C2C26] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                  <p className="font-cormorant text-[18px] font-medium text-[#F5F0E8]">${order.total.toFixed(2)}</p>
                  <div className="flex gap-3">
                    {order.status === 'pending' && (
                      <button className="bg-transparent text-[#C0392B] hover:text-[#9B2226] text-[12px] uppercase tracking-[0.06em] font-medium border-none cursor-pointer px-4 min-h-[44px]">Cancel</button>
                    )}
                    <button onClick={() => setExpanded(isOpen ? null : order.id)} className="bg-transparent text-[#A89880] hover:text-[#F5F0E8] text-[12px] uppercase tracking-[0.06em] font-medium border-none cursor-pointer px-4 min-h-[44px]">
                      {isOpen ? 'Close' : 'View Details'}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
                      <div className="mt-6 pt-6 border-t border-[#2C2C26]">
                        <div className="relative pl-6">
                          {(() => {
                            const stages = [
                              { label: 'Placed' }, { label: 'Confirmed' }, { label: 'Processing' }, { label: 'Shipped' }, { label: 'Delivered' }
                            ];
                            const statusMap = { pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4, cancelled: -1 };
                            const currentIdx = statusMap[order.status] ?? 0;
                            return stages.map((stage, i) => {
                              const isActive = i === currentIdx;
                              const isDone = i < currentIdx;
                              if (order.status === 'cancelled' && i > 0) return null;
                              return (
                                <div key={stage.label} className="relative pb-6 last:pb-0 flex items-start gap-4">
                                  <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-sm border-2 flex items-center justify-center text-[12px] font-dm z-10 ${isDone ? 'bg-[#F5F0E8] border-[#F5F0E8] text-[#0D0D0B]' : isActive ? 'bg-[#1C1C17] border-[#C9A96E] text-[#C9A96E]' : 'bg-[#1C1C17] border-[#2C2C26] text-[#6B6055]'}`}>
                                      {isDone ? <Check size={14} /> : i + 1}
                                    </div>
                                    {i < stages.length - 1 && <div className="absolute top-8 bottom-0 w-px bg-[#2C2C26] mx-auto" />}
                                  </div>
                                  <div className="pt-1.5">
                                    <p className={`font-dm text-[13px] font-medium ${isDone || isActive ? 'text-[#F5F0E8]' : 'text-[#6B6055]'}`}>
                                      {order.status === 'cancelled' ? 'Cancelled' : stage.label}
                                    </p>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Addresses Tab ────────────────────────────────────────────────────────────
function AddressesTab() {
  const [addresses, setAddresses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user-addresses')) || []; } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('user-addresses', JSON.stringify(addresses)); }, [addresses]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {addresses.map((addr) => (
        <div key={addr.id} className="bg-[#141410] border border-[#2C2C26] rounded-sm p-5 relative hover:border-[#3D3D34] transition-all duration-250">
          {addr.isDefault && <span className="font-dm text-[10px] uppercase tracking-[0.08em] bg-[#1C1C17] border border-[#2C2C26] rounded-sm px-2 py-1 absolute top-4 right-4 text-[#A89880]">Default</span>}
          <div className="font-dm text-[13px] text-[#A89880] leading-relaxed mt-2">
            <strong className="text-[#F5F0E8] font-medium">{addr.label}</strong><br />
            {addr.name}<br />
            {addr.street}<br />
            {addr.city}, {addr.state} {addr.zip}<br />
            {addr.country}
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-[#2C2C26]">
            <button className="bg-transparent border-none font-dm text-[11px] uppercase tracking-[0.06em] text-[#6B6055] hover:text-[#F5F0E8] cursor-pointer p-0 min-h-[44px]">Edit</button>
            <button className="bg-transparent border-none font-dm text-[11px] uppercase tracking-[0.06em] text-[#6B6055] hover:text-[#F5F0E8] cursor-pointer p-0 min-h-[44px]" onClick={() => setAddresses(a => a.filter(x => x.id !== addr.id))}>Delete</button>
          </div>
        </div>
      ))}
      <div className="border border-dashed border-[#3D3D34] rounded-sm p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#C9A96E] transition-all min-h-[160px]">
        <Plus size={24} className="text-[#6B6055]" />
        <span className="font-dm text-[12px] uppercase tracking-[0.08em] text-[#6B6055]">Add New Address</span>
      </div>
    </div>
  );
}


// ─── Change Password Tab ──────────────────────────────────────────────────────
function ChangePasswordTab() {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  return (
    <div className="bg-[#141410] border border-[#2C2C26] rounded-sm p-5 sm:p-8">
      <h2 className="font-cormorant text-[24px] font-medium text-[#F5F0E8] mb-8">Change Password</h2>
      <form className="max-w-md space-y-5">
        {['Current Password', 'New Password', 'Confirm Password'].map(label => (
          <div key={label}>
            <label className="font-dm text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6055] mb-1.5 block">{label}</label>
            <input type="password" className="bg-[#1C1C17] border border-[#2C2C26] rounded-sm px-4 py-3 font-dm text-sm text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none focus:ring-0 focus:shadow-[0_0_0_3px_rgba(201,169,110,0.08)] transition-all w-full" />
          </div>
        ))}
        <button type="button" className="bg-[#F5F0E8] hover:bg-[#C9A96E] text-[#0D0D0B] border border-[#F5F0E8] rounded-sm px-8 py-3 font-dm font-medium text-sm uppercase tracking-[0.04em] transition-colors mt-6 w-full sm:w-auto min-h-[48px]">
          Update Password
        </button>
      </form>
    </div>
  );
}

// ─── Main Account Component ───────────────────────────────────────────────────
const NAV_TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'addresses', label: 'Addresses', icon: MapPin },

  { id: 'password', label: 'Change Password', icon: Lock },
];

export default function Account({ defaultTab = 'profile' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const settings = useSettingsStore(s => s.settings);
  const siteName = settings?.siteName || 'Store';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = (user?.name || 'User').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
    <Helmet>
      <title>{`My Account | ${siteName}`}</title>
      <meta name="description" content={`Manage your ${siteName} account, orders, and wishlist.`} />
      <link rel="canonical" href={window.location.origin + '/account'} />
      <meta property="og:title" content={`My Account | ${siteName}`} />
      <meta property="og:description" content={`Manage your ${siteName} account, orders, and wishlist.`} />
      <meta property="og:url" content={window.location.origin + '/account'} />
    </Helmet>
    <div className="min-h-screen bg-[#0D0D0B]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <p className="font-dm text-[11px] font-medium uppercase tracking-[0.12em] text-[#C9A96E] mb-3">My Account</p>
          <h1 className="font-cormorant text-[32px] font-medium text-[#F5F0E8] leading-tight">Welcome, {user?.name?.split(' ')[0] || 'User'}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          <div className="bg-[#141410] border border-[#2C2C26] rounded-sm lg:p-6 lg:self-start lg:sticky lg:top-24">
            <div className="hidden lg:block text-center pb-6 border-b border-[#2C2C26] mb-6">
              <div className="w-16 h-16 rounded-sm bg-[#1C1C17] border border-[#2C2C26] font-cormorant text-[22px] font-medium text-[#F5F0E8] flex items-center justify-center mx-auto">
                {initials}
              </div>
              <p className="font-dm text-[14px] font-medium text-[#F5F0E8] mt-4">{user?.name || 'John Doe'}</p>
              <p className="font-dm text-[12px] text-[#6B6055] mt-1">{user?.email || 'john@example.com'}</p>
            </div>

            <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-0 lg:space-y-0.5">
              {NAV_TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)} className={`flex-shrink-0 flex items-center gap-2 lg:gap-3 px-4 py-3 font-dm text-[12px] lg:text-[13px] cursor-pointer rounded-sm transition-colors border-none lg:w-full ${activeTab === id ? 'bg-[#1C1C17] text-[#F5F0E8] font-medium' : 'bg-transparent text-[#A89880] hover:bg-[#1C1C17] hover:text-[#F5F0E8]'}`}>
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </nav>

            <button onClick={handleLogout} className="lg:mt-6 lg:pt-6 lg:border-t border-[#2C2C26] border-l-0 border-r-0 border-b-0 bg-transparent flex-shrink-0 flex items-center gap-2 lg:gap-3 font-dm text-[12px] lg:text-[13px] text-[#C0392B] hover:text-[#9B2226] cursor-pointer px-4 py-2.5 lg:w-full rounded-sm hover:bg-[#1C1C17] transition-colors min-h-[44px]">
              <LogOut size={16} /> Logout
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
                {activeTab === 'profile' && <ProfileTab user={user} />}
                {activeTab === 'orders' && <OrdersTab />}
                {activeTab === 'addresses' && <AddressesTab />}

                {activeTab === 'password' && <ChangePasswordTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
