import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Pencil, Trash2, Upload, ChevronLeft, ChevronRight,
  ArrowLeft, Loader2, Eye,
} from 'lucide-react';
import { useAdminToast } from '../components/Toast';
import {
  getAdminPosts, createPost as apiCreatePost, updatePost as apiUpdatePost,
  deletePost as apiDeletePost, getBlogCategories, getBlogTags, uploadBlogImage,
} from '../adminApi';

const CORAL = '#111111';

const inputCls = 'w-full border border-[#D0D0CA] rounded-sm px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#C9A96E] transition-all bg-white';
const labelCls = 'block text-xs font-semibold text-[#6B6B6B] mb-1.5';

const STATUS_BADGE = {
  draft:     { label: 'Draft',     bg: '#F8F8F6', text: '#64748b' },
  published: { label: 'Published', bg: '#dcfce7', text: '#16a34a' },
  scheduled: { label: 'Scheduled', bg: '#fef9c3', text: '#ca8a04' },
};

const slugify = (str) =>
  String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

// datetime-local wants "YYYY-MM-DDTHH:mm"; convert to/from ISO.
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};

const EMPTY = {
  title: '', slug: '', excerpt: '', content: '', featuredImage: '',
  category: '', tags: [], status: 'draft', publishedAt: '',
  metaTitle: '', metaDescription: '', canonicalUrl: '', ogImage: '',
  robots: { index: true, follow: true },
};

// ─── Section wrapper (outside form component so it isn't remounted) ────────────
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-sm border border-[#E8E8E4] p-5 mb-4">
      <h3 className="font-bold text-[#111111] mb-4 pb-3 border-b border-[#E8E8E4]">{title}</h3>
      {children}
    </div>
  );
}

