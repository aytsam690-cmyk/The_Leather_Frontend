import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import { useAdminToast } from '../components/Toast';
import useAdminStore from '../store/adminStore';
import { getCoupons as apiGetCoupons, createCoupon as apiCreateCoupon, updateCoupon as apiUpdateCoupon, deleteCoupon as apiDeleteCoupon, toggleCoupon as apiToggleCoupon } from '../adminApi';

const CORAL = '#111111';
const CATS = ['Electronics', 'Fashion', 'Home & Living', 'Sports', 'Beauty'];

const MOCK_COUPONS = [
  { id:1, code:'SAVE10',    type:'percentage', value:10, minOrder:50,  used:45,  limit:100,  validUntil:'2025-12-31', active:true  },
  { id:2, code:'FLAT20',    type:'fixed',      value:20, minOrder:100, used:120, limit:200,  validUntil:'2025-08-15', active:true  },
  { id:3, code:'FREESHIP',  type:'shipping',   value:0,  minOrder:30,  used:340, limit:null, validUntil:'2025-09-01', active:true  },
  { id:4, code:'SUMMER30',  type:'percentage', value:30, minOrder:80,  used:67,  limit:150,  validUntil:'2025-07-31', active:false },
  { id:5, code:'WELCOME5',  type:'percentage', value:5,  minOrder:0,   used:890, limit:null, validUntil:'2026-01-01', active:true  },
  { id:6, code:'VIP50',     type:'fixed',      value:50, minOrder:200, used:23,  limit:50,   validUntil:'2025-06-01', active:true  },
  { id:7, code:'FLASH15',   type:'percentage', value:15, minOrder:40,  used:0,   limit:500,  validUntil:'2025-11-30', active:false },
  { id:8, code:'NEWUSER25', type:'percentage', value:25, minOrder:60,  used:55,  limit:100,  validUntil:'2025-10-15', active:true  },
];

const TYPE_BADGE = {
  percentage: { label:'% Off',          bg:'#dbeafe', text:'#1d4ed8' },
  fixed:      { label:'Fixed Amount',   bg:'#dcfce7', text:'#15803d' },
  shipping:   { label:'Free Shipping',  bg:'#f3e8ff', text:'#6d28d9' },
};

function randomCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function isExpired(dateStr) {
  return new Date(dateStr) < new Date();
}

const EMPTY_FORM = {
  code:'', type:'percentage', value:'', minOrder:'', maxDiscount:'', limit:'',
  validFrom: new Date().toISOString().split('T')[0],
  validUntil:'', active:true,
};

