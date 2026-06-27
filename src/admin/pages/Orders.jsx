import { useState, useEffect, useCallback } from 'react';
import { X, Eye, ChevronLeft, ChevronRight, Printer, Trash2 } from 'lucide-react';
import useAdminStore from '../store/adminStore';
import { getAdminOrders, updateOrderStatus as apiUpdateStatus, assignTrackingId as apiAddTracking, deleteOrder as apiDeleteOrder, bulkUpdateOrders as apiBulkUpdate } from '../adminApi';
import { useCurrency } from '../../utils/currency';

const CORAL = '#111111';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_ORDERS = [
  { id:'ORD-8821', customer:'Alex Morrison',    email:'alex@example.com',   phone:'+1 555-0101', date:'Jun 13, 2025', items:3, total:448, status:'delivered',  address:'123 Main St, Apt 4B, New York, NY 10001, USA' },
  { id:'ORD-8820', customer:'Sofia Rodriguez',  email:'sofia@example.com',  phone:'+1 555-0102', date:'Jun 13, 2025', items:1, total:129, status:'shipped',    address:'456 Oak Ave, Los Angeles, CA 90001, USA' },
  { id:'ORD-8819', customer:'James Thornton',   email:'james@example.com',  phone:'+1 555-0103', date:'Jun 12, 2025', items:2, total:228, status:'processing', address:'789 Pine Rd, Chicago, IL 60601, USA' },
  { id:'ORD-8818', customer:'Amara Osei',       email:'amara@example.com',  phone:'+1 555-0104', date:'Jun 12, 2025', items:4, total:386, status:'pending',    address:'321 Elm St, Houston, TX 77001, USA' },
  { id:'ORD-8817', customer:'Michael Chen',     email:'michael@example.com',phone:'+1 555-0105', date:'Jun 12, 2025', items:1, total:299, status:'delivered',  address:'654 Maple Dr, Seattle, WA 98101, USA' },
  { id:'ORD-8816', customer:'Priya Sharma',     email:'priya@example.com',  phone:'+1 555-0106', date:'Jun 11, 2025', items:2, total:158, status:'shipped',    address:'987 Cedar Ln, Miami, FL 33101, USA' },
  { id:'ORD-8815', customer:'Lucas Weber',      email:'lucas@example.com',  phone:'+1 555-0107', date:'Jun 11, 2025', items:1, total:79,  status:'cancelled',  address:'147 Birch Blvd, Denver, CO 80201, USA' },
  { id:'ORD-8814', customer:'Emma Johnson',     email:'emma@example.com',   phone:'+1 555-0108', date:'Jun 10, 2025', items:3, total:527, status:'delivered',  address:'258 Spruce Way, Boston, MA 02101, USA' },
  { id:'ORD-8813', customer:'Omar Hassan',      email:'omar@example.com',   phone:'+1 555-0109', date:'Jun 10, 2025', items:2, total:218, status:'processing', address:'369 Willow Ct, Austin, TX 78701, USA' },
  { id:'ORD-8812', customer:'Yuki Tanaka',      email:'yuki@example.com',   phone:'+1 555-0110', date:'Jun 9,  2025', items:1, total:149, status:'shipped',    address:'741 Aspen Pl, Portland, OR 97201, USA' },
];

const ORDER_ITEMS = [
  { name:'Wireless Headphones Pro', variant:'Black / Standard', qty:1, price:149, bg:'linear-gradient(135deg,#667eea,#764ba2)' },
  { name:'Smart Watch Series X',    variant:'Silver / 44mm',   qty:1, price:299, bg:'linear-gradient(135deg,#f093fb,#f5576c)' },
];

const STATUS_CFG = {
  pending:    { label:'Pending',    bg:'#fef3c7', text:'#d97706' },
  processing: { label:'Processing', bg:'#dbeafe', text:'#2563eb' },
  shipped:    { label:'Shipped',    bg:'#f3e8ff', text:'#7c3aed' },
  delivered:  { label:'Delivered',  bg:'#dcfce7', text:'#16a34a' },
  cancelled:  { label:'Cancelled',  bg:'#fee2e2', text:'#dc2626' },
};

