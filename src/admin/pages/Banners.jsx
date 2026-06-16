import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Upload, X, GripVertical } from 'lucide-react';
import Modal from '../components/Modal';
import { useAdminToast } from '../components/Toast';
import useAdminStore from '../store/adminStore';
import { getBanners as apiGetBanners, createBanner as apiCreateBanner, updateBanner as apiUpdateBanner, deleteBanner as apiDeleteBanner, uploadImage } from '../adminApi';

const CORAL = '#111111';

const POSITIONS = ['Home Hero', 'Category Banner', 'Promotional Strip', 'Sidebar'];

const MOCK_BANNERS = [
  { id:1, title:'Summer Sale — Up to 50% Off', subtitle:'Shop the hottest deals of the season', btn:'Shop Now', link:'https://shopverse.com/sale', position:'Home Hero', order:1, active:true, bg:'linear-gradient(135deg,#ff6b6b,#fbbf24)' },
  { id:2, title:'New Arrivals in Electronics', subtitle:'Be the first to own the latest tech', btn:'Explore', link:'https://shopverse.com/electronics', position:'Category Banner', order:2, active:true, bg:'linear-gradient(135deg,#667eea,#764ba2)' },
  { id:3, title:'Free Shipping on Orders $50+', subtitle:'No code needed — automatically applied', btn:'Start Shopping', link:'https://shopverse.com/products', position:'Promotional Strip', order:3, active:true, bg:'linear-gradient(135deg,#43e97b,#38f9d7)' },
  { id:4, title:'Weekend Flash Sale', subtitle:'24 hours only — grab your favorites', btn:'Hurry Up', link:'https://shopverse.com/flash', position:'Home Hero', order:4, active:false, bg:'linear-gradient(135deg,#fa709a,#fee140)' },
];

const EMPTY_FORM = { title:'', subtitle:'', btn:'Shop Now', link:'', position:'Home Hero', order:1, startDate:'', endDate:'', active:true, image:null, bg:'linear-gradient(135deg,#667eea,#764ba2)' };