// ─── Post Form ─────────────────────────────────────────────────────────────────
function PostForm({ initial, categories, tags, onSave, onCancel, saving }) {
  const [form, setForm] = useState(() => {
    if (!initial) return { ...EMPTY };
    return {
      title: initial.title || '',
      slug: initial.slug || '',
      excerpt: initial.excerpt || '',
      content: initial.content || '',
      featuredImage: initial.featuredImage || '',
      category: initial.category?._id || initial.category || '',
      tags: (initial.tags || []).map((t) => (typeof t === 'string' ? t : t._id)),
      status: initial.status || 'draft',
      publishedAt: toLocalInput(initial.publishedAt),
      metaTitle: initial.metaTitle || '',
      metaDescription: initial.metaDescription || '',
      canonicalUrl: initial.canonicalUrl || '',
      ogImage: initial.ogImage || '',
      robots: {
        index: initial.robots?.index !== false,
        follow: initial.robots?.follow !== false,
      },
    };
  });
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm((f) => {
    const next = { ...f, [k]: v };
    // Auto-sync slug from title only while creating (no initial) and slug untouched
    if (k === 'title' && !initial) next.slug = slugify(v);
    return next;
  });

  const setRobots = (k, v) => setForm((f) => ({ ...f, robots: { ...f.robots, [k]: v } }));

  const handleImage = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const { url } = await uploadBlogImage(file);
      set(field, url);
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const toggleTag = (id) =>
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(id) ? f.tags.filter((t) => t !== id) : [...f.tags, id],
    }));

  const submit = () => {
    if (!form.title.trim() || !form.content.trim()) {
      return alert('Title and content are required.');
    }
    const payload = {
      ...form,
      category: form.category || null,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
    };
    onSave(payload);
  };

  // canonical fallbacks for the live preview
  const previewTitle = form.metaTitle || form.title || 'Post Title';
  const previewDesc = form.metaDescription || form.excerpt ||
    'No description provided. Add a meta description to improve search visibility.';

  return (
    <div>
      <button onClick={onCancel} className="flex items-center gap-1.5 text-sm text-[#6B6B6B] hover:text-[#111111] mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to posts
      </button>

      {/* Section 1 — Content */}
      <Section title="Post Content">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>Title *</label>
            <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Post title" />
          </div>
          <div>
            <label className={labelCls}>Slug (URL)</label>
            <input className={inputCls} value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto-generated-from-title" />
          </div>
        </div>
        <div className="mb-4">
          <label className={labelCls}>Excerpt</label>
          <textarea rows={2} className={`${inputCls} resize-none`} value={form.excerpt}
            onChange={(e) => set('excerpt', e.target.value)} placeholder="Short summary shown in listings and as SEO fallback" />
        </div>
        <div>
          <label className={`${labelCls} flex items-center justify-between`}>
            <span>Content (HTML) *</span>
            <span className="font-normal text-[10px] text-[#9E9E9E] normal-case">Paste SEO-optimized HTML here</span>
          </label>
          <textarea rows={14} className={`${inputCls} resize-y font-mono`} value={form.content}
            onChange={(e) => set('content', e.target.value)} placeholder="<h2>Heading</h2><p>Your content…</p>" />
        </div>
      </Section>

      {/* Section 2 — Featured image */}
      <Section title="Featured Image">
        <div className="flex items-start gap-4">
          <div className="w-40 h-28 rounded-sm border border-[#D0D0CA] bg-[#F8F8F6] overflow-hidden shrink-0 flex items-center justify-center">
            {form.featuredImage
              ? <img src={form.featuredImage} alt="Featured" className="w-full h-full object-cover" />
              : <span className="text-xs text-[#9E9E9E]">No image</span>}
          </div>
          <div>
            <button type="button" onClick={() => document.getElementById('post-featured').click()}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-sm border-2 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white transition-all">
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {form.featuredImage ? 'Replace image' : 'Upload image'}
            </button>
            {form.featuredImage && (
              <button type="button" onClick={() => set('featuredImage', '')}
                className="block mt-2 text-xs text-[#9B2226] hover:underline">Remove</button>
            )}
            <p className="text-xs text-[#9E9E9E] mt-2">PNG, JPG, WEBP — Max 5MB</p>
            <input id="post-featured" type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e, 'featuredImage')} />
          </div>
        </div>
      </Section>

      {/* Section 3 — Organize */}
      <Section title="Organize">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>Category</label>
            <select className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Uncategorized</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>
        {(form.status === 'scheduled' || form.status === 'published') && (
          <div className="mb-4">
            <label className={labelCls}>
              {form.status === 'scheduled' ? 'Publish at (future date)' : 'Published at'}
            </label>
            <input type="datetime-local" className={inputCls} value={form.publishedAt}
              onChange={(e) => set('publishedAt', e.target.value)} />
            <p className="text-[10px] text-[#9E9E9E] mt-1">
              Scheduled posts become publicly visible automatically once this time passes.
            </p>
          </div>
        )}
        <div>
          <label className={labelCls}>Tags</label>
          {tags.length === 0
            ? <p className="text-xs text-[#9E9E9E]">No tags yet — create them in the Blog Taxonomy screen.</p>
            : (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => {
                  const on = form.tags.includes(t._id);
                  return (
                    <button key={t._id} type="button" onClick={() => toggleTag(t._id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        on ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#6B6B6B] border-[#D0D0CA] hover:border-[#111111]'
                      }`}>
                      {t.name}
                    </button>
                  );
                })}
              </div>
            )}
        </div>
      </Section>

      {/* Section 4 — SEO */}
      <Section title="SEO & Search">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1.5">
              <label className={labelCls.replace('mb-1.5', '')}>Meta Title</label>
              <span className={`text-xs ${form.metaTitle.length > 60 ? 'text-[#9B2226]' : 'text-[#9E9E9E]'}`}>{form.metaTitle.length}/60</span>
            </div>
            <input className={inputCls} value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)}
              placeholder="Defaults to the post title" maxLength={70} />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className={labelCls.replace('mb-1.5', '')}>Meta Description</label>
              <span className={`text-xs ${form.metaDescription.length > 160 ? 'text-[#9B2226]' : 'text-[#9E9E9E]'}`}>{form.metaDescription.length}/160</span>
            </div>
            <textarea rows={3} className={`${inputCls} resize-none`} value={form.metaDescription}
              onChange={(e) => set('metaDescription', e.target.value)} placeholder="Defaults to the excerpt" maxLength={180} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Canonical URL (optional override)</label>
              <input className={inputCls} value={form.canonicalUrl} onChange={(e) => set('canonicalUrl', e.target.value)}
                placeholder="Leave blank to use the post URL" />
            </div>
            <div>
              <label className={labelCls}>OG Image (optional override)</label>
              <div className="flex gap-2">
                <input className={inputCls} value={form.ogImage} onChange={(e) => set('ogImage', e.target.value)}
                  placeholder="Defaults to featured image" />
                <button type="button" onClick={() => document.getElementById('post-og').click()}
                  className="shrink-0 px-3 rounded-sm border border-[#D0D0CA] text-[#6B6B6B] hover:border-[#111111] transition-all">
                  <Upload size={15} />
                </button>
                <input id="post-og" type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e, 'ogImage')} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.robots.index} onChange={(e) => setRobots('index', e.target.checked)} className="w-4 h-4 accent-[#111111]" />
              <span className="text-sm text-[#6B6B6B]">Allow indexing <span className="text-[#9E9E9E]">(index / noindex)</span></span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.robots.follow} onChange={(e) => setRobots('follow', e.target.checked)} className="w-4 h-4 accent-[#111111]" />
              <span className="text-sm text-[#6B6B6B]">Follow links <span className="text-[#9E9E9E]">(follow / nofollow)</span></span>
            </label>
          </div>

          {/* Live Google preview */}
          <div className="p-4 rounded-sm bg-[#F8F8F6] border border-[#D0D0CA]">
            <p className="text-xs text-[#9E9E9E] mb-2 font-semibold">Google Preview</p>
            <p className="text-blue-600 text-base font-medium leading-tight hover:underline cursor-pointer">{previewTitle}</p>
            <p className="text-[#2D6A4F] text-xs mt-0.5">crafthid.com/blog/{form.slug || slugify(form.title) || 'post-slug'}</p>
            <p className="text-[#6B6B6B] text-sm mt-1 leading-relaxed">{previewDesc}</p>
          </div>
        </div>
      </Section>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-white/90 backdrop-blur py-3 border-t border-[#E8E8E4]">
        <button onClick={onCancel} className="px-5 py-2.5 rounded-sm text-sm font-semibold text-[#6B6B6B] border border-[#D0D0CA] hover:bg-[#F8F8F6] transition-all">Cancel</button>
        <button onClick={submit} disabled={saving}
          className="px-5 py-2.5 rounded-sm text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
          style={{ background: CORAL }}>
          {saving && <Loader2 size={15} className="animate-spin" />}
          {initial ? 'Update Post' : 'Create Post'}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function AdminBlogs() {
  const { showToast, ToastUI } = useAdminToast();
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editing, setEditing] = useState(null);

  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminPosts({ page, limit: 20, search: search || undefined, status: statusFilter || undefined });
      setPosts(data.posts || []);
      setPages(data.pages || 1);
    } catch (err) {
      console.error('Error fetching posts:', err);
      showToast('Failed to load posts', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    Promise.all([getBlogCategories(), getBlogTags()])
      .then(([c, t]) => { setCategories(c || []); setTags(t || []); })
      .catch((err) => console.error('Error loading taxonomy:', err));
  }, []);

  const openCreate = () => { setEditing(null); setView('form'); };
  const openEdit = (post) => { setEditing(post); setView('form'); };

  const handleSave = async (payload) => {
    try {
      setSaving(true);
      if (editing) {
        await apiUpdatePost(editing._id, payload);
        showToast('Post updated');
      } else {
        await apiCreatePost(payload);
        showToast('Post created');
      }
      setView('list');
      setEditing(null);
      fetchPosts();
    } catch (err) {
      console.error('Error saving post:', err);
      showToast(err.response?.data?.message || 'Failed to save post', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await apiDeletePost(post._id);
      showToast('Post deleted');
      fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      showToast('Failed to delete post', 'error');
    }
  };

  if (view === 'form') {
    return (
      <>
        <ToastUI />
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#111111]">{editing ? 'Edit Post' : 'New Post'}</h1>
          <p className="text-sm text-[#6B6B6B]">{editing ? 'Update an existing blog post' : 'Create a new blog post'}</p>
        </div>
        <PostForm
          initial={editing}
          categories={categories}
          tags={tags}
          onSave={handleSave}
          onCancel={() => { setView('list'); setEditing(null); }}
          saving={saving}
        />
      </>
    );
  }

  return (
    <>
      <ToastUI />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Blog Posts</h1>
          <p className="text-sm text-[#6B6B6B]">Create and manage SEO blog posts</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-sm transition-all hover:opacity-90"
          style={{ background: CORAL }}>
          <Plus size={16} /> New Post
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 border border-[#E8E8E4] rounded-sm mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Search size={18} className="text-[#9E9E9E]" />
          <input type="text" placeholder="Search posts by title…"
            className="flex-1 outline-none text-sm text-[#111111] bg-transparent"
            value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
        </div>
        <select className="border border-[#D0D0CA] rounded-sm px-3 py-2 text-sm text-[#111111] outline-none focus:border-[#C9A96E] bg-white"
          value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E8E8E4] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8E8E4] bg-[#F8F8F6]">
                <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Post</th>
                <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Category</th>
                <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Published</th>
                <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E4]">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-[#9E9E9E]">Loading…</td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-[#9E9E9E]">No posts found.</td></tr>
              ) : (
                posts.map((post) => {
                  const badge = STATUS_BADGE[post.status] || STATUS_BADGE.draft;
                  return (
                    <tr key={post._id} className="hover:bg-[#F8F8F6]/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {post.featuredImage ? (
                            <img src={post.featuredImage} alt="" className="w-12 h-12 rounded-sm object-cover bg-[#E8E8E4]" />
                          ) : (
                            <div className="w-12 h-12 rounded-sm bg-[#E8E8E4] flex items-center justify-center text-[#9E9E9E]"><Eye size={16} /></div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-[#111111]">{post.title}</p>
                            <p className="text-xs text-[#9E9E9E]">/{post.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full" style={{ background: badge.bg, color: badge.text }}>{badge.label}</span>
                      </td>
                      <td className="p-4 text-sm text-[#6B6B6B]">{post.category?.name || 'Uncategorized'}</td>
                      <td className="p-4 text-sm text-[#6B6B6B]">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="p-1.5 text-[#9E9E9E] hover:text-[#111111] transition-colors" title="View"><Eye size={16} /></a>
                          <button onClick={() => openEdit(post)} className="p-1.5 text-[#9E9E9E] hover:text-[#111111] transition-colors" title="Edit"><Pencil size={16} /></button>
                          <button onClick={() => handleDelete(post)} className="p-1.5 text-[#9E9E9E] hover:text-[#9B2226] transition-colors" title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="p-2 rounded-sm border border-[#D0D0CA] text-[#6B6B6B] disabled:opacity-40 hover:bg-[#F8F8F6] transition-all"><ChevronLeft size={16} /></button>
          <span className="text-sm text-[#6B6B6B]">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}
            className="p-2 rounded-sm border border-[#D0D0CA] text-[#6B6B6B] disabled:opacity-40 hover:bg-[#F8F8F6] transition-all"><ChevronRight size={16} /></button>
        </div>
      )}
    </>
  );
}