const ALL_STATUSES = ['pending','processing','shipped','delivered','cancelled'];

const STATUS_HISTORY = [
  { status:'Order Placed',    date:'Jun 8, 2025 · 9:02 AM',  note:'Order confirmed by system' },
  { status:'Confirmed',       date:'Jun 8, 2025 · 9:45 AM',  note:'Updated by Admin' },
  { status:'Packed',          date:'Jun 9, 2025 · 11:30 AM', note:'Ready for dispatch' },
  { status:'Shipped',         date:'Jun 10, 2025 · 2:15 PM', note:'Handed to courier' },
];

// ─── Print CSS ────────────────────────────────────────────────────────────────
const PRINT_STYLE = `
@media print {
  body > *:not(#order-print-area) { display: none !important; }
  #order-print-area { display: block !important; position: static !important; width: 100% !important; box-shadow: none !important; }
}
`;

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRows() {
  return Array.from({ length: 8 }).map((_, i) => (
    <tr key={i} className="border-b border-[#E8E8E4] animate-pulse">
      {[10, 28, 32, 16, 10, 14, 16, 8].map((w, j) => (
        <td key={j} className="px-4 py-3"><div className={`h-3 w-${w} bg-[#E8E8E4] rounded-full`} /></td>
      ))}
    </tr>
  ));
}