// ─── Coupon Form Modal ────────────────────────────────────────────────────────
function CouponModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? {
    code: initial.code, type: initial.type, value: initial.value,
    minOrder: initial.minOrderAmount || initial.minOrder || '',
    maxDiscount: initial.maxDiscount || '',
    limit: initial.limit || '',
    validFrom: initial.validFrom ? new Date(initial.validFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    validUntil: initial.validUntil ? new Date(initial.validUntil).toISOString().split('T')[0] : '',
    active: initial.active,
  } : { ...EMPTY_FORM });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cls = 'w-full border border-[#D0D0CA] rounded-sm px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#C9A96E] transition-all bg-white';


  return (
    <Modal isOpen={true} onClose={onClose} title={initial ? 'Edit Coupon' : 'Add New Coupon'} size="md"
      footer={
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 rounded-sm text-sm font-semibold text-[#6B6B6B] border border-[#D0D0CA] hover:bg-[#F8F8F6] transition-all">Cancel</button>
          <button onClick={() => onSave(form)} className="px-5 py-2.5 rounded-sm text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: CORAL }}>
            {initial ? 'Update Coupon' : 'Create Coupon'}
          </button>
        </div>
      }>
      <div className="space-y-4">
        {/* Code */}
        <div>
          <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Coupon Code *</label>
          <div className="flex gap-2">
            <input className={`${cls} font-mono uppercase`} value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. SAVE10" />
            <button onClick={() => set('code', randomCode())}
              className="px-3 py-2.5 rounded-sm border border-[#D0D0CA] text-[#6B6B6B] hover:bg-[#F8F8F6] transition-all shrink-0 flex items-center gap-1.5 text-xs font-medium">
              <RefreshCw size={13} /> Generate
            </button>
          </div>
        </div>

        {/* Discount Type */}
        <div>
          <label className="block text-xs font-semibold text-[#6B6B6B] mb-2">Discount Type</label>
          <div className="flex gap-2">
            {[['percentage','% Off'],['fixed','Fixed Amount']].map(([v, l]) => (
              <label key={v} className={`flex items-center gap-2 px-3 py-2 rounded-sm border-2 cursor-pointer text-sm transition-all ${form.type===v ? 'text-white' : 'text-[#6B6B6B] border-[#D0D0CA] hover:border-[#C9A96E]'}`}
                style={form.type===v ? { background: CORAL, borderColor: CORAL } : {}}>
                <input type="radio" className="hidden" checked={form.type===v} onChange={() => set('type', v)} />
                {l}
              </label>
            ))}
          </div>
        </div>

        {/* Value + Min Order */}
        <div className="grid grid-cols-2 gap-3">
          {form.type !== 'shipping' && (
            <div>
              <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">
                {form.type === 'percentage' ? 'Discount %' : 'Discount ($)'}
              </label>
              <input type="number" className={cls} value={form.value} onChange={e => set('value', e.target.value)} placeholder="0" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Min Order ($)</label>
            <input type="number" className={cls} value={form.minOrder} onChange={e => set('minOrder', e.target.value)} placeholder="0" />
          </div>
        </div>

        {/* Max Discount Cap (percentage only) */}
        {form.type === 'percentage' && (
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Max Discount Cap ($) — optional</label>
            <input type="number" className={cls} value={form.maxDiscount} onChange={e => set('maxDiscount', e.target.value)} placeholder="No cap" />
          </div>
        )}

        {/* Usage Limit */}
        <div>
          <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Usage Limit (blank = unlimited)</label>
          <input type="number" className={cls} value={form.limit} onChange={e => set('limit', e.target.value)} placeholder="Unlimited" />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Valid From</label>
            <input type="date" className={cls} value={form.validFrom} onChange={e => set('validFrom', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Valid Until</label>
            <input type="date" className={cls} value={form.validUntil} onChange={e => set('validUntil', e.target.value)} />
          </div>
        </div>

        {/* Active toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <button onClick={() => set('active', !form.active)}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.active ? 'bg-[#2D6A4F]' : 'bg-[#D0D0CA]'}`}>
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : ''}`} />
          </button>
          <span className="text-sm text-[#6B6B6B] font-medium">{form.active ? 'Active' : 'Inactive'}</span>
        </label>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Coupons() {
  const { setBreadcrumbs } = useAdminStore();
  const { showToast, ToastUI } = useAdminToast();
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    setBreadcrumbs([{ label:'Dashboard', path:'/admin' }, { label:'Coupons', path:'/admin/coupons' }]);
    loadCoupons();
  }, []);

  const loadCoupons = () => {
    apiGetCoupons()
      .then(data => {
        const items = Array.isArray(data) ? data : [];
        setCoupons(items.map(c => ({ ...c, id: c._id, active: c.isActive !== false, used: c.usedCount || 0, limit: c.usageLimit, minOrder: c.minOrderAmount || 0 })));
      })
      .catch(() => setCoupons([]));
  };

  const toggleActive = async (id) => {
    try {
      await apiToggleCoupon(id);
      loadCoupons();
    } catch (_) {
      setCoupons(cs => cs.map(c => c.id === id ? { ...c, active: !c.active } : c));
    }
  };

  const handleSave = async (form) => {
    try {
      const payload = {
        code: form.code?.toUpperCase(), type: form.type, value: Number(form.value),
        minOrderAmount: Number(form.minOrder) || 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.limit ? Number(form.limit) : null,
        validFrom: form.validFrom, validUntil: form.validUntil, isActive: form.active,
      };
      if (editCoupon) {
        await apiUpdateCoupon(editCoupon.id || editCoupon._id, payload);
        showToast('Coupon updated!');
      } else {
        await apiCreateCoupon(payload);
        showToast('Coupon created!');
      }
      loadCoupons();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save coupon', 'error');
    }
    setShowModal(false);
    setEditCoupon(null);
  };

  const handleDelete = async (id) => {
    try {
      await apiDeleteCoupon(id);
      showToast('Coupon deleted.', 'warning');
      loadCoupons();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete', 'error');
    }
    setConfirmDelete(null);
  };

  return (
    <div>
      <ToastUI />

      {/* Modals */}
      {showModal && (
        <CouponModal
          initial={editCoupon}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditCoupon(null); }}
        />
      )}
      {confirmDelete && (
        <Modal isOpen={true} onClose={() => setConfirmDelete(null)} title="Delete Coupon" size="sm"
          footer={
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-sm text-sm font-semibold text-[#6B6B6B] border border-[#D0D0CA] hover:bg-[#F8F8F6]">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 rounded-sm text-sm font-semibold text-white bg-[#9B2226] hover:bg-[#7A1B1E]">Delete</button>
            </div>
          }>
          <p className="text-[#6B6B6B] text-sm text-center py-4">Are you sure you want to delete this coupon? It cannot be undone.</p>
        </Modal>
      )}

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-black text-[#111111]">Coupons ({coupons.length})</h1>
        <button onClick={() => { setEditCoupon(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-sm text-sm font-semibold text-white hover:opacity-90 transition-all"
          style={{ background: CORAL }}>
          <Plus size={15} /> Add Coupon
        </button>
      </div>

      <div className="bg-white rounded-sm border border-[#E8E8E4] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8E8E4] bg-[#F8F8F6]">
                {['Code','Type','Value','Min Order','Usage','Valid Until','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#9E9E9E] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => {
                const tb = TYPE_BADGE[c.type];
                const expired = c.validUntil && isExpired(c.validUntil);
                return (
                  <tr key={c.id} className="border-b border-[#E8E8E4] hover:bg-[#F8F8F6]/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-sm" style={{ color: CORAL }}>{c.code}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: tb.bg, color: tb.text }}>{tb.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#111111]">
                      {c.type === 'percentage' ? `${c.value}%` : c.type === 'fixed' ? `$${c.value}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6B6B6B]">${c.minOrder}</td>
                    <td className="px-4 py-3 text-sm text-[#6B6B6B]">{c.used}{c.limit ? `/${c.limit}` : '/∞'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${expired ? 'text-[#9B2226]' : 'text-[#6B6B6B]'}`}>
                        {c.validUntil || '—'}
                        {expired && ' ⚠️'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(c.id)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${c.active ? 'bg-[#2D6A4F]' : 'bg-[#D0D0CA]'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${c.active ? 'translate-x-5' : ''}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditCoupon(c); setShowModal(true); }}
                          className="w-8 h-8 rounded-sm flex items-center justify-center text-[#9E9E9E] hover:text-[#C9A96E] hover:bg-[#F8F8F6] transition-all">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setConfirmDelete(c.id)}
                          className="w-8 h-8 rounded-sm flex items-center justify-center text-[#9E9E9E] hover:text-[#9B2226] hover:bg-[#FEF2F2] transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
