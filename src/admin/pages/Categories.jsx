import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, Upload, X } from 'lucide-react';
import Modal from '../components/Modal';
import { useAdminToast } from '../components/Toast';
import useAdminStore from '../store/adminStore';
import { getAdminCategories, createCategory as apiCreateCategory, updateCategory as apiUpdateCategory, deleteCategory as apiDeleteCategory, uploadImage } from '../adminApi';

const CORAL = '#111111';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_CATS = [
  {
    id: 1, name: 'Electronics', slug: 'electronics', emoji: '⚡', order: 1, active: true, productCount: 89,
    children: [
      { id: 11, name: 'Phones',     slug: 'phones',     emoji: '📱', order: 1, active: true, productCount: 34, children: [] },
      { id: 12, name: 'Laptops',    slug: 'laptops',    emoji: '💻', order: 2, active: true, productCount: 28, children: [] },
      { id: 13, name: 'Audio',      slug: 'audio',      emoji: '🎧', order: 3, active: true, productCount: 27, children: [] },
    ],
  },
  {
    id: 2, name: 'Fashion', slug: 'fashion', emoji: '👗', order: 2, active: true, productCount: 120,
    children: [
      { id: 21, name: 'Men',        slug: 'men',        emoji: '👔', order: 1, active: true, productCount: 55, children: [] },
      { id: 22, name: 'Women',      slug: 'women',      emoji: '👒', order: 2, active: true, productCount: 65, children: [] },
    ],
  },
  {
    id: 3, name: 'Home & Living', slug: 'home-living', emoji: '🏠', order: 3, active: true, productCount: 74,
    children: [
      { id: 31, name: 'Furniture',  slug: 'furniture',  emoji: '🛋️', order: 1, active: true, productCount: 30, children: [] },
      { id: 32, name: 'Kitchen',    slug: 'kitchen',    emoji: '🍳', order: 2, active: true, productCount: 44, children: [] },
    ],
  },
  {
    id: 4, name: 'Sports', slug: 'sports', emoji: '⚽', order: 4, active: true, productCount: 59,
    children: [
      { id: 41, name: 'Fitness',    slug: 'fitness',    emoji: '🏋️', order: 1, active: true, productCount: 35, children: [] },
      { id: 42, name: 'Outdoor',    slug: 'outdoor',    emoji: '🏕️', order: 2, active: false, productCount: 24, children: [] },
    ],
  },
];