// ─── Order Detail Drawer ──────────────────────────────────────────────────────
function OrderDrawer({ order, onClose, onStatusChange }) {
  const [newStatus, setNewStatus] = useState(order.status);
  const [tracking, setTracking] = useState('');
  const [carrier, setCarrier] = useState('DHL');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([{ text:'Customer requested express delivery.', time:'Jun 8, 9:01 AM' }]);
  const [updating, setUpdating] = useState(false);
  const { formatPrice } = useCurrency();

  const subtotal = order.subtotal || (order.orderItems || []).reduce((s, i) => s + (i.price || 0) * (i.qty || i.quantity || 1), 0) || order.total || 0;
  const discount = order.discount || 0;
  const shippingCost = order.shippingCost || 0;
  const orderTotal = order.total || (subtotal - discount + shippingCost);
  const couponCode = order.couponCode || '';
  const sc = STATUS_CFG[order.status] || STATUS_CFG.pending;

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      await apiUpdateStatus(order.id || order._id, newStatus);
      if (onStatusChange) onStatusChange(order.id || order._id, newStatus);
    } catch (_) {}
    setUpdating(false);
  };

  const addNote = () => {
    if (!note.trim()) return;
    const now = new Date().toLocaleString('en-US',{ month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
    setNotes(n => [...n, { text: note, time: now }]);
    setNote('');
  };

  return (
    <>
      <style>{PRINT_STYLE}</style>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      {/* Drawer */}
      <div id="order-print-area"
        className="fixed right-0 top-0 h-screen w-full max-w-[600px] bg-white z-50 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E8E4] shrink-0">
          <div>
            <h2 className="font-black text-[#111111]">#{order.id}</h2>
            <p className="text-xs text-[#9E9E9E] mt-0.5">{order.date}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs font-semibold text-[#6B6B6B] border border-[#D0D0CA] hover:bg-[#F8F8F6] transition-all print:hidden">
              <Printer size={13} /> Print Invoice
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-sm flex items-center justify-center hover:bg-[#F8F8F6] transition-all text-[#6B6B6B] print:hidden">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* S1 — Customer & Shipping */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-sm bg-[#F8F8F6] border border-[#E8E8E4]">
            <div>
              <p className="text-xs font-semibold text-[#9E9E9E] uppercase tracking-widest mb-2">Customer</p>
              <p className="font-semibold text-[#111111] text-sm">{order.customer}</p>
              <p className="text-xs text-[#6B6B6B] mt-0.5">{order.email}</p>
              <p className="text-xs text-[#6B6B6B]">{order.phone}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#9E9E9E] uppercase tracking-widest mb-2">Ship To</p>
              <p className="text-sm text-[#111111] leading-relaxed">{order.address}</p>
            </div>
          </div>

          {/* S2 — Items */}
          <div>
            <p className="text-xs font-semibold text-[#9E9E9E] uppercase tracking-widest mb-3">Order Items</p>
            <div className="rounded-sm border border-[#E8E8E4] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#F8F8F6]">
                  <tr>
                    {['Product','Variant','Qty','Price','Subtotal'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-[#9E9E9E]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(order.orderItems || []).length > 0 ? (order.orderItems || []).map((item, i) => (
                    <tr key={i} className="border-t border-[#E8E8E4]">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-sm shrink-0" style={{ background: `linear-gradient(135deg,${['#667eea,#764ba2','#f093fb,#f5576c','#4facfe,#00f2fe'][i%3]})` }} />
                          <span className="font-medium text-[#111111] text-xs">{item.name || item.product?.name || 'Product'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-[#6B6B6B]">{item.variant || '—'}</td>
                      <td className="px-3 py-3 text-xs text-[#111111]">{item.qty || item.quantity || 1}</td>
                      <td className="px-3 py-3 text-xs text-[#111111]">{formatPrice(item.price || 0)}</td>
                      <td className="px-3 py-3 text-xs font-semibold text-[#111111]">{formatPrice((item.price || 0) * (item.qty || item.quantity || 1))}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-xs text-[#9E9E9E]">No item details available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* S3 — Summary */}
          <div className="p-4 rounded-sm bg-[#F8F8F6] border border-[#E8E8E4] space-y-2 text-sm">
            <div className="flex justify-between text-[#6B6B6B]"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between text-[#6B6B6B]"><span>Shipping</span><span className={shippingCost === 0 ? 'text-[#2D6A4F]' : ''}>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-[#2D6A4F]"><span>Discount {couponCode && `(${couponCode})`}</span><span>-{formatPrice(discount)}</span></div>
            )}
            <div className="flex justify-between font-black text-[#111111] text-base border-t border-[#D0D0CA] pt-2">
              <span>Total</span><span>{formatPrice(orderTotal)}</span>
            </div>
          </div>

          {/* S4 — Status Management */}
          <div>
            <p className="text-xs font-semibold text-[#9E9E9E] uppercase tracking-widest mb-3">Status Management</p>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1.5 rounded-sm text-sm font-bold" style={{ background: sc.bg, color: sc.text }}>
                {sc.label}
              </span>
              <span className="text-[#9E9E9E] text-sm">→</span>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                className="text-sm border border-[#D0D0CA] rounded-sm px-3 py-2 outline-none focus:border-[#C9A96E] bg-white text-[#111111]">
                {ALL_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
              <button onClick={handleStatusUpdate} disabled={updating}
                className="px-4 py-2 rounded-sm text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: CORAL }}>
                {updating ? 'Saving…' : 'Update'}
              </button>
            </div>

            {/* Status History Timeline */}
            <div className="relative pl-4 space-y-3">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-[#E8E8E4]" />
              {(order.statusHistory || [{ status: order.status || 'pending', note: 'Order placed' }]).map((h, i, arr) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 z-10 ${i === arr.length-1 ? 'ring-2' : ''}`}
                    style={{ background: i === arr.length-1 ? CORAL : '#10b981', ringColor: CORAL }} />
                  <div>
                    <p className="text-sm font-semibold text-[#111111] capitalize">{h.status}</p>
                    <p className="text-xs text-[#9E9E9E]">{h.date || (h.timestamp ? new Date(h.timestamp).toLocaleString() : '')} · {h.note || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* S5 — Tracking */}
          <div>
            <p className="text-xs font-semibold text-[#9E9E9E] uppercase tracking-widest mb-3">Tracking</p>
            <div className="flex gap-2">
              <select value={carrier} onChange={e => setCarrier(e.target.value)}
                className="text-sm border border-[#D0D0CA] rounded-sm px-3 py-2.5 outline-none focus:border-[#C9A96E] bg-white text-[#111111]">
                {['DHL','FedEx','UPS','Local'].map(c => <option key={c}>{c}</option>)}
              </select>
              <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Tracking number"
                className="flex-1 text-sm border border-[#D0D0CA] rounded-sm px-3 py-2.5 outline-none focus:border-[#C9A96E] text-[#111111]" />
              <button onClick={async () => { if(tracking.trim()) { try { await apiAddTracking(order._id || order.id, tracking.trim()); } catch(_) {} } }} className="px-4 py-2.5 rounded-sm text-sm font-semibold text-white" style={{ background: CORAL }}>Save</button>
            </div>
          </div>

          {/* S6 — Admin Notes */}
          <div>
            <p className="text-xs font-semibold text-[#9E9E9E] uppercase tracking-widest mb-3">Admin Notes</p>
            <div className="flex gap-2 mb-3">
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Add a note…"
                className="flex-1 text-sm border border-[#D0D0CA] rounded-sm px-3 py-2.5 outline-none focus:border-[#C9A96E] text-[#111111] resize-none" />
              <button onClick={addNote} className="px-4 py-2.5 rounded-sm text-sm font-semibold text-white self-end" style={{ background: CORAL }}>Add</button>
            </div>
            <div className="space-y-2">
              {notes.map((n, i) => (
                <div key={i} className="p-3 rounded-sm bg-[#F8F8F6] border border-[#E8E8E4]">
                  <p className="text-xs text-[#6B6B6B] mb-1">{n.time}</p>
                  <p className="text-sm text-[#111111]">{n.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const STATUS_TABS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const { setBreadcrumbs } = useAdminStore();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [bulkAction, setBulkAction] = useState('');
  const [page, setPage] = useState(1);
  const [drawerOrder, setDrawerOrder] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const PER_PAGE = 10;

  useEffect(() => {
    setBreadcrumbs([{ label:'Dashboard', path:'/aytsam-abdullah' }, { label:'Orders', path:'/aytsam-abdullah/orders' }]);
    getAdminOrders()
      .then((data) => {
        const items = data?.orders || data || [];
        setOrders(items.map(o => ({
          id: o._id || o.orderNumber, _id: o._id,
          customer: o.customer?.name || o.shippingAddress?.fullName || 'Guest',
          isGuest: o.isGuest || !o.customer,
          email: o.customer?.email || o.shippingAddress?.email || '',
          phone: o.customer?.phone || o.shippingAddress?.phone || '',
          date: new Date(o.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }),
          items: o.items?.length || 0, total: o.total || o.totalAmount || 0,
          subtotal: o.subtotal || 0,
          discount: o.discount || 0,
          couponCode: o.couponCode || '',
          shippingCost: o.shippingCost || 0,
          status: o.orderStatus || o.status || 'pending',
          address: o.shippingAddress ? `${o.shippingAddress.address1 || ''}, ${o.shippingAddress.city || ''}, ${o.shippingAddress.state || ''}` : '',
          orderItems: o.items || [],
        })));
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !search || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q);
    const matchStatus = statusTab === 'all' || o.status === statusTab;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === paginated.length ? [] : paginated.map(o => o.id));

  const applyBulk = async () => {
    if (!bulkAction || selected.length === 0) return;
    if (bulkAction === 'delete') {
      if (!window.confirm(`Delete ${selected.length} order(s)? This cannot be undone.`)) return;
      const promises = selected.map(id => apiDeleteOrder(id));
      try { await Promise.allSettled(promises); } catch(_) {}
      setOrders(o => o.filter(x => !selected.includes(x.id)));
    } else {
      try { await apiBulkUpdate(selected, bulkAction); } catch(_) {}
      setOrders(o => o.map(x => selected.includes(x.id) ? { ...x, status: bulkAction } : x));
    }
    setSelected([]);
  };

  const handleDelete = async (id) => {
    try { await apiDeleteOrder(id); } catch(_) {}
    setOrders(o => o.filter(x => x.id !== id));
    setConfirmDelete(null);
  };

  const tabCounts = STATUS_TABS.reduce((acc, s) => {
    acc[s] = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
    return acc;
  }, {});

  return (
    <div>
      {/* Drawer */}
      {drawerOrder && <OrderDrawer order={drawerOrder} onClose={() => setDrawerOrder(null)} onStatusChange={(id, status) => {
        setOrders(os => os.map(o => (o.id === id || o._id === id) ? { ...o, status } : o));
        setDrawerOrder(null);
      }} />}

      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-xl font-black text-[#111111]">Orders ({orders.length})</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order or customer…"
              className="pl-4 pr-4 py-2.5 text-sm border border-[#D0D0CA] rounded-sm outline-none focus:border-[#C9A96E] transition-all w-full sm:w-56" />
          </div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="text-sm border border-[#D0D0CA] rounded-sm px-3 py-2.5 outline-none focus:border-[#C9A96E] text-[#6B6B6B] bg-white" />
          <span className="text-[#9E9E9E] text-xs">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="text-sm border border-[#D0D0CA] rounded-sm px-3 py-2.5 outline-none focus:border-[#C9A96E] text-[#6B6B6B] bg-white" />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => { setStatusTab(s); setPage(1); }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border"
            style={statusTab === s ? { background: CORAL, color:'white', borderColor: CORAL } : { borderColor:'#e2e8f0', color:'#64748b', background:'white' }}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase()+s.slice(1)}
            <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusTab === s ? 'bg-white/30 text-white' : 'bg-[#F8F8F6] text-[#6B6B6B]'}`}>
              {tabCounts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-[#F8F8F6] border border-[#C9A96E] rounded-sm">
          <span className="text-sm font-semibold text-orange-700">{selected.length} selected</span>
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}
            className="text-sm border border-[#C9A96E] rounded-sm px-3 py-1.5 outline-none bg-white">
            <option value="">Bulk Actions</option>
            {ALL_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            <option value="delete" style={{ color: '#9B2226' }}>🗑 Delete</option>
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
                {['Order #','Customer','Date','Items','Total','Status','Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#9E9E9E] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows /> : paginated.map(o => {
                const sc = STATUS_CFG[o.status] || STATUS_CFG.pending;
                return (
                  <tr key={o.id} className={`border-b border-[#E8E8E4] hover:bg-[#F8F8F6]/50 transition-colors ${selected.includes(o.id) ? 'bg-[#F8F8F6]/40' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggleSelect(o.id)} className="accent-orange-500" />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDrawerOrder(o)} className="text-sm font-bold hover:underline" style={{ color: CORAL }}>
                        #{o.id}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-[#111111]">
                        {o.customer}
                        {o.isGuest && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold uppercase">Guest</span>}
                      </p>
                      <p className="text-xs text-[#9E9E9E]">{o.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6B6B6B] whitespace-nowrap">{o.date}</td>
                    <td className="px-4 py-3 text-sm text-center text-[#6B6B6B]">{o.items}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#111111]">{formatPrice(o.total)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap" style={{ background: sc.bg, color: sc.text }}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDrawerOrder(o)}
                          className="w-8 h-8 rounded-sm flex items-center justify-center text-[#9E9E9E] hover:text-[#C9A96E] hover:bg-[#F8F8F6] transition-all">
                          <Eye size={15} />
                        </button>
                        {confirmDelete === o.id ? (
                          <span className="flex items-center gap-2 text-xs">
                            <span className="text-[#6B6B6B]">Sure?</span>
                            <button onClick={() => handleDelete(o.id)} className="text-[#9B2226] font-semibold hover:underline">Yes</button>
                            <button onClick={() => setConfirmDelete(null)} className="text-[#9E9E9E] hover:underline">No</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmDelete(o.id)}
                            className="w-8 h-8 rounded-sm flex items-center justify-center text-[#9E9E9E] hover:text-[#9B2226] hover:bg-[#FEF2F2] transition-all">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && paginated.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-[#9E9E9E] text-sm">No orders found</td></tr>
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
