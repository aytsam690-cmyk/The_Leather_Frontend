// BLOG FEATURE — PATCH 3 — BLOG LISTING PAGE
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, ChevronLeft, ChevronRight, Inbox, ChevronRight as ChevronIcon } from 'lucide-react';
import useSettingsStore from '../store/settingsStore';
import useCartStore from '../store/cartStore';
import BlogCard from '../components/BlogCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error('API Error');
  return res.json();
};

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = useSettingsStore();
  const { addItem } = useCartStore();

  const [posts, setPosts] = useState([]);
  const [featuredPost, setFeaturedPost] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');

  // Filters from URL
  const page = Number(searchParams.get('page')) || 1;
  const categorySlug = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('search') || '';
  const tag = searchParams.get('tag') || '';

  const [searchInput, setSearchInput] = useState(searchQuery);
  const debounceRef = useRef(null);

  // Search debounce
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (val) params.set('search', val);
      else params.delete('search');
      params.set('page', '1');
      setSearchParams(params);
    }, 300);
  };

  // Set category
  const handleCategoryClick = (slug) => {
    const params = new URLSearchParams(searchParams);
    if (slug === 'All') params.delete('category');
    else params.set('category', slug);
    params.set('page', '1');
    setSearchParams(params);
  };

  // Set tag
  const handleTagClick = (t) => {
    const params = new URLSearchParams(searchParams);
    if (t) params.set('tag', t);
    else params.delete('tag');
    params.set('page', '1');
    setSearchParams(params);
  };

  // Fetch initial data (categories, featured post, products for sidebar)
  useEffect(() => {
    fetchJSON(`${API_URL}/api/blog/categories`).then(setCategories).catch(console.error);
    fetchJSON(`${API_URL}/api/blog/featured`).then(setFeaturedPost).catch(console.error);
    
    fetchJSON(`${API_URL}/api/products/featured`).then(res => {
      setTrendingProducts((Array.isArray(res) ? res : (res.products || [])).slice(0, 3));
    }).catch(console.error);
    
    fetchJSON(`${API_URL}/api/categories`).then(setProductCategories).catch(console.error);
  }, []);

  // Fetch posts based on filters
  useEffect(() => {
    setLoading(true);
    let url = `${API_URL}/api/blog`;
    if (categorySlug !== 'All') {
      url = `${API_URL}/api/blog/category/${categorySlug}`;
    }
    
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', 10);
    if (searchQuery) params.set('search', searchQuery);
    if (tag) params.set('tag', tag);
    
    fetchJSON(`${url}?${params.toString()}`)
      .then(data => {
        setPosts(data.posts || []);
        setPagination({ page: data.page, pages: data.pages, total: data.total });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categorySlug, searchQuery, tag, page]);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    try {
      const res = await fetch(`${API_URL}/api/blog/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      });
      const data = await res.json();
      setNewsletterStatus(data.message || 'Subscribed!');
      setNewsletterEmail('');
      setTimeout(() => setNewsletterStatus(''), 3000);
    } catch (err) {
      setNewsletterStatus('Error subscribing');
    }
  };

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags || [])));
  const heroPost = featuredPost || (posts.length > 0 && page === 1 && !searchQuery && categorySlug === 'All' ? posts[0] : null);
  const displayPosts = (heroPost && posts[0]?._id === heroPost._id) ? posts.slice(1) : posts;

  return (
    <div style={{ background: '#0D0D0B', minHeight: '100vh', paddingTop: 96, paddingBottom: 80 }}>
      <Helmet>
        <title>Blog | {settings?.siteName || 'Store'}</title>
        <meta name="description" content="Read our latest articles, guides, and news." />
        <link rel="canonical" href={window.location.origin + '/blog'} />
        <meta property="og:title" content={`Blog | ${settings?.siteName || 'Store'}`} />
        <meta property="og:description" content="Read our latest articles, guides, and news." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={settings?.logo || ''} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Blog Posts',
          url: window.location.origin + '/blog',
          numberOfItems: pagination.total || 0
        })}</script>
      </Helmet>

      {/* SECTION 1: Featured Hero Post */}
      {heroPost && page === 1 && !searchQuery && !tag && categorySlug === 'All' && (
        <div className="relative w-full h-[65vh] min-h-[500px] mb-12 flex items-end pb-16 px-6 lg:px-16" style={{
          backgroundImage: `url(${heroPost.featuredImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A09] via-[#0A0A09]/60 to-[#0A0A09]/20" />
          <div className="relative z-10 max-w-3xl">
            {heroPost.category && (
              <span className="inline-block bg-[#C9A96E] text-[#0D0D0B] font-dm font-bold uppercase tracking-[0.1em] text-[11px] px-3 py-1 mb-4 rounded-sm">
                {heroPost.category.name}
              </span>
            )}
            <h1 className="font-cm text-4xl md:text-5xl lg:text-6xl text-[#F5F0E8] leading-tight mb-4 drop-shadow-lg">
              {heroPost.title}
            </h1>
            <p className="font-dm text-[#EAE6DF] text-sm md:text-base line-clamp-2 mb-6 max-w-2xl leading-relaxed drop-shadow-md">
              {heroPost.excerpt}
            </p>
            <div className="flex items-center gap-6 mb-8">
              <div className="flex items-center gap-3">
                {heroPost.author?.avatar ? (
                  <img src={heroPost.author.avatar} alt="author" className="w-10 h-10 rounded-full object-cover border border-[#2C2C26]" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1C1C17] border border-[#2C2C26] flex items-center justify-center text-[#F5F0E8] font-dm">
                    {heroPost.author?.name?.charAt(0) || 'A'}
                  </div>
                )}
                <div>
                  <p className="font-dm text-[#F5F0E8] text-[13px] font-medium m-0 drop-shadow-md">{heroPost.author?.name || 'Admin'}</p>
                  <p className="font-dm text-[#EAE6DF]/80 text-[11px] m-0 drop-shadow-md">
                    {new Date(heroPost.publishedAt || heroPost.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • {heroPost.readTime || 5} min read
                  </p>
                </div>
              </div>
            </div>
            <Link to={`/blog/${heroPost.slug}`} className="inline-block bg-[#C9A96E] text-[#0D0D0B] font-dm font-semibold uppercase tracking-[0.08em] text-[12px] px-8 py-3 rounded-sm hover:bg-[#A07840] transition-colors shadow-lg">
              Read Article
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 mt-12">
        <div className="flex flex-col lg:flex-row gap-10">
          
          <div className="flex-1 min-w-0">
            {/* SECTION 2: Filters Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-[#2C2C26]">
              {/* Category Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
                <button 
                  onClick={() => handleCategoryClick('All')}
                  className={`font-dm text-[13px] font-medium px-4 py-2 rounded-sm whitespace-nowrap transition-colors ${categorySlug === 'All' ? 'bg-[#F5F0E8] text-[#0D0D0B]' : 'bg-[#1C1C17] text-[#A89880] border border-[#2C2C26] hover:text-[#F5F0E8]'}`}
                >
                  All Posts
                </button>
                {categories.map(c => (
                  <button 
                    key={c._id}
                    onClick={() => handleCategoryClick(c.slug)}
                    className={`font-dm text-[13px] font-medium px-4 py-2 rounded-sm whitespace-nowrap transition-colors ${categorySlug === c.slug ? 'bg-[#F5F0E8] text-[#0D0D0B]' : 'bg-[#1C1C17] text-[#A89880] border border-[#2C2C26] hover:text-[#F5F0E8]'}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64 shrink-0">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6055]" />
                <input 
                  type="text" 
                  placeholder="Search articles..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="w-full bg-[#141410] border border-[#2C2C26] text-[#F5F0E8] font-dm text-[13px] rounded-sm py-2.5 pl-10 pr-4 focus:outline-none focus:border-[#C9A96E] transition-colors"
                />
              </div>
            </div>

            {/* Active Tag indicator */}
            {tag && (
              <div className="mb-6 flex items-center gap-3">
                <span className="font-dm text-[#A89880] text-[13px]">Showing posts tagged:</span>
                <span className="bg-[#1C1C17] border border-[#2C2C26] text-[#C9A96E] font-dm text-[11px] px-3 py-1 rounded-sm flex items-center gap-2">
                  #{tag}
                  <button onClick={() => handleTagClick('')} className="hover:text-[#F5F0E8]">×</button>
                </span>
              </div>
            )}

            {/* SECTION 3: Blog Card Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-[#141410] border border-[#2C2C26] rounded-sm shadow-md">
                    <div className="aspect-[3/4] bg-[#1C1C17]" />
                    <div className="p-4">
                      <div className="h-4 bg-[#1C1C17] rounded-sm w-3/4 mb-3" />
                      <div className="h-3 bg-[#1C1C17] rounded-sm w-full mb-2" />
                      <div className="h-3 bg-[#1C1C17] rounded-sm w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-[#141410] border border-[#2C2C26] rounded-sm shadow-md">
                <Inbox size={48} className="text-[#3E3B37] mb-4" />
                <h3 className="font-cm text-2xl text-[#F5F0E8] mb-2">No posts found</h3>
                <p className="font-dm text-[#A89880] text-[14px] mb-6">Try adjusting your search or filters.</p>
                <Link to="/products" className="bg-transparent border border-[#F5F0E8] text-[#F5F0E8] font-dm font-semibold uppercase tracking-[0.08em] text-[11px] px-6 py-2.5 rounded-sm hover:bg-[#F5F0E8] hover:text-[#0D0D0B] transition-colors">
                  Browse Our Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayPosts.map(post => (
                  <BlogCard key={post._id} post={post} />
                ))}
              </div>
            )}

            {/* SECTION 5: Pagination */}
            {pagination.pages > 1 && !loading && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button 
                  onClick={() => {
                    const p = new URLSearchParams(searchParams);
                    p.set('page', Math.max(1, pagination.page - 1));
                    setSearchParams(p);
                  }} 
                  disabled={pagination.page === 1}
                  className="w-10 h-10 flex items-center justify-center border border-[#2C2C26] rounded-sm bg-[#141410] text-[#A89880] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#3D3D34] hover:text-[#F5F0E8] transition-colors shadow-sm"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(n => (
                  <button 
                    key={n} 
                    onClick={() => {
                      const p = new URLSearchParams(searchParams);
                      p.set('page', n);
                      setSearchParams(p);
                    }}
                    className={`w-10 h-10 flex items-center justify-center border rounded-sm font-dm text-[13px] transition-colors shadow-sm ${pagination.page === n ? 'bg-[#C9A96E] border-[#C9A96E] text-[#0D0D0B] font-medium' : 'bg-[#141410] border-[#2C2C26] text-[#A89880] hover:border-[#3D3D34] hover:text-[#F5F0E8]'}`}
                  >
                    {n}
                  </button>
                ))}
                <button 
                  onClick={() => {
                    const p = new URLSearchParams(searchParams);
                    p.set('page', Math.min(pagination.pages, pagination.page + 1));
                    setSearchParams(p);
                  }} 
                  disabled={pagination.page === pagination.pages}
                  className="w-10 h-10 flex items-center justify-center border border-[#2C2C26] rounded-sm bg-[#141410] text-[#A89880] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#3D3D34] hover:text-[#F5F0E8] transition-colors shadow-sm"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* SECTION 4: Sidebar */}
          <aside className="w-full lg:w-[320px] flex flex-col gap-8 shrink-0">
            
            {/* Widget A: Popular Tags */}
            {allTags.length > 0 && (
              <div className="bg-[#141410] border border-[#2C2C26] rounded-sm p-6 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                <h4 className="font-cm text-xl text-[#F5F0E8] border-b border-[#2C2C26] pb-3 mb-4">Popular Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(t => (
                    <button 
                      key={t}
                      onClick={() => handleTagClick(t)}
                      className={`font-dm text-[11px] px-3 py-1.5 rounded-sm border transition-colors ${tag === t ? 'bg-[#C9A96E] border-[#C9A96E] text-[#0D0D0B]' : 'bg-[#1C1C17] border-[#2C2C26] text-[#A89880] hover:text-[#F5F0E8] hover:border-[#3D3D34]'}`}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Widget B: Shop by Category */}
            {productCategories.length > 0 && (
              <div className="bg-[#141410] border border-[#2C2C26] rounded-sm p-6 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                <h4 className="font-cm text-xl text-[#F5F0E8] border-b border-[#2C2C26] pb-3 mb-4">Shop Our Products</h4>
                <ul className="flex flex-col gap-3 m-0 p-0 list-none">
                  {productCategories.map(cat => (
                    <li key={cat._id || cat.name || cat}>
                      <Link 
                        to={`/products?category=${encodeURIComponent(cat.name || cat)}`}
                        className="font-dm text-[14px] text-[#A89880] hover:text-[#C9A96E] flex items-center justify-between group no-underline"
                      >
                        {cat.name || cat}
                        <ChevronIcon size={14} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-5px] group-hover:translate-x-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Widget C: Trending Products */}
            {trendingProducts.length > 0 && (
              <div className="bg-[#141410] border border-[#2C2C26] rounded-sm p-6 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                <h4 className="font-cm text-xl text-[#F5F0E8] border-b border-[#2C2C26] pb-3 mb-5">Trending Now</h4>
                <div className="flex flex-col gap-5">
                  {trendingProducts.map(prod => {
                    const img = prod.images?.[0]?.url || prod.images?.[0];
                    const hasDiscount = prod.comparePrice && prod.comparePrice > prod.price;
                    return (
                      <div key={prod._id} className="flex items-center gap-4 group">
                        <Link to={`/products/${prod.slug || prod._id}`} className="block w-20 h-24 shrink-0 bg-[#1C1C17] rounded-sm overflow-hidden border border-[#2C2C26]">
                          <img src={img} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/products/${prod.slug || prod._id}`} className="no-underline">
                            <h5 className="font-dm text-[#F5F0E8] text-[13px] leading-tight line-clamp-2 mb-1.5 group-hover:text-[#C9A96E] transition-colors">{prod.name}</h5>
                          </Link>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="font-dm font-semibold text-[#F5F0E8] text-[13px]">Rs. {prod.price}</span>
                            {hasDiscount && (
                              <span className="font-dm text-[#6B6055] text-[11px] line-through">Rs. {prod.comparePrice}</span>
                            )}
                          </div>
                          <button 
                            onClick={(e) => { e.preventDefault(); addItem(prod, 1); }}
                            disabled={prod.stock <= 0}
                            className="w-full bg-[#1C1C17] border border-[#2C2C26] text-[#A89880] font-dm text-[10px] uppercase tracking-[0.08em] py-1.5 rounded-sm hover:bg-[#2C2C26] hover:text-[#F5F0E8] transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {prod.stock <= 0 ? 'Sold Out' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Widget D: Newsletter Signup */}
            <div className="bg-[#1C1C17] border border-[#2C2C26] rounded-sm p-6 relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A96E]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <h4 className="font-cm text-2xl text-[#C9A96E] mb-2 relative z-10">Subscribe</h4>
              <p className="font-dm text-[#A89880] text-[13px] leading-relaxed mb-5 relative z-10">
                Join our newsletter to receive the latest updates, design tips, and exclusive offers.
              </p>
              <form onSubmit={handleNewsletter} className="flex flex-col gap-3 relative z-10">
                <input 
                  type="email" 
                  required
                  placeholder="Enter your email address"
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  className="w-full bg-[#0D0D0B] border border-[#2C2C26] text-[#F5F0E8] font-dm text-[13px] rounded-sm py-2.5 px-3 focus:outline-none focus:border-[#C9A96E] transition-colors"
                />
                <button type="submit" className="w-full bg-[#C9A96E] text-[#0D0D0B] font-dm font-semibold uppercase tracking-[0.08em] text-[11px] py-2.5 rounded-sm hover:bg-[#A07840] transition-colors cursor-pointer">
                  Subscribe
                </button>
                {newsletterStatus && (
                  <p className="font-dm text-[#C9A96E] text-[12px] text-center mt-2">{newsletterStatus}</p>
                )}
              </form>
            </div>

          </aside>
        </div>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
