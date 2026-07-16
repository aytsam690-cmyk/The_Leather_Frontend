// BLOG FEATURE — PATCH 5 — ADMIN PANEL
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, X, Search, Plus, Trash2 } from 'lucide-react';
import adminApi from '../adminApi';
import ImageUploader from '../../components/ImageUploader';

const CORAL = '#111111';

export default function AdminBlogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Data model matching backend schema
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: '',
    tags: [],
    status: 'draft',
    isPinned: false,
    featuredImage: '',
    featuredImageAlt: '',
    metaTitle: '',
    metaDescription: '',
    excerpt: '',
    linkedProducts: [],
    content: ''
  });

  const [slugStatus, setSlugStatus] = useState(null); // 'checking', 'available', 'taken'
  const [tagInput, setTagInput] = useState('');
  
  // New Category Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  
  // Products Search
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  // Uploaded images state for ImageUploader
  const [images, setImages] = useState([]);

  // Fetch initial data
  useEffect(() => {
    const init = async () => {
      try {
        const catRes = await adminApi.get('/blog/categories');
        setCategories(catRes.data || []);
        
        if (isEdit) {
          try {
            const res = await adminApi.get('/admin/blog', { params: { limit: 1000 } });
            const post = res.data.posts.find(p => p._id === id);
            if (post) {
              setFormData({
                title: post.title || '',
                slug: post.slug || '',
                category: post.category?._id || post.category || '',
                tags: post.tags || [],
                status: post.status || 'draft',
                isPinned: post.isPinned || false,
                featuredImage: post.featuredImage || '',
                featuredImageAlt: post.featuredImageAlt || '',
                metaTitle: post.metaTitle || '',
                metaDescription: post.metaDescription || '',
                excerpt: post.excerpt || '',
                linkedProducts: post.linkedProducts || [],
                content: post.content || ''
              });
              if (post.featuredImage) {
                setImages([{ url: post.featuredImage }]);
              }
            }
          } catch(e) {}
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isEdit]);

  // Slug auto-generation and validation
  const checkSlugUniqueness = async (slugToCheck) => {
    if (!slugToCheck) { setSlugStatus(null); return; }
    setSlugStatus('checking');
    try {
      const res = await adminApi.get('/admin/blog', { params: { search: slugToCheck } });
      const exists = res.data.posts.some(p => p.slug === slugToCheck && p._id !== id);
      setSlugStatus(exists ? 'taken' : 'available');
    } catch (err) {
      setSlugStatus(null);
    }
  };

  const handleTitleBlur = () => {
    if (!formData.slug && formData.title) {
      const generatedSlug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
      checkSlugUniqueness(generatedSlug);
    }
  };

  const handleSlugBlur = () => {
    checkSlugUniqueness(formData.slug);
  };

  // Tags
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      setTagInput('');
    }
  };
  const removeTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  // Products Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (productSearch.length > 2) {
        setSearchingProducts(true);
        try {
          const res = await adminApi.get('/admin/blog/products/search', { params: { q: productSearch } });
          setProductResults(res.data || []);
        } catch (e) { }
        finally { setSearchingProducts(false); }
      } else {
        setProductResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const addLinkedProduct = (prod) => {
    if (formData.linkedProducts.length >= 6) return alert('Max 6 products allowed');
    if (!formData.linkedProducts.find(p => (p._id || p.id) === (prod._id || prod.id))) {
      setFormData(prev => ({ ...prev, linkedProducts: [...prev.linkedProducts, prod] }));
    }
    setProductSearch('');
    setProductResults([]);
  };

  const removeLinkedProduct = (prodId) => {
    setFormData(prev => ({ ...prev, linkedProducts: prev.linkedProducts.filter(p => (p._id || p.id) !== prodId) }));
  };

  // Add Category Inline
  const handleAddCategory = async () => {
    if (!newCatName) return;
    try {
      const slug = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const res = await adminApi.post('/admin/blog/categories', { name: newCatName, slug });
      setCategories(prev => [...prev, res.data]);
      setFormData(prev => ({ ...prev, category: res.data._id }));
      setShowCatModal(false);
      setNewCatName('');
    } catch (e) {
      alert('Failed to add category');
    }
  };

  // Save
  const handleSave = async (statusOverride) => {
    const finalStatus = statusOverride || formData.status;
    
    if (!formData.title || !formData.slug || !formData.category || !formData.content) {
      return alert('Title, Slug, Category, and Content are required fields.');
    }

    if (slugStatus === 'taken') {
      return alert('Slug is already taken. Please choose another one.');
    }

    setSaving(true);
    try {
      let uploadedImageUrl = formData.featuredImage;
      if (images.length > 0 && images[0] instanceof File) {
        const formDataImg = new FormData();
        formDataImg.append('image', images[0]);
        const uploadRes = await adminApi.post('/upload/image', formDataImg, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploadedImageUrl = uploadRes.data.url;
      } else if (images.length === 0) {
        uploadedImageUrl = '';
      }

      const payload = {
        ...formData,
        status: finalStatus,
        featuredImage: uploadedImageUrl,
        linkedProducts: formData.linkedProducts.map(p => p._id || p.id)
      };

      if (isEdit) {
        await adminApi.put(`/admin/blog/${id}`, payload);
      } else {
        await adminApi.post('/admin/blog', payload);
      }
      navigate('/admin/blog');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post completely?')) return;
    try {
      await adminApi.delete(`/admin/blog/${id}`);
      navigate('/admin/blog');
    } catch (e) {
      alert('Failed to delete');
    }
  };

  if (loading) return <div className="p-8 text-center text-[#9E9E9E]">Loading...</div>;

  const wordCount = formData.content.replace(/<[^>]*>?/gm, '').split(/\s+/).filter(w => w.length > 0).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">{isEdit ? 'Edit Post' : 'Create New Post'}</h1>
          <p className="text-sm text-[#6B6B6B]">Write and publish your article</p>
        </div>
        <div className="flex items-center gap-3">
          {isEdit && (
            <button onClick={handleDelete} className="px-4 py-2 text-sm font-semibold text-[#DC2626] bg-[#FEF2F2] rounded-sm hover:bg-[#FEE2E2] transition-colors">
              Delete Post
            </button>
          )}
          <button onClick={() => handleSave('draft')} disabled={saving} className="px-4 py-2 text-sm font-semibold text-[#6B6B6B] border border-[#E8E8E4] bg-white rounded-sm hover:bg-[#F8F8F6] transition-colors disabled:opacity-50">
            Save as Draft
          </button>
          <button onClick={() => handleSave('published')} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white rounded-sm transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: CORAL }}>
            Publish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 border border-[#E8E8E4] rounded-sm shadow-sm space-y-5">
            <div>
              <label className="block text-sm font-bold text-[#111111] mb-2">Title *</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} onBlur={handleTitleBlur} required
                className="w-full border border-[#E8E8E4] rounded-sm px-3 py-2.5 text-sm text-[#111111] focus:border-[#111111] outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[#111111] mb-2">Slug *</label>
              <div className="relative">
                <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} onBlur={handleSlugBlur} required
                  className={`w-full border ${slugStatus === 'taken' ? 'border-[#DC2626]' : 'border-[#E8E8E4]'} rounded-sm px-3 py-2.5 text-sm text-[#111111] focus:border-[#111111] outline-none pr-10`} />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {slugStatus === 'available' && <Check size={18} className="text-[#059669]" />}
                  {slugStatus === 'taken' && <X size={18} className="text-[#DC2626]" />}
                </div>
              </div>
              {slugStatus === 'taken' && <p className="text-xs text-[#DC2626] mt-1">This slug is already in use.</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#111111] mb-2">Excerpt</label>
              <textarea value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} maxLength={300} rows={3} placeholder="Leave empty to auto-generate from content"
                className="w-full border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm text-[#111111] focus:border-[#111111] outline-none resize-none" />
              <p className="text-xs text-[#6B6B6B] text-right mt-1">{formData.excerpt.length} / 300</p>
            </div>
            
            <div className="flex-1 flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-[#111111]">Content (Raw HTML) *</label>
                <div className="text-xs text-[#6B6B6B]">Word count: {wordCount} (~{readTime} min read)</div>
              </div>
              <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required
                className="w-full flex-1 border border-[#E8E8E4] rounded-sm px-4 py-3 text-sm font-mono text-[#111111] focus:border-[#111111] outline-none"
                placeholder="<h1>Start writing...</h1>" />
              
              <div className="mt-3 bg-[#F8F8F6] p-4 border border-[#E8E8E4] rounded-sm">
                <h4 className="text-sm font-bold text-[#111111] mb-1">Product Shortcodes</h4>
                <p className="text-xs text-[#6B6B6B]">To embed a product inside your article, use: <code className="bg-white px-1 py-0.5 border border-[#E8E8E4] rounded text-[#111111]">[product id="PRODUCT_ID"]</code></p>
                <p className="text-xs text-[#6B6B6B] mt-1">You can find the product ID from the "Shop This Post" section below.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#111111] p-6 rounded-sm shadow-sm overflow-x-auto">
            <h3 className="text-white text-sm font-bold mb-4 uppercase tracking-wider border-b border-white/10 pb-2">Live Preview</h3>
            <div className="blog-content text-[#EAE6DF]" dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-white/40 italic">Preview will appear here...</p>' }} />
            <style>{`
              .blog-content { font-family: 'DM Sans', sans-serif; font-size: 16px; line-height: 1.8; }
              .blog-content h1, .blog-content h2, .blog-content h3 { font-family: 'Cormorant Garamond', serif; color: #F5F0E8; margin-top: 1.5em; margin-bottom: 0.5em; }
              .blog-content h2 { font-size: 24px; }
              .blog-content a { color: #C9A96E; }
              .blog-content img { max-width: 100%; border-radius: 4px; }
            `}</style>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <div className="bg-white p-5 border border-[#E8E8E4] rounded-sm shadow-sm">
            <h3 className="text-sm font-bold text-[#111111] mb-4">Publishing</h3>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-[#6B6B6B] mb-2 uppercase">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm text-[#111111] outline-none">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.isPinned} onChange={e => setFormData({...formData, isPinned: e.target.checked})} className="mt-1" />
                <span className="text-sm text-[#111111]">Pin this post as the featured article on the blog homepage</span>
              </label>
            </div>
          </div>

          <div className="bg-white p-5 border border-[#E8E8E4] rounded-sm shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#111111]">Category</h3>
            </div>
            {showCatModal ? (
              <div className="flex gap-2 mb-2">
                <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Category name..." className="flex-1 border border-[#E8E8E4] rounded-sm px-2 py-1 text-sm outline-none" autoFocus />
                <button type="button" onClick={handleAddCategory} className="px-2 py-1 bg-[#111111] text-white rounded-sm text-xs">Save</button>
                <button type="button" onClick={() => setShowCatModal(false)} className="px-2 py-1 border border-[#E8E8E4] text-[#6B6B6B] rounded-sm text-xs">Cancel</button>
              </div>
            ) : (
              <>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required className="w-full border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm text-[#111111] outline-none mb-2">
                  <option value="" disabled>Select Category</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowCatModal(true)} className="text-xs text-[#111111] font-medium flex items-center gap-1 hover:underline">
                  <Plus size={12} /> Add New Category
                </button>
              </>
            )}
          </div>

          <div className="bg-white p-5 border border-[#E8E8E4] rounded-sm shadow-sm">
            <h3 className="text-sm font-bold text-[#111111] mb-4">Tags</h3>
            <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Type tag and press Enter" className="w-full border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm text-[#111111] outline-none mb-3" />
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-[#F8F8F6] border border-[#E8E8E4] px-2 py-1 rounded-sm text-xs text-[#111111]">
                  {tag}
                  <X size={12} className="cursor-pointer text-[#9E9E9E] hover:text-[#DC2626]" onClick={() => removeTag(tag)} />
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 border border-[#E8E8E4] rounded-sm shadow-sm">
            <h3 className="text-sm font-bold text-[#111111] mb-4">Featured Image</h3>
            <ImageUploader images={images} setImages={setImages} maxImages={1} />
            <div className="mt-3">
              <label className="block text-xs font-bold text-[#6B6B6B] mb-1 uppercase">Or enter image URL</label>
              <input type="url" value={formData.featuredImage} onChange={e => { setFormData({...formData, featuredImage: e.target.value}); setImages([]); }} placeholder="https://" className="w-full border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm text-[#111111] outline-none" />
            </div>
            <div className="mt-3">
              <label className="block text-xs font-bold text-[#6B6B6B] mb-1 uppercase">Alt Text</label>
              <input type="text" value={formData.featuredImageAlt} onChange={e => setFormData({...formData, featuredImageAlt: e.target.value})} className="w-full border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm text-[#111111] outline-none" />
            </div>
          </div>

          <div className="bg-white p-5 border border-[#E8E8E4] rounded-sm shadow-sm">
            <h3 className="text-sm font-bold text-[#111111] mb-4">SEO Settings</h3>
            <div className="mb-4">
              <label className="block text-xs font-bold text-[#6B6B6B] mb-1 uppercase">Meta Title</label>
              <input type="text" value={formData.metaTitle} onChange={e => setFormData({...formData, metaTitle: e.target.value})} placeholder="Leave empty to use post title" className="w-full border border-[#E8E8E4] rounded-sm px-3 py-2 text-sm text-[#111111] outline-none" />
              <p className="text-xs text-right mt-1 text-[#6B6B6B]">{formData.metaTitle.length} chars</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B6B6B] mb-1 uppercase">Meta Description</label>
              <textarea value={formData.metaDescription} onChange={e => setFormData({...formData, metaDescription: e.target.value})} rows={3} className={`w-full border ${formData.metaDescription.length > 160 ? 'border-[#DC2626]' : formData.metaDescription.length > 155 ? 'border-[#D97706]' : 'border-[#E8E8E4]'} rounded-sm px-3 py-2 text-sm text-[#111111] outline-none resize-none`} />
              <p className={`text-xs text-right mt-1 ${formData.metaDescription.length > 160 ? 'text-[#DC2626]' : formData.metaDescription.length > 155 ? 'text-[#D97706]' : 'text-[#059669]'}`}>
                {formData.metaDescription.length} / 160 chars
              </p>
            </div>
          </div>

          <div className="bg-white p-5 border border-[#E8E8E4] rounded-sm shadow-sm">
            <h3 className="text-sm font-bold text-[#111111] mb-1">Shop This Post</h3>
            <p className="text-xs text-[#6B6B6B] mb-4">Products shown in the article sidebar</p>
            
            <div className="relative mb-4">
              <div className="flex items-center gap-2 border border-[#E8E8E4] rounded-sm px-3 py-2 bg-[#F8F8F6]">
                <Search size={14} className="text-[#9E9E9E]" />
                <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products..." className="flex-1 bg-transparent text-sm outline-none" />
              </div>
              
              {productResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8E8E4] rounded-sm shadow-xl z-10 max-h-60 overflow-y-auto">
                  {productResults.map(p => (
                    <div key={p.id || p._id} onClick={() => addLinkedProduct(p)} className="flex items-center gap-3 p-2 hover:bg-[#F8F8F6] cursor-pointer border-b border-[#E8E8E4] last:border-0">
                      <img src={p.images?.[0] || 'https://via.placeholder.com/30'} alt="" className="w-8 h-8 rounded-sm object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#111111] truncate">{p.name}</p>
                        <p className="text-xs text-[#6B6B6B]">Rs. {p.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {formData.linkedProducts.map(p => (
                <div key={p.id || p._id} className="flex items-center justify-between p-2 border border-[#E8E8E4] rounded-sm bg-[#F8F8F6]">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={p.images?.[0]?.url || p.images?.[0] || 'https://via.placeholder.com/30'} alt="" className="w-8 h-8 rounded-sm object-cover shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-[#111111] truncate max-w-[150px]">{p.name}</p>
                      <p className="text-[10px] text-[#6B6B6B] font-mono select-all">ID: {p.id || p._id}</p>
                    </div>
                  </div>
                  <button onClick={() => removeLinkedProduct(p.id || p._id)} className="text-[#9E9E9E] hover:text-[#DC2626] p-1"><Trash2 size={14} /></button>
                </div>
              ))}
              {formData.linkedProducts.length === 0 && (
                <p className="text-xs text-[#9E9E9E] text-center py-4">No products linked yet.</p>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
