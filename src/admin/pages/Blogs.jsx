import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Check, Eye } from 'lucide-react';
import { getAdminBlogs, createBlog, updateBlog, deleteBlog, getAdminProducts } from '../adminApi';

const CORAL = '#111111';

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    metaDescription: '',
    content: '',
    coverImage: '',
    isActive: true,
    relatedProducts: []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBlogs();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getAdminProducts({ limit: 1000 });
      setAllProducts(data?.products || data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const data = await getAdminBlogs();
      setBlogs(data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      alert('Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (blog = null) => {
    if (blog) {
      setEditingId(blog._id);
      setFormData({
        title: blog.title,
        slug: blog.slug,
        metaDescription: blog.metaDescription || '',
        content: blog.content,
        coverImage: blog.coverImage || '',
        isActive: blog.isActive,
        relatedProducts: blog.relatedProducts ? blog.relatedProducts.map(p => typeof p === 'string' ? p : p._id) : []
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        slug: '',
        metaDescription: '',
        content: '',
        coverImage: '',
        isActive: true,
        relatedProducts: []
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.content) {
      return alert('Title, Slug, and Content are required.');
    }
    
    try {
      setSaving(true);
      if (editingId) {
        await updateBlog(editingId, formData);
      } else {
        await createBlog(formData);
      }
      closeModal();
      fetchBlogs();
    } catch (error) {
      console.error('Error saving blog:', error);
      alert(error.response?.data?.message || 'Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      await deleteBlog(id);
      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Failed to delete blog');
    }
  };

  const toggleStatus = async (blog) => {
    try {
      await updateBlog(blog._id, { isActive: !blog.isActive });
      fetchBlogs();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  // Auto-generate slug from title
  const handleTitleChange = (e) => {
    const title = e.target.value;
    if (!editingId) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormData({ ...formData, title, slug });
    } else {
      setFormData({ ...formData, title });
    }
  };

  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Blogs</h1>
          <p className="text-sm text-[#6B6B6B]">Manage your SEO blog posts (Raw HTML supported)</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-sm transition-all hover:opacity-90"
          style={{ background: CORAL }}
        >
          <Plus size={16} /> Add Blog
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 border border-[#E8E8E4] rounded-sm mb-6 flex items-center gap-3">
        <Search size={18} className="text-[#9E9E9E]" />
        <input 
          type="text" 
          placeholder="Search blogs by title or slug..." 
          className="flex-1 outline-none text-sm text-[#111111]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E8E8E4] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8E8E4] bg-[#F8F8F6]">
                <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Blog</th>
                <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E4]">
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-[#9E9E9E]">Loading...</td></tr>
              ) : filteredBlogs.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-[#9E9E9E]">No blogs found.</td></tr>
              ) : (
                filteredBlogs.map(blog => (
                  <tr key={blog._id} className="hover:bg-[#F8F8F6]/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {blog.coverImage ? (
                          <img src={blog.coverImage} alt="" className="w-12 h-12 rounded-sm object-cover bg-[#E8E8E4]" />
                        ) : (
                          <div className="w-12 h-12 rounded-sm bg-[#E8E8E4] flex items-center justify-center text-[#9E9E9E]">
                            <Eye size={16} />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-[#111111]">{blog.title}</p>
                          <p className="text-xs text-[#9E9E9E]">/{blog.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <button onClick={() => toggleStatus(blog)} className={`px-2.5 py-1 text-xs font-semibold rounded-full ${blog.isActive ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                        {blog.isActive ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-[#6B6B6B]">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a href={`/blog/${blog.slug}`} target="_blank" rel="noreferrer" className="p-1.5 text-[#9E9E9E] hover:text-[#111111] transition-colors" title="View Blog">
                          <Eye size={16} />
                        </a>
                        <button onClick={() => openModal(blog)} className="p-1.5 text-[#9E9E9E] hover:text-[#111111] transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(blog._id)} className="p-1.5 text-[#9E9E9E] hover:text-[#DC2626] transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-sm w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#E8E8E4]">
              <h2 className="text-lg font-bold text-[#111111]">{editingId ? 'Edit Blog' : 'Add New Blog'}</h2>
              <button onClick={closeModal} className="text-[#9E9E9E] hover:text-[#111111]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#6B6B6B] mb-1.5 uppercase tracking-wide">Title *</label>
                  <input type="text" required value={formData.title} onChange={handleTitleChange}
                    className="w-full border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm text-[#111111] focus:border-[#111111] outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6B6B6B] mb-1.5 uppercase tracking-wide">Slug (URL) *</label>
                  <input type="text" required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})}
                    className="w-full border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm text-[#111111] focus:border-[#111111] outline-none transition-colors" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[#6B6B6B] mb-1.5 uppercase tracking-wide">Cover Image URL</label>
                <input type="url" value={formData.coverImage} onChange={e => setFormData({...formData, coverImage: e.target.value})} placeholder="https://..."
                  className="w-full border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm text-[#111111] focus:border-[#111111] outline-none transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B6B6B] mb-1.5 uppercase tracking-wide">Meta Description (SEO)</label>
                <textarea rows="2" value={formData.metaDescription} onChange={e => setFormData({...formData, metaDescription: e.target.value})}
                  className="w-full border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm text-[#111111] focus:border-[#111111] outline-none transition-colors resize-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B6B6B] mb-1.5 uppercase tracking-wide">Related Products (Select multiple)</label>
                <select multiple value={formData.relatedProducts} onChange={e => {
                  const options = [...e.target.selectedOptions];
                  setFormData({...formData, relatedProducts: options.map(o => o.value)});
                }} className="w-full border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm text-[#111111] focus:border-[#111111] outline-none transition-colors min-h-[100px]">
                  {allProducts.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-[#9E9E9E] mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple products.</p>
              </div>

              <div className="flex-1 flex flex-col min-h-[300px]">
                <label className="block text-xs font-bold text-[#6B6B6B] mb-1.5 uppercase tracking-wide flex items-center justify-between">
                  <span>Raw HTML Content *</span>
                  <span className="normal-case font-normal text-[10px] text-[#9E9E9E]">Paste your full SEO-optimized HTML here</span>
                </label>
                <textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}
                  className="flex-1 w-full border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm font-mono text-[#111111] focus:border-[#111111] outline-none transition-colors resize-none"
                  placeholder="<h1>Your Blog Title</h1><p>Your content here...</p>" />
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 rounded-sm border-[#E8E8E4] text-[#111111] focus:ring-[#111111]" />
                <label htmlFor="isActive" className="text-sm text-[#111111]">Published (Visible to public)</label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E8E4]">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-semibold text-[#6B6B6B] hover:bg-[#F8F8F6] rounded-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-semibold text-white rounded-sm hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50" style={{ background: CORAL }}>
                  {saving ? 'Saving...' : <><Check size={16} /> Save Blog</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
