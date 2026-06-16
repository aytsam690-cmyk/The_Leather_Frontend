import { useState, useEffect } from 'react';
import { X, Eye, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import useAdminStore from '../store/adminStore';
import { getCustomers, toggleCustomerStatus, deleteCustomer } from '../adminApi';

const CORAL = '#111111';

const AVATAR_COLORS = ['#667eea','#f093fb','#4facfe','#43e97b','#fa709a','#a18cd1','#fddb92','#89f7fe','#ffecd2','#a1c4fd'];

const MOCK_CUSTOMERS = [
  { id:1,  name:'Alex Morrison',   email:'alex@example.com',    phone:'+1 555-0101', orders:12, spent:2340, joined:'Jan 15, 2024', status:'active' },
  { id:2,  name:'Sofia Rodriguez', email:'sofia@example.com',   phone:'+1 555-0102', orders:8,  spent:1890, joined:'Feb 3, 2024',  status:'active' },
  { id:3,  name:'James Thornton',  email:'james@example.com',   phone:'+1 555-0103', orders:3,  spent:450,  joined:'Mar 20, 2024', status:'inactive' },
  { id:4,  name:'Amara Osei',      email:'amara@example.com',   phone:'+1 555-0104', orders:21, spent:5670, joined:'Nov 8, 2023',  status:'active' },
  { id:5,  name:'Michael Chen',    email:'michael@example.com', phone:'+1 555-0105', orders:6,  spent:980,  joined:'Apr 12, 2024', status:'active' },
  { id:6,  name:'Priya Sharma',    email:'priya@example.com',   phone:'+1 555-0106', orders:15, spent:3200, joined:'Dec 1, 2023',  status:'active' },
  { id:7,  name:'Lucas Weber',     email:'lucas@example.com',   phone:'+1 555-0107', orders:2,  spent:158,  joined:'May 30, 2024', status:'inactive' },
  { id:8,  name:'Emma Johnson',    email:'emma@example.com',    phone:'+1 555-0108', orders:34, spent:8900, joined:'Sep 5, 2023',  status:'active' },
  { id:9,  name:'Omar Hassan',     email:'omar@example.com',    phone:'+1 555-0109', orders:9,  spent:1540, joined:'Jun 18, 2024', status:'active' },
  { id:10, name:'Yuki Tanaka',     email:'yuki@example.com',    phone:'+1 555-0110', orders:5,  spent:720,  joined:'Jul 2, 2024',  status:'active' },
];

const CUSTOMER_ORDERS = [
  { id:'ORD-8821', date:'Jun 13, 2025', total:448, status:'delivered' },
  { id:'ORD-8720', date:'May 22, 2025', total:299, status:'delivered' },
  { id:'ORD-8601', date:'Apr 10, 2025', total:129, status:'delivered' },
  { id:'ORD-8490', date:'Mar 5, 2025',  total:89,  status:'delivered' },
  { id:'ORD-8312', date:'Feb 18, 2025', total:149, status:'cancelled' },
];

const CUSTOMER_ADDRESSES = [
  { label:'Home',   address:'123 Main Street, Apt 4B, New York, NY 10001, USA' },
  { label:'Office', address:'456 Business Ave, Suite 200, New York, NY 10002, USA' },
];

const STATUS_CFG = {
  pending:    { label:'Pending',    bg:'#fef3c7', text:'#d97706' },
  processing: { label:'Processing', bg:'#dbeafe', text:'#2563eb' },
  shipped:    { label:'Shipped',    bg:'#f3e8ff', text:'#7c3aed' },
  delivered:  { label:'Delivered',  bg:'#dcfce7', text:'#16a34a' },
  cancelled:  { label:'Cancelled',  bg:'#fee2e2', text:'#dc2626' },
};

// ─── Skeleton Rows ─────────────────────────────────────────────────────────────
function SkeletonRows() {
  return Array.from({ length: 8 }).map((_, i) => (
    <tr key={i} className="border-b border-[#E8E8E4] animate-pulse">
      <td className="px-4 py-3"><div className="w-9 h-9 bg-[#E8E8E4] rounded-full" /></td>
      <td className="px-4 py-3"><div className="h-3 w-36 bg-[#E8E8E4] rounded-full mb-1" /><div className="h-2 w-28 bg-[#F8F8F6] rounded-full" /></td>
      <td className="px-4 py-3"><div className="h-3 w-24 bg-[#E8E8E4] rounded-full" /></td>
      <td className="px-4 py-3"><div className="h-3 w-10 bg-[#E8E8E4] rounded-full" /></td>
      <td className="px-4 py-3"><div className="h-3 w-16 bg-[#E8E8E4] rounded-full" /></td>
      <td className="px-4 py-3"><div className="h-3 w-20 bg-[#E8E8E4] rounded-full" /></td>
      <td className="px-4 py-3"><div className="h-6 w-16 bg-[#E8E8E4] rounded-full" /></td>
      <td className="px-4 py-3"><div className="w-8 h-8 bg-[#E8E8E4] rounded-sm" /></td>
    </tr>
  ));
}

// ─── Customer Drawer ──────────────────────────────────────────────────────────
function CustomerDrawer({ customer, onClose, onRefresh }) {
  const [active, setActive] = useState(customer.status === 'active');
  const [toggling, setToggling] = useState(false);
  const color = AVATAR_COLORS[(customer.id - 1) % AVATAR_COLORS.length];
  const initials = customer.name.split(' ').map(w => w[0]).join('').toUpperCase();

  const handleToggle = async () => {
    setToggling(true);
    try {
      await toggleCustomerStatus(customer.id || customer._id);
    } catch (_) {}
    setActive(a => !a);
    setToggling(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete ${customer.name}? This will also delete their reviews and cannot be undone.`)) return;
    
    try {
      await deleteCustomer(customer.id || customer._id);
      onClose();
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete customer');
    }
  };

  const avgOrder = customer.orders > 0 ? Math.round(customer.spent / customer.orders) : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-screen w-full max-w-[500px] bg-white z-50 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E8E4] shrink-0">
          <div>
            <h2 className="font-black text-[#111111]">{customer.name}</h2>
            <p className="text-xs text-[#9E9E9E] mt-0.5">Member since {customer.joined}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-sm flex items-center justify-center hover:bg-[#F8F8F6] transition-all text-[#6B6B6B]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* S1 — Profile */}
          <div className="flex items-start gap-4 p-4 rounded-sm bg-[#F8F8F6] border border-[#E8E8E4]">
            <div className="w-16 h-16 rounded-sm flex items-center justify-center text-white font-black text-xl shrink-0"
              style={{ background: color }}>
              {initials}
            </div>
            <div className="flex-1">
              <p className="font-bold text-[#111111] text-base">{customer.name}</p>
              <p className="text-sm text-[#6B6B6B] mt-0.5">{customer.email}</p>
              <p className="text-sm text-[#6B6B6B]">{customer.phone}</p>
              {customer.isGuest ? (
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background:'#EEF2FF', color:'#4338CA' }}>Guest Customer</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs font-semibold text-[#6B6B6B]">Account Status:</span>
                  <button onClick={handleToggle} disabled={toggling}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${active ? 'bg-[#2D6A4F]' : 'bg-[#D0D0CA]'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className={`text-xs font-semibold ${active ? 'text-[#2D6A4F]' : 'text-[#9E9E9E]'}`}>
                    {toggling ? 'Updating…' : active ? 'Active' : 'Inactive'}
                  </span>
                  
                  <button onClick={handleDelete} className="ml-auto text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-md transition-colors" title="Delete User">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* S2 — Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:'Total Orders', value: customer.orders },
              { label:'Total Spent',  value: `$${customer.spent.toLocaleString()}` },
              { label:'Avg Order',    value: `$${avgOrder}` },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-sm bg-[#F8F8F6] border border-[#E8E8E4] text-center">
                <p className="text-xl font-black text-[#111111]">{s.value}</p>
                <p className="text-xs text-[#9E9E9E] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* S3 — Order History */}
          <div>
            <p className="text-xs font-semibold text-[#9E9E9E] uppercase tracking-widest mb-3">Order History</p>
            <div className="rounded-sm border border-[#E8E8E4] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#F8F8F6]">
                  <tr>
                    {['Order #','Date','Total','Status'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-[#9E9E9E]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(customer.orders || []).length > 0 ? (customer.orders || []).map((o, i) => {
                    const sc = STATUS_CFG[o.orderStatus || o.status] || STATUS_CFG.pending;
                    return (
                      <tr key={i} className="border-t border-[#E8E8E4] hover:bg-[#F8F8F6]/50 transition-colors">
                        <td className="px-3 py-2.5 text-xs font-bold" style={{ color: CORAL }}>#{o.orderNumber || o._id?.slice(-6) || i+1}</td>
                        <td className="px-3 py-2.5 text-xs text-[#6B6B6B]">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-[#111111]">${o.total || 0}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: sc.bg, color: sc.text }}>
                            {sc.label}
                          </span>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={4} className="px-3 py-6 text-center text-xs text-[#9E9E9E]">No order history available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* S4 — Saved Addresses */}
          <div>
            <p className="text-xs font-semibold text-[#9E9E9E] uppercase tracking-widest mb-3">Saved Addresses</p>
            <div className="space-y-2">
              {(customer.addresses || []).length > 0 ? (customer.addresses || []).map((a, i) => (
                <div key={i} className="p-3.5 rounded-sm bg-[#F8F8F6] border border-[#E8E8E4]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${CORAL}15`, color: CORAL }}>{a.label || 'Address'}</span>
                  </div>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">{a.address || `${a.street || ''}, ${a.city || ''}`}</p>
                </div>
              )) : (
                <p className="text-sm text-[#9E9E9E] text-center py-4">No saved addresses</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Customers() {
  const { setBreadcrumbs } = useAdminStore();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [drawerCustomer, setDrawerCustomer] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const PER_PAGE = 10;

  const refreshCustomers = () => {
    setLoading(true);
    getCustomers()
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.customers || []);
        setCustomers(items.map((c, i) => ({
          id: c._id, _id: c._id, name: c.name || 'Guest', email: c.email || '—',
          phone: c.phone || '—', orders: c.totalOrders || 0,
          spent: c.totalSpent || 0,
          joined: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—',
          status: c.isGuest ? 'guest' : (c.isActive !== false ? 'active' : 'inactive'),
          isGuest: c.isGuest || false,
        })));
      })
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setBreadcrumbs([{ label:'Dashboard', path:'/admin' }, { label:'Customers', path:'/admin/customers' }]);
    refreshCustomers();
  }, []);

  const filtered = customers
    .filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !search || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      const matchStatus = !statusFilter || c.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'most-orders') return b.orders - a.orders;
      if (sortBy === 'highest-spend') return b.spent - a.spent;
      return b.id - a.id; // newest
    });

  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === paginated.length ? [] : paginated.map(c => c.id));

  const handleDelete = async (id) => {
    try { await deleteCustomer(id); } catch(_) {}
    setCustomers(c => c.filter(x => x.id !== id));
    setConfirmDelete(null);
  };

  const applyBulk = async () => {
    if (!bulkAction || selected.length === 0) return;
    if (bulkAction === 'delete') {
      if (!window.confirm(`Delete ${selected.length} customer(s)? This cannot be undone.`)) return;
      const promises = selected.map(id => deleteCustomer(id));
      try { await Promise.allSettled(promises); } catch(_) {}
      setCustomers(c => c.filter(x => !selected.includes(x.id)));
    }
    setSelected([]);
  };

  return (
    <div>
      {drawerCustomer && <CustomerDrawer customer={drawerCustomer} onClose={() => setDrawerCustomer(null)} onRefresh={refreshCustomers} />}

      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-xl font-black text-[#111111]">Customers ({customers.length})</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…"
            className="pl-4 pr-4 py-2.5 text-sm border border-[#D0D0CA] rounded-sm outline-none focus:border-[#C9A96E] transition-all w-full sm:w-56" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-[#D0D0CA] rounded-sm px-3 py-2.5 outline-none focus:border-[#C9A96E] text-[#6B6B6B] bg-white">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="guest">Guest</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="text-sm border border-[#D0D0CA] rounded-sm px-3 py-2.5 outline-none focus:border-[#C9A96E] text-[#6B6B6B] bg-white">
            <option value="newest">Newest</option>
            <option value="most-orders">Most Orders</option>
            <option value="highest-spend">Highest Spend</option>
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-[#F8F8F6] border border-[#C9A96E] rounded-sm">
          <span className="text-sm font-semibold text-orange-700">{selected.length} selected</span>
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}
            className="text-sm border border-[#C9A96E] rounded-sm px-3 py-1.5 outline-none bg-white">
            <option value="">Bulk Actions</option>
            <option value="delete">🗑 Delete</option>
          </select>
          <button onClick={applyBulk} className="px-4 py-1.5 text-sm font-semibold text-white rounded-sm" style={{ background: CORAL }}>Apply</button>
          <button onClick={() => setSelected([])} className="text-[#9E9E9E] hover:text-[#6B6B6B] ml-auto"><X size={16} /></button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-sm border border-[#E8E8E4] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8E8E4] bg-[#F8F8F6]">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={selected.length === paginated.length && paginated.length > 0} onChange={toggleAll} className="accent-orange-500" />
                </th>
                {['Customer','Phone','Orders','Total Spent','Joined','Status','Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#9E9E9E] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows /> : paginated.map((c, idx) => {
                const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                const initials = c.name.split(' ').map(w => w[0]).join('').toUpperCase();
                return (
                  <tr key={c.id} className={`border-b border-[#E8E8E4] hover:bg-[#F8F8F6]/50 transition-colors ${selected.includes(c.id) ? 'bg-[#F8F8F6]/40' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} className="accent-orange-500" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: color }}>
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#111111]">{c.name}</p>
                          <p className="text-xs text-[#9E9E9E]">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6B6B6B] whitespace-nowrap">{c.phone}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#111111] text-center">{c.orders}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#111111]">${c.spent.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-[#9E9E9E] whitespace-nowrap">{c.joined}</td>
                    <td className="px-4 py-3">
                      {c.isGuest ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background:'#EEF2FF', color:'#4338CA' }}>Guest</span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold`}
                          style={c.status === 'active' ? { background:'#dcfce7', color:'#16a34a' } : { background:'#F8F8F6', color:'#64748b' }}>
                          {c.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDrawerCustomer(c)}
                          className="w-8 h-8 rounded-sm flex items-center justify-center text-[#9E9E9E] hover:text-[#C9A96E] hover:bg-[#F8F8F6] transition-all">
                          <Eye size={15} />
                        </button>
                        {!c.isGuest && (
                          confirmDelete === c.id ? (
                            <span className="flex items-center gap-2 text-xs">
                              <span className="text-[#6B6B6B]">Sure?</span>
                              <button onClick={() => handleDelete(c.id)} className="text-[#9B2226] font-semibold hover:underline">Yes</button>
                              <button onClick={() => setConfirmDelete(null)} className="text-[#9E9E9E] hover:underline">No</button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmDelete(c.id)}
                              className="w-8 h-8 rounded-sm flex items-center justify-center text-[#9E9E9E] hover:text-[#9B2226] hover:bg-[#FEF2F2] transition-all">
                              <Trash2 size={14} />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && paginated.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-[#9E9E9E] text-sm">No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E8E4]">
            <p className="text-xs text-[#9E9E9E]">Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                className="w-8 h-8 rounded-sm flex items-center justify-center border border-[#D0D0CA] text-[#6B6B6B] hover:border-[#C9A96E] disabled:opacity-30 transition-all">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i+1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className="w-8 h-8 rounded-sm text-xs font-semibold border transition-all"
                  style={page===n ? { background: CORAL, color:'white', borderColor: CORAL } : { borderColor:'#e2e8f0', color:'#64748b' }}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                className="w-8 h-8 rounded-sm flex items-center justify-center border border-[#D0D0CA] text-[#6B6B6B] hover:border-[#C9A96E] disabled:opacity-30 transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