const EMPTY_FORM = { name: '', slug: '', description: '', parentId: '', order: 1, active: true, image: null };

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ cat, onConfirm, onCancel }) {
  const childCount = cat?.children?.length || 0;
  return (
    <Modal isOpen={!!cat} onClose={onCancel} title="Delete Category" size="sm"
      footer={
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-sm text-sm font-semibold text-[#6B6B6B] border border-[#D0D0CA] hover:bg-[#F8F8F6] transition-all">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-sm text-sm font-semibold text-white bg-[#9B2226] hover:bg-[#7A1B1E] transition-all">Delete</button>
        </div>
      }>
      <div className="text-center py-2">
        <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-3">
          <Trash2 size={22} className="text-[#9B2226]" />
        </div>
        <p className="font-semibold text-[#111111] mb-2">Delete "{cat?.name}"?</p>
        {childCount > 0 && (
          <p className="text-sm text-[#9B2226]">⚠️ This will also delete {childCount} subcategory{childCount > 1 ? 'ies' : 'y'}.</p>
        )}
        <p className="text-xs text-[#9E9E9E] mt-2">This action cannot be undone.</p>
      </div>
    </Modal>
  );
}

// ─── Tree Node ────────────────────────────────────────────────────────────────
function TreeNode({ cat, depth, onEdit, onDelete, onDragStart, onDragOver, onDrop, dragOverId, allCats }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = cat.children?.length > 0;

  return (
    <div>
      <div
        draggable
        onDragStart={() => onDragStart(cat.id)}
        onDragOver={(e) => { e.preventDefault(); onDragOver(cat.id); }}
        onDrop={() => onDrop(cat.id)}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-sm mb-0.5 group transition-all cursor-grab active:cursor-grabbing ${
          dragOverId === cat.id ? 'border-2 border-[#C9A96E] bg-[#F0F7FF]' : 'hover:bg-[#F8F8F6]'
        }`}
        style={{ marginLeft: depth * 20 }}
      >
        <button onClick={() => setExpanded(!expanded)} className="w-5 h-5 flex items-center justify-center shrink-0">
          {hasChildren
            ? (expanded ? <ChevronDown size={14} className="text-[#9E9E9E]" /> : <ChevronRight size={14} className="text-[#9E9E9E]" />)
            : <div className="w-1.5 h-1.5 rounded-full bg-[#E8E8E4]" />}
        </button>
        <span className="text-lg shrink-0">{cat.emoji}</span>
        <span className="flex-1 text-sm font-semibold text-[#111111]">{cat.name}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#F8F8F6] text-[#6B6B6B] shrink-0">{cat.productCount}</span>
        {!cat.active && <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8E8E4] text-[#9E9E9E] shrink-0">Inactive</span>}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onEdit(cat)}
            className="w-7 h-7 rounded-sm flex items-center justify-center text-[#9E9E9E] hover:text-[#C9A96E] hover:bg-[#F8F8F6] transition-all">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(cat)}
            className="w-7 h-7 rounded-sm flex items-center justify-center text-[#9E9E9E] hover:text-[#9B2226] hover:bg-[#FEF2F2] transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {expanded && hasChildren && cat.children.map(child => (
        <TreeNode key={child.id} cat={child} depth={depth + 1}
          onEdit={onEdit} onDelete={onDelete}
          onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} dragOverId={dragOverId} allCats={allCats} />
      ))}
    </div>
  );
}

// ─── Category Form ────────────────────────────────────────────────────────────
function CategoryForm({ initial, allCats, onSave, onCancel }) {
  const [form, setForm] = useState(initial
    ? { name: initial.name, slug: initial.slug, description: initial.description || '', parentId: '', order: initial.order, active: initial.active, image: initial.image || null }
    : { ...EMPTY_FORM }
  );

  useEffect(() => {
    if (!initial) {
      setForm(f => ({ ...f, slug: f.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }));
    }
  }, [form.name]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cls = 'w-full border border-[#D0D0CA] rounded-sm px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#C9A96E] transition-all bg-white';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Parent Category</label>
        <select className={cls} value={form.parentId} onChange={e => set('parentId', e.target.value)}>
          <option value="">None (Top Level)</option>
          {allCats.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Category Name *</label>
          <input className={cls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Electronics" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Slug</label>
          <input className={cls} value={form.slug} onChange={e => set('slug', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Description</label>
        <textarea rows={3} className={`${cls} resize-none`} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description…" />
      </div>
      {/* Image upload */}
      <div>
        <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Category Image</label>
        {form.image ? (
          <div className="relative w-24 h-24 rounded-sm overflow-hidden border border-[#D0D0CA]">
            <img src={form.image} alt="preview" className="w-full h-full object-cover" />
            <button onClick={() => set('image', null)}
              className="absolute top-1 right-1 w-5 h-5 bg-[#9B2226] rounded-full text-white flex items-center justify-center">
              <X size={10} />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#D0D0CA] rounded-sm p-6 text-center cursor-pointer hover:border-[#C9A96E] transition-colors"
            onClick={() => document.getElementById('cat-img').click()}>
            <Upload size={24} className="mx-auto mb-2 text-[#9E9E9E]" />
            <p className="text-xs text-[#9E9E9E]">Drop image or click to browse</p>
            <input id="cat-img" type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files[0]; if (f) { set('image', URL.createObjectURL(f)); set('imageFile', f); } }} />
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">Sort Order</label>
          <input type="number" className={cls} value={form.order} onChange={e => set('order', e.target.value)} />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <button onClick={() => set('active', !form.active)}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.active ? 'bg-[#2D6A4F]' : 'bg-[#D0D0CA]'}`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm font-medium text-[#6B6B6B]">{form.active ? 'Active' : 'Inactive'}</span>
          </label>
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button onClick={onCancel} className="px-5 py-2.5 rounded-sm text-sm font-semibold text-[#6B6B6B] border border-[#D0D0CA] hover:bg-[#F8F8F6] transition-all">Cancel</button>
        <button onClick={() => onSave(form)} className="px-5 py-2.5 rounded-sm text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: CORAL }}>
          {initial ? 'Update Category' : 'Add Category'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Categories() {
  const { setBreadcrumbs } = useAdminStore();
  const { showToast, ToastUI } = useAdminToast();
  const [cats, setCats] = useState([]);
  const [editCat, setEditCat] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteCat, setDeleteCat] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Dashboard', path: '/admin' }, { label: 'Categories', path: '/admin/categories' }]);
    loadCategories();
  }, []);

  const loadCategories = () => {
    getAdminCategories()
      .then(data => {
        const items = Array.isArray(data) ? data : [];
        setCats(items.map(c => ({ ...c, id: c._id, emoji: c.emoji || '📦', children: c.children || [], productCount: c.productCount || 0 })));
      })
      .catch(() => setCats([]));
  };

  const handleSave = async (form) => {
    try {
      // Upload image if a new file was selected
      let imageUrl = form.image;
      if (form.imageFile) {
        try {
          const uploadResult = await uploadImage(form.imageFile);
          imageUrl = uploadResult.url;
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
        }
      }
      // Don't send blob: URLs to backend
      if (imageUrl && imageUrl.startsWith('blob:')) imageUrl = null;
      const payload = { name: form.name, slug: form.slug, description: form.description, isActive: form.active !== false, order: form.order || 0, image: imageUrl };
      if (editCat) {
        await apiUpdateCategory(editCat.id || editCat._id, payload);
        showToast('Category updated!');
      } else {
        await apiCreateCategory(payload);
        showToast('Category added!');
      }
      loadCategories();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save category', 'error');
    }
    setShowForm(false);
    setEditCat(null);
  };

  const handleDelete = async () => {
    if (!deleteCat) return;
    try {
      await apiDeleteCategory(deleteCat.id || deleteCat._id);
      showToast('Category deleted.', 'warning');
      loadCategories();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete', 'error');
    }
    setDeleteCat(null);
  };

  const handleDrop = (targetId) => {
    if (dragId === targetId) return;
    setCats(cs => {
      const from = cs.findIndex(c => c.id === dragId);
      const to = cs.findIndex(c => c.id === targetId);
      if (from === -1 || to === -1) return cs;
      const newCs = [...cs];
      const [moved] = newCs.splice(from, 1);
      newCs.splice(to, 0, moved);
      return newCs;
    });
    setDragId(null);
    setDragOverId(null);
  };

  return (
    <div>
      <ToastUI />
      <DeleteModal cat={deleteCat} onConfirm={handleDelete} onCancel={() => setDeleteCat(null)} />

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-black text-[#111111]">Categories</h1>
        <button onClick={() => { setEditCat(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-sm text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: CORAL }}>
          <Plus size={15} /> Add Category
        </button>
      </div>

      <div className="flex gap-5 items-start">
        {/* Tree */}
        <div className={`bg-white rounded-sm border border-[#E8E8E4] p-4 ${showForm ? 'w-2/5' : 'w-full'} transition-all`}>
          <p className="text-xs font-semibold text-[#9E9E9E] uppercase tracking-widest mb-3">Category Tree</p>
          {cats.map(cat => (
            <TreeNode key={cat.id} cat={cat} depth={0}
              onEdit={c => { setEditCat(c); setShowForm(true); }}
              onDelete={setDeleteCat}
              onDragStart={setDragId}
              onDragOver={setDragOverId}
              onDrop={handleDrop}
              dragOverId={dragOverId}
              allCats={cats}
            />
          ))}
        </div>

        {/* Form panel */}
        {showForm && (
          <div className="w-3/5 bg-white rounded-sm border border-[#E8E8E4] p-5">
            <h3 className="font-bold text-[#111111] mb-4">{editCat ? `Edit: ${editCat.name}` : 'Add Category'}</h3>
            <CategoryForm
              initial={editCat}
              allCats={cats}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditCat(null); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
