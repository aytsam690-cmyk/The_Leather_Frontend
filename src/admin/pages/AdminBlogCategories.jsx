// BLOG FEATURE — PATCH 5 — ADMIN PANEL
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import adminApi from '../adminApi';

const CORAL = '#111111';

export default function AdminBlogCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', coverImage: '' });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get('/blog/categories');
      setCategories(res.data || []);
    } catch (e) { } finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openModal = (cat = null) => {
    if (cat) {
      setEditingId(cat._id);
      setFormData({ name: cat.name, slug: cat.slug, description: cat.description || '', coverImage: cat.coverImage || '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', slug: '', description: '', coverImage: '' });
    }
    setModalOpen(true);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    if (!editingId) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormData({ ...formData, name, slug });
    } else {
      setFormData({ ...formData, name });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await adminApi.put(`/admin/blog/categories/${editingId}`, formData);
      else await adminApi.post('/admin/blog/categories', formData);
      setModalOpen(false);
      fetchCategories();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? If it has posts, they will lose this category.')) return;
    try {
      await adminApi.delete(`/admin/blog/categories/${id}`, { data: { force: true } });
      fetchCategories();
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Blog Categories</h1>
          <p className="text-sm text-[#6B6B6B]">Manage categories for your blog posts</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-sm hover:opacity-90 transition-all" style={{ background: CORAL }}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="bg-white border border-[#E8E8E4] rounded-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E8E8E4] bg-[#F8F8F6]">
              <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase">Category</th>
              <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase">Slug</th>
              <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E8E4]">
            {loading ? <tr><td colSpan="3" className="p-8 text-center text-[#9E9E9E]">Loading...</td></tr>
             : categories.length === 0 ? <tr><td colSpan="3" className="p-8 text-center text-[#9E9E9E]">No categories found.</td></tr>
             : categories.map(cat => (
              <tr key={cat._id} className="hover:bg-[#F8F8F6]/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {cat.coverImage && <img src={cat.coverImage} className="w-10 h-10 rounded-sm object-cover bg-[#E8E8E4]" alt="" />}
                    <span className="text-sm font-medium text-[#111111]">{cat.name}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-[#6B6B6B]">{cat.slug}</td>
                <td className="p-4 text-right">
                  <button onClick={() => openModal(cat)} className="p-1.5 text-[#9E9E9E] hover:text-[#111111] transition-colors" title="Edit"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(cat._id)} className="p-1.5 text-[#9E9E9E] hover:text-[#DC2626] transition-colors" title="Delete"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-sm w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#E8E8E4]">
              <h2 className="text-lg font-bold text-[#111111]">{editingId ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-[#9E9E9E] hover:text-[#111111]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6B6B6B] mb-1.5 uppercase">Name *</label>
                <input type="text" required value={formData.name} onChange={handleNameChange} className="w-full border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm outline-none focus:border-[#111111]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B6B6B] mb-1.5 uppercase">Slug *</label>
                <input type="text" required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm outline-none focus:border-[#111111]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B6B6B] mb-1.5 uppercase">Cover Image URL</label>
                <input type="url" value={formData.coverImage} onChange={e => setFormData({...formData, coverImage: e.target.value})} className="w-full border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm outline-none focus:border-[#111111]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B6B6B] mb-1.5 uppercase">Description</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm outline-none focus:border-[#111111] resize-none" />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-5 py-2 text-sm font-semibold text-white rounded-sm hover:opacity-90" style={{ background: CORAL }}>Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
