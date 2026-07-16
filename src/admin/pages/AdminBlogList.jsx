// BLOG FEATURE — PATCH 5 — ADMIN PANEL
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Eye, Pin, CheckCircle, XCircle } from 'lucide-react';
import adminApi from '../adminApi';

const CORAL = '#111111';

export default function AdminBlogList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.get('/admin/blog', {
        params: { page, limit: 10, status: statusFilter, category: categoryFilter, search: searchTerm }
      });
      setPosts(res.data.posts || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter, searchTerm]);

  const fetchCategories = async () => {
    try {
      const res = await adminApi.get('/blog/categories'); // Public route
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await adminApi.delete(`/admin/blog/${id}`);
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const toggleStatus = async (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      await adminApi.patch(`/admin/blog/${post._id}/status`, { status: newStatus });
      fetchPosts();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const togglePin = async (id) => {
    try {
      await adminApi.patch(`/admin/blog/${id}/pin`);
      fetchPosts();
    } catch (err) {
      alert('Failed to pin/unpin');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'published') return 'bg-[#ECFDF5] text-[#059669]'; // success green
    if (status === 'draft') return 'bg-[#FEF3C7] text-[#D97706]'; // warning yellow
    return 'bg-[#F3F4F6] text-[#6B7280]'; // archived gray
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Blog Posts</h1>
          <p className="text-sm text-[#6B6B6B]">Manage your blog content and articles</p>
        </div>
        <button
          onClick={() => navigate('/admin/blog/create')}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-sm transition-all hover:opacity-90"
          style={{ background: CORAL }}
        >
          <Plus size={16} /> New Post
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 border border-[#E8E8E4] rounded-sm mb-6 flex flex-wrap items-center gap-4">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm text-[#111111] outline-none">
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className="border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm text-[#111111] outline-none">
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <div className="flex-1 min-w-[200px] flex items-center gap-2 border border-[#E8E8E4] rounded-sm px-3 py-2">
          <Search size={16} className="text-[#9E9E9E]" />
          <input type="text" placeholder="Search by title..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} className="flex-1 outline-none text-sm text-[#111111]" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E8E8E4] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-[#E8E8E4] bg-[#F8F8F6]">
                <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Post</th>
                <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Category</th>
                <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Stats</th>
                <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E4]">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-[#9E9E9E]">Loading...</td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-[#9E9E9E]">No posts found.</td></tr>
              ) : (
                posts.map(post => (
                  <tr key={post._id} className="hover:bg-[#F8F8F6]/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={post.featuredImage || 'https://via.placeholder.com/50'} alt="" className="w-12 h-12 rounded-sm object-cover bg-[#E8E8E4]" />
                        <div>
                          <p className="text-sm font-medium text-[#111111] max-w-[250px] truncate" title={post.title}>{post.title}</p>
                          <p className="text-xs text-[#9E9E9E]">{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[#6B6B6B]">{post.category?.name || '—'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full ${getStatusColor(post.status)}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-[#6B6B6B]">{post.views || 0} views</p>
                      <p className="text-xs text-[#6B6B6B]">{post.linkedProducts?.length || 0} products</p>
                    </td>
                    <td className="p-4 text-sm text-[#6B6B6B]">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => togglePin(post._id)} className={`p-1.5 transition-colors ${post.isPinned ? 'text-[#D97706]' : 'text-[#9E9E9E] hover:text-[#111111]'}`} title={post.isPinned ? 'Unpin' : 'Pin to top'}>
                          <Pin size={16} fill={post.isPinned ? 'currentColor' : 'none'} />
                        </button>
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="p-1.5 text-[#9E9E9E] hover:text-[#111111] transition-colors" title="Preview">
                          <Eye size={16} />
                        </a>
                        <button onClick={() => toggleStatus(post)} className="p-1.5 text-[#9E9E9E] hover:text-[#111111] transition-colors" title="Toggle Status">
                          {post.status === 'published' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button onClick={() => navigate(`/admin/blog/edit/${post._id}`)} className="p-1.5 text-[#9E9E9E] hover:text-[#111111] transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(post._id)} className="p-1.5 text-[#9E9E9E] hover:text-[#DC2626] transition-colors" title="Delete">
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#E8E8E4] flex justify-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 flex items-center justify-center rounded-sm text-sm border ${page === i + 1 ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#6B6B6B] border-[#E8E8E4] hover:bg-[#F8F8F6]'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