// ─── Banner Form Modal ────────────────────────────────────────────────────────
function BannerModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? { ...initial } : { ...EMPTY_FORM });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cls = 'w-full border border-[#D0D0CA] rounded-sm px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#C9A96E] transition-all bg-white';

  return (
    <Modal isOpen={true} onClose={onClose} title={initial ? 'Edit Banner' : 'Add New Banner'} size="lg"
      footer={
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 rounded-sm text-sm font-semibold text-[#6B6B6B] border border-[#D0D0CA] hover:bg-[#F8F8F6] transition-all">Cancel</button>
          <button onClick={() => onSave(form)} className="px-5 py-2.5 rounded-sm text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: CORAL }}>
            {initial ? 'Update Banner' : 'Add Banner'}
          </button>
        </div>
      }>
      <div className="space-y-4">
        {/* Image upload */}
        <div>
          <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Banner Image</label>
          {form.image ? (
            <div className="relative rounded-sm overflow-hidden border border-[#D0D0CA] h-32">
              <img src={form.image} alt="preview" className="w-full h-full object-cover" />
              <button onClick={() => set('image', null)}
                className="absolute top-2 right-2 w-6 h-6 bg-[#9B2226] rounded-full text-white flex items-center justify-center">
                <X size={11} />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-[#D0D0CA] rounded-sm h-32 flex flex-col items-center justify-center cursor-pointer hover:border-[#C9A96E] transition-colors"
              onClick={() => document.getElementById('banner-img').click()}>
              <Upload size={24} className="mb-2 text-[#9E9E9E]" />
              <p className="text-xs text-[#9E9E9E]">Drop image or click to browse</p>
              <input id="banner-img" type="file" accept="image/*" className="hidden"
                onChange={e => { 
                  const f = e.target.files[0]; 
                  if (f) {
                    set('imageFile', f);
                    set('image', URL.createObjectURL(f)); 
                  }
                }} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Title *</label>
            <input className={cls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Banner headline" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Subtitle</label>
            <input className={cls} value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Supporting text" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Button Text</label>
            <input className={cls} value={form.btn} onChange={e => set('btn', e.target.value)} placeholder="Shop Now" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Button Link URL</label>
            <input className={cls} value={form.link} onChange={e => set('link', e.target.value)} placeholder="https://…" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Position</label>
            <select className={cls} value={form.position} onChange={e => set('position', e.target.value)}>
              {POSITIONS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Display Order</label>
            <input type="number" className={cls} value={form.order} onChange={e => set('order', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Start Date (optional)</label>
            <input type="date" className={cls} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">End Date (optional)</label>
            <input type="date" className={cls} value={form.endDate} onChange={e => set('endDate', e.target.value)} />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <button onClick={() => set('active', !form.active)}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.active ? 'bg-[#2D6A4F]' : 'bg-[#D0D0CA]'}`}>
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : ''}`} />
          </button>
          <span className="text-sm font-medium text-[#6B6B6B]">{form.active ? 'Active' : 'Inactive'}</span>
        </label>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Banners() {
  const { setBreadcrumbs } = useAdminStore();
  const { showToast, ToastUI } = useAdminToast();
  const [banners, setBanners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editBanner, setEditBanner] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  useEffect(() => {
    setBreadcrumbs([{ label:'Dashboard', path:'/admin' }, { label:'Banners', path:'/admin/banners' }]);
    loadBanners();
  }, []);

  const loadBanners = () => {
    apiGetBanners()
      .then(data => {
        const items = Array.isArray(data) ? data : [];
        setBanners(items.map(b => ({ ...b, id: b._id, active: b.isActive !== false })));
      })
      .catch(() => setBanners([]));
  };

  const handleSave = async (form) => {
    try {
      let imageUrl = form.image;
      if (form.imageFile) {
        const uploadRes = await uploadImage(form.imageFile);
        imageUrl = uploadRes.url;
      }
      const payload = { title: form.title, subtitle: form.subtitle, btn: form.btn, link: form.link, position: form.position, order: form.order, isActive: form.active, bg: form.bg, image: imageUrl };
      if (editBanner) {
        await apiUpdateBanner(editBanner.id || editBanner._id, payload);
        showToast('Banner updated!');
      } else {
        await apiCreateBanner(payload);
        showToast('Banner added!');
      }
      loadBanners();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save banner', 'error');
    }
    setShowModal(false); setEditBanner(null);
  };

  const toggleActive = async (id) => {
    const b = banners.find(x => x.id === id);
    if (b) {
      try {
        await apiUpdateBanner(id, { isActive: !b.active });
        loadBanners();
      } catch (_) {
        setBanners(bs => bs.map(x => x.id === id ? { ...x, active: !x.active } : x));
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiDeleteBanner(id);
      showToast('Banner deleted.', 'warning');
      loadBanners();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete', 'error');
    }
    setConfirmDelete(null);
  };

  const handleDrop = (targetId) => {
    if (dragId === targetId) return;
    setBanners(bs => {
      const from = bs.findIndex(b => b.id === dragId);
      const to   = bs.findIndex(b => b.id === targetId);
      if (from < 0 || to < 0) return bs;
      const arr = [...bs];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
    setDragId(null); setDragOverId(null);
  };

  const activeBanners = banners.filter(b => b.active);

  return (
    <div>
      <ToastUI />

      {showModal && <BannerModal initial={editBanner} onSave={handleSave} onClose={() => { setShowModal(false); setEditBanner(null); }} />}

      {confirmDelete && (
        <Modal isOpen={true} onClose={() => setConfirmDelete(null)} title="Delete Banner" size="sm"
          footer={<div className="flex gap-2 justify-end">
            <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-sm text-sm font-semibold text-[#6B6B6B] border border-[#D0D0CA]">Cancel</button>
            <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 rounded-sm text-sm font-semibold text-white bg-[#9B2226]">Delete</button>
          </div>}>
          <p className="text-[#6B6B6B] text-sm text-center py-4">Delete this banner permanently?</p>
        </Modal>
      )}

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-black text-[#111111]">Banners</h1>
        <button onClick={() => { setEditBanner(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-sm text-sm font-semibold text-white hover:opacity-90 transition-all"
          style={{ background: CORAL }}>
          <Plus size={15} /> Add Banner
        </button>
      </div>

      {/* Live Preview strip */}
      <div className="bg-white rounded-sm border border-[#E8E8E4] p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[#111111] text-sm">Live Preview</h3>
          <span className="text-xs text-[#9E9E9E]">Currently showing {activeBanners.length} banner{activeBanners.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {activeBanners.map(b => (
            <div key={b.id} className="shrink-0 w-48 h-24 rounded-sm overflow-hidden relative"
              style={{ background: b.bg }}>
              <div className="absolute inset-0 flex flex-col justify-end p-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
                <p className="text-white text-xs font-bold truncate">{b.title}</p>
                <p className="text-white/70 text-[10px] truncate">{b.subtitle}</p>
              </div>
              <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 text-white">{b.position}</span>
            </div>
          ))}
          {activeBanners.length === 0 && <p className="text-[#9E9E9E] text-sm py-4">No active banners</p>}
        </div>
      </div>

      {/* Banner list */}
      <div className="space-y-2">
        {banners.map(b => (
          <div key={b.id}
            draggable
            onDragStart={() => setDragId(b.id)}
            onDragOver={(e) => { e.preventDefault(); setDragOverId(b.id); }}
            onDrop={() => handleDrop(b.id)}
            className={`flex items-center gap-4 bg-white rounded-sm border p-3 transition-all ${dragOverId === b.id ? 'border-[#C9A96E] bg-[#F0F7FF]' : 'border-[#E8E8E4]'}`}
          >
            <div className="text-[#9E9E9E] cursor-grab"><GripVertical size={18} /></div>
            <div className="w-28 h-14 rounded-sm overflow-hidden shrink-0" style={{ background: b.bg }}>
              {b.image && <img src={b.image} alt={b.title} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#111111] truncate">{b.title}</p>
              <p className="text-xs text-[#9E9E9E] truncate">{b.link}</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#F8F8F6] text-[#6B6B6B] shrink-0 whitespace-nowrap">{b.position}</span>
            <button onClick={() => toggleActive(b.id)}
              className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${b.active ? 'bg-[#2D6A4F]' : 'bg-[#D0D0CA]'}`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${b.active ? 'translate-x-5' : ''}`} />
            </button>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => { setEditBanner(b); setShowModal(true); }}
                className="w-8 h-8 rounded-sm flex items-center justify-center text-[#9E9E9E] hover:text-[#C9A96E] hover:bg-[#F8F8F6] transition-all">
                <Pencil size={14} />
              </button>
              <button onClick={() => setConfirmDelete(b.id)}
                className="w-8 h-8 rounded-sm flex items-center justify-center text-[#9E9E9E] hover:text-[#9B2226] hover:bg-[#FEF2F2] transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
