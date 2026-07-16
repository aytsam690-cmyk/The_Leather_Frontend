// BLOG FEATURE — PATCH 4 — SINGLE POST PAGE
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, ChevronRight, Twitter, Linkedin, Facebook, Link as LinkIcon, Check } from 'lucide-react';
import useSettingsStore from '../store/settingsStore';
import useCartStore from '../store/cartStore';
import ProductCard from '../components/ProductCard';
import BlogCard from '../components/BlogCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error('API Error');
  return res.json();
};

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const { addItem } = useCartStore();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [navPosts, setNavPosts] = useState({ prev: null, next: null });
  
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState(null);
  const [copied, setCopied] = useState(false);

  // Expose dispatchAddToCart globally for inline shortcodes
  useEffect(() => {
    window.dispatchAddToCart = (id) => {
      const product = post?.linkedProducts?.find(p => p._id === id);
      if (product) addItem(product, 1);
    };
    return () => { delete window.dispatchAddToCart; };
  }, [post, addItem]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch post data
  useEffect(() => {
    setLoading(true);
    fetchJSON(`${API_URL}/api/blog/${slug}`)
      .then(data => {
        setPost(data);
        // Fetch related data in parallel
        Promise.all([
          fetchJSON(`${API_URL}/api/products?limit=3`).catch(() => []), 
          fetchJSON(`${API_URL}/api/blog?category=${data.category?.slug || ''}&limit=10`).catch(() => ({}))
        ]).then(([prodData, blogData]) => {
          setRelatedProducts((prodData.products || prodData || []).slice(0, 3));
          
          const bPosts = blogData.posts || [];
          setRelatedPosts(bPosts.filter(p => p._id !== data._id).slice(0, 3));
          
          const idx = bPosts.findIndex(p => p._id === data._id);
          if (idx !== -1) {
            setNavPosts({
              prev: idx < bPosts.length - 1 ? bPosts[idx + 1] : null, // Older post
              next: idx > 0 ? bPosts[idx - 1] : null // Newer post
            });
          }
        });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Parse HTML and TOC
  const { html, toc } = useMemo(() => {
    if (!post) return { html: '', toc: [] };
    let parsedContent = post.content || '';
    
    // Process linked products shortcodes
    if (post.linkedProducts?.length > 0) {
      post.linkedProducts.forEach(product => {
        const regex = new RegExp(`\\[product id="${product._id}"\\]`, 'g');
        const img = product.images?.[0]?.url || product.images?.[0] || 'https://via.placeholder.com/80';
        const hasDiscount = product.comparePrice && product.comparePrice > product.price;
        const htmlSnippet = `
          <div class="inline-product-card" style="display:flex; align-items:center; gap:16px; background:#141410; border:1px solid #2C2C26; padding:12px; border-radius:2px; margin:24px 0;">
            <img src="${img}" alt="${product.name}" style="width:80px; height:80px; object-fit:cover; border-radius:2px;" />
            <div style="flex:1; min-width:0;">
              <h4 style="margin:0 0 4px; font-size:14px; color:#F5F0E8; font-family:'DM Sans', sans-serif; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${product.name}</h4>
              <div style="display:flex; align-items:baseline; gap:8px;">
                <span style="color:#C9A96E; font-weight:600; font-size:14px; font-family:'DM Sans', sans-serif;">Rs. ${product.price}</span>
                ${hasDiscount ? `<span style="color:#6B6055; text-decoration:line-through; font-size:12px; font-family:'DM Sans', sans-serif;">Rs. ${product.comparePrice}</span>` : ''}
              </div>
            </div>
            <button onclick="window.dispatchAddToCart('${product._id}')" style="background:#1C1C17; border:1px solid #2C2C26; color:#A89880; padding:8px 16px; border-radius:2px; text-transform:uppercase; font-size:11px; letter-spacing:0.08em; cursor:pointer;" onmouseover="this.style.background='#2C2C26'; this.style.color='#F5F0E8'" onmouseout="this.style.background='#1C1C17'; this.style.color='#A89880'">
              Add to Cart
            </button>
          </div>
        `;
        parsedContent = parsedContent.replace(regex, htmlSnippet);
      });
    }
    // Silently remove unparsed shortcodes
    parsedContent = parsedContent.replace(/\[product id="[^"]+"\]/g, '');
    
    // Parse DOM to inject IDs for TOC
    const parser = new DOMParser();
    const doc = parser.parseFromString(parsedContent, 'text/html');
    const headings = Array.from(doc.querySelectorAll('h2, h3'));
    headings.forEach((h, i) => { h.id = `heading-${i}`; });
    
    return { 
      html: doc.body.innerHTML, 
      toc: headings.map((h, i) => ({ id: `heading-${i}`, text: h.innerText, level: h.tagName.toLowerCase() })) 
    };
  }, [post]);

  // TOC scroll spy
  useEffect(() => {
    if (toc.length === 0) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveHeading(entry.target.id);
        }
      });
    }, { rootMargin: '0px 0px -80% 0px' });
    
    setTimeout(() => {
      toc.forEach(h => {
        const el = document.getElementById(h.id);
        if (el) observer.observe(el);
      });
    }, 100);
    
    return () => observer.disconnect();
  }, [toc, html]);

  // Share handlers
  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post?.title || '');
    if (platform === 'x') window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank');
    if (platform === 'linkedin') window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    if (platform === 'copy') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const scrollToHeading = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0B] pt-32 pb-16 px-4 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#0D0D0B] pt-32 pb-16 px-4 flex flex-col items-center justify-center text-center">
        <h1 className="font-cm text-4xl text-[#F5F0E8] mb-4">Post Not Found</h1>
        <p className="font-dm text-[#A89880] mb-8">The article you are looking for does not exist or has been removed.</p>
        <button onClick={() => navigate('/blog')} className="bg-[#C9A96E] text-[#0D0D0B] font-dm font-semibold uppercase tracking-[0.08em] text-[12px] px-8 py-3 rounded-sm">
          Return to Blog
        </button>
      </div>
    );
  }

  const dateStr = new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  // JSON-LD Generation
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    image: [post.featuredImage],
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: [{ '@type': 'Person', name: post.author?.name || 'Admin' }],
    publisher: { '@type': 'Organization', name: settings?.siteName || 'Store' }
  };
  
  const productSchemas = (post.linkedProducts || []).map(p => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: p.images?.[0]?.url || p.images?.[0] || '',
    offers: { '@type': 'Offer', price: p.price, priceCurrency: 'PKR' }
  }));

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: window.location.origin },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: window.location.origin + '/blog' },
      { '@type': 'ListItem', position: 3, name: post.category?.name || 'Article', item: window.location.origin + '/blog?category=' + (post.category?.slug || '') },
      { '@type': 'ListItem', position: 4, name: post.title }
    ]
  };

  return (
    <div className="bg-[#0D0D0B] min-h-screen pt-[72px] pb-24 text-[#EAE6DF]">
      <Helmet>
        <title>{post.metaTitle || post.title} | {settings?.siteName || 'Store'}</title>
        <meta name="description" content={post.metaDescription || post.excerpt} />
        {post.tags?.length > 0 && <meta name="keywords" content={post.tags.join(', ')} />}
        
        <meta property="og:title" content={post.metaTitle || post.title} />
        <meta property="og:description" content={post.metaDescription || post.excerpt} />
        <meta property="og:image" content={post.featuredImage} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.metaTitle || post.title} />
        <meta name="twitter:description" content={post.metaDescription || post.excerpt} />
        <meta name="twitter:image" content={post.featuredImage} />
        
        <link rel="canonical" href={window.location.href} />
        <meta name="robots" content={post.status === 'published' ? 'index,follow' : 'noindex,nofollow'} />

        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        {productSchemas.map((schema, i) => (
          <script key={i} type="application/ld+json">{JSON.stringify(schema)}</script>
        ))}
        
        {/* Scoped CSS for .blog-content */}
        <style>{`
          .blog-content { font-family: 'DM Sans', sans-serif; font-size: 16px; line-height: 1.8; color: #EAE6DF; }
          .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4, .blog-content h5, .blog-content h6 {
            font-family: 'Cormorant Garamond', serif; font-weight: 500; color: #F5F0E8; margin-top: 2.5em; margin-bottom: 1em; line-height: 1.3;
          }
          .blog-content h2 { font-size: 28px; }
          .blog-content h3 { font-size: 24px; }
          .blog-content h4 { font-size: 20px; }
          .blog-content p { margin-bottom: 1.5em; }
          .blog-content ul, .blog-content ol { margin-bottom: 1.5em; padding-left: 1.5em; }
          .blog-content ul { list-style-type: disc; }
          .blog-content ol { list-style-type: decimal; }
          .blog-content li { margin-bottom: 0.5em; }
          .blog-content li::marker { color: #C9A96E; }
          .blog-content blockquote {
            border-left: 3px solid #C9A96E; margin: 2em 0; padding: 1.5em;
            background: #141410; font-style: italic; color: #A89880; border-radius: 0 2px 2px 0;
          }
          .blog-content code {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            background: #1C1C17; padding: 0.2em 0.4em; border-radius: 2px; font-size: 0.9em; color: #C9A96E;
          }
          .blog-content pre {
            background: #141410; padding: 1.5em; border-radius: 2px; overflow-x: auto; margin-bottom: 1.5em; border: 1px solid #2C2C26;
          }
          .blog-content pre code { background: none; padding: 0; color: #EAE6DF; }
          .blog-content a { color: #C9A96E; text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.2s; }
          .blog-content a:hover { border-bottom-color: #C9A96E; }
          .blog-content img { max-width: 100%; height: auto; border-radius: 2px; margin: 2em 0; }
          .blog-content table { width: 100%; border-collapse: collapse; margin-bottom: 1.5em; font-size: 14px; }
          .blog-content th, .blog-content td { padding: 12px; text-align: left; border: 1px solid #2C2C26; }
          .blog-content th { background: #1C1C17; font-weight: 500; color: #F5F0E8; }
          .blog-content tr:nth-child(even) { background: #141410; }
          .blog-content hr { border: 0; border-top: 1px solid #2C2C26; margin: 3em 0; }
        `}</style>
      </Helmet>

      {/* Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[3px] bg-[#C9A96E] z-[9999] transition-all duration-100 ease-out" 
        style={{ width: \`\${scrollProgress}%\` }}
      />

      {/* HERO SECTION */}
      <div className="w-full">
        {post.featuredImage && (
          <div className="w-full h-[45vh] min-h-[400px] bg-[#141410] relative">
            <img 
              src={post.featuredImage} 
              alt={post.featuredImageAlt || post.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0B] to-transparent opacity-80" />
          </div>
        )}
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 -mt-24 relative z-10">
          <div className="bg-[#141410] border border-[#2C2C26] p-6 lg:p-12 rounded-sm shadow-2xl">
            {post.category && (
              <Link to={`/blog?category=${post.category.slug}`} className="inline-block bg-[#1C1C17] border border-[#2C2C26] text-[#C9A96E] font-dm font-semibold uppercase tracking-[0.1em] text-[11px] px-3 py-1 mb-5 rounded-sm hover:text-[#F5F0E8] transition-colors">
                {post.category.name}
              </Link>
            )}
            <h1 className="font-cm text-3xl md:text-5xl text-[#F5F0E8] leading-[1.2] mb-6">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-dm text-[12px] text-[#A89880]">
              <div className="flex items-center gap-2 text-[#F5F0E8]">
                {post.author?.avatar ? (
                  <img src={post.author.avatar} alt="author" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#1C1C17] border border-[#2C2C26] flex items-center justify-center text-[#F5F0E8]">
                    {post.author?.name?.charAt(0) || 'A'}
                  </div>
                )}
                <span>{post.author?.name || 'Admin'}</span>
              </div>
              <span className="text-[#3D3D34] hidden sm:inline">•</span>
              <span>{dateStr}</span>
              <span className="text-[#3D3D34] hidden sm:inline">•</span>
              <span>{post.readTime || 5} min read</span>
              <span className="text-[#3D3D34] hidden sm:inline">•</span>
              <span>{post.views || 0} views</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 mt-12 flex flex-col lg:flex-row gap-12">
        
        {/* MAIN CONTENT AREA */}
        <div className="flex-1 max-w-[780px] min-w-0">
          <div className="blog-content" dangerouslySetInnerHTML={{ __html: html }} />
          
          {post.tags?.length > 0 && (
            <div className="mt-12 pt-8 border-t border-[#2C2C26] flex flex-wrap gap-2">
              <span className="font-dm text-[#A89880] text-[13px] flex items-center mr-2">Tags:</span>
              {post.tags.map(tag => (
                <Link 
                  key={tag} 
                  to={`/blog?tag=${tag}`}
                  className="bg-[#141410] border border-[#2C2C26] text-[#A89880] font-dm text-[11px] px-3 py-1 rounded-sm hover:text-[#C9A96E] hover:border-[#C9A96E] transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Section 1 — Author Bio Card */}
          <div className="mt-12 bg-[#141410] border border-[#2C2C26] p-6 lg:p-8 rounded-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
            {post.author?.avatar ? (
              <img src={post.author.avatar} alt={post.author.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shrink-0 border-2 border-[#1C1C17]" />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1C1C17] border-2 border-[#2C2C26] flex items-center justify-center text-[#F5F0E8] text-2xl font-cm shrink-0">
                {post.author?.name?.charAt(0) || 'A'}
              </div>
            )}
            <div>
              <p className="font-dm text-[11px] uppercase tracking-[0.1em] text-[#C9A96E] mb-1">Written By</p>
              <h4 className="font-cm text-2xl text-[#F5F0E8] mb-2">{post.author?.name || 'Admin'}</h4>
              <p className="font-dm text-[#A89880] text-[14px] leading-relaxed m-0">
                {post.author?.bio || 'Content creator and design enthusiast passionate about sharing stories, trends, and inspiration.'}
              </p>
            </div>
          </div>

          {/* Section 4 — Post Navigation */}
          <div className="mt-10 flex flex-col sm:flex-row justify-between gap-4">
            {navPosts.prev ? (
              <Link to={`/blog/${navPosts.prev.slug}`} className="flex-1 bg-[#141410] border border-[#2C2C26] p-4 flex items-center gap-4 rounded-sm hover:border-[#3D3D34] group no-underline transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                <ChevronLeft className="text-[#6B6055] group-hover:text-[#C9A96E]" size={20} />
                <div className="flex-1 min-w-0">
                  <span className="block font-dm text-[10px] uppercase tracking-[0.08em] text-[#6B6055] mb-1">Previous Post</span>
                  <span className="block font-dm text-[13px] text-[#F5F0E8] truncate group-hover:text-[#C9A96E] transition-colors">{navPosts.prev.title}</span>
                </div>
              </Link>
            ) : <div className="flex-1" />}
            
            {navPosts.next ? (
              <Link to={`/blog/${navPosts.next.slug}`} className="flex-1 bg-[#141410] border border-[#2C2C26] p-4 flex items-center justify-between gap-4 rounded-sm hover:border-[#3D3D34] group no-underline transition-colors text-right shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                <div className="flex-1 min-w-0">
                  <span className="block font-dm text-[10px] uppercase tracking-[0.08em] text-[#6B6055] mb-1">Next Post</span>
                  <span className="block font-dm text-[13px] text-[#F5F0E8] truncate group-hover:text-[#C9A96E] transition-colors">{navPosts.next.title}</span>
                </div>
                <ChevronRight className="text-[#6B6055] group-hover:text-[#C9A96E]" size={20} />
              </Link>
            ) : <div className="flex-1" />}
          </div>
        </div>

        {/* STICKY RIGHT SIDEBAR */}
        <aside className="w-full lg:w-[340px] shrink-0">
          <div className="sticky top-[100px] flex flex-col gap-8">
            
            {/* Widget 1 — Table of Contents */}
            {toc.length > 0 && (
              <div className="bg-[#141410] border border-[#2C2C26] rounded-sm p-6 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                <h4 className="font-cm text-xl text-[#F5F0E8] border-b border-[#2C2C26] pb-3 mb-4">Table of Contents</h4>
                <ul className="m-0 p-0 list-none flex flex-col gap-3">
                  {toc.map(h => (
                    <li key={h.id} className={h.level === 'h3' ? 'ml-4' : ''}>
                      <button 
                        onClick={() => scrollToHeading(h.id)}
                        className={`text-left w-full font-dm text-[13px] leading-snug transition-colors ${activeHeading === h.id ? 'text-[#C9A96E] font-medium' : 'text-[#A89880] hover:text-[#F5F0E8]'}`}
                      >
                        {h.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Widget 2 — Shop This Post */}
            {post.linkedProducts?.length > 0 && (
              <div className="bg-[#1C1C17] border border-[#2C2C26] rounded-sm p-6 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                <h4 className="font-cm text-xl text-[#F5F0E8] border-b border-[#2C2C26] pb-3 mb-5">Shop This Post</h4>
                <div className="flex flex-col gap-4 mb-5">
                  {post.linkedProducts.map(prod => {
                    const img = prod.images?.[0]?.url || prod.images?.[0];
                    const hasDiscount = prod.comparePrice && prod.comparePrice > prod.price;
                    return (
                      <div key={prod._id} className="flex gap-4 group">
                        <Link to={`/products/${prod.slug || prod._id}`} className="block w-20 h-24 shrink-0 bg-[#141410] rounded-sm overflow-hidden border border-[#2C2C26]">
                          <img src={img} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </Link>
                        <div className="flex-1 min-w-0 py-1">
                          <Link to={`/products/${prod.slug || prod._id}`} className="no-underline">
                            <h5 className="font-dm text-[#F5F0E8] text-[13px] leading-tight line-clamp-2 mb-1 group-hover:text-[#C9A96E] transition-colors">{prod.name}</h5>
                          </Link>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="font-dm font-semibold text-[#F5F0E8] text-[13px]">Rs. {prod.price}</span>
                            {hasDiscount && (
                              <span className="font-dm text-[#6B6055] text-[11px] line-through">Rs. {prod.comparePrice}</span>
                            )}
                          </div>
                          <button 
                            onClick={(e) => { e.preventDefault(); addItem(prod, 1); }}
                            className="text-[#C9A96E] font-dm text-[11px] uppercase tracking-[0.08em] font-medium hover:underline cursor-pointer"
                          >
                            + Add to Cart
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Link to={`/products?search=${post.tags?.[0] || ''}`} className="block text-center border border-[#2C2C26] text-[#A89880] font-dm text-[11px] uppercase tracking-[0.08em] py-2.5 rounded-sm hover:bg-[#2C2C26] hover:text-[#F5F0E8] transition-colors">
                  View All Products
                </Link>
              </div>
            )}

            {/* Widget 3 — Social Share */}
            <div className="bg-[#141410] border border-[#2C2C26] rounded-sm p-6 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
              <h4 className="font-cm text-xl text-[#F5F0E8] mb-4">Share this article</h4>
              <div className="flex items-center gap-3">
                <button onClick={() => handleShare('x')} className="w-10 h-10 flex items-center justify-center bg-[#1C1C17] border border-[#2C2C26] rounded-full text-[#A89880] hover:bg-[#C9A96E] hover:text-[#0D0D0B] hover:border-[#C9A96E] transition-all cursor-pointer">
                  <Twitter size={16} fill="currentColor" />
                </button>
                <button onClick={() => handleShare('linkedin')} className="w-10 h-10 flex items-center justify-center bg-[#1C1C17] border border-[#2C2C26] rounded-full text-[#A89880] hover:bg-[#C9A96E] hover:text-[#0D0D0B] hover:border-[#C9A96E] transition-all cursor-pointer">
                  <Linkedin size={16} fill="currentColor" />
                </button>
                <button onClick={() => handleShare('facebook')} className="w-10 h-10 flex items-center justify-center bg-[#1C1C17] border border-[#2C2C26] rounded-full text-[#A89880] hover:bg-[#C9A96E] hover:text-[#0D0D0B] hover:border-[#C9A96E] transition-all cursor-pointer">
                  <Facebook size={16} fill="currentColor" />
                </button>
                <div className="relative">
                  <button onClick={() => handleShare('copy')} className="w-10 h-10 flex items-center justify-center bg-[#1C1C17] border border-[#2C2C26] rounded-full text-[#A89880] hover:bg-[#C9A96E] hover:text-[#0D0D0B] hover:border-[#C9A96E] transition-all cursor-pointer">
                    {copied ? <Check size={16} /> : <LinkIcon size={16} />}
                  </button>
                  {copied && (
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#F5F0E8] text-[#0D0D0B] font-dm text-[10px] px-2 py-1 rounded-[2px] pointer-events-none whitespace-nowrap">
                      Copied!
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </aside>
      </div>

      {/* BELOW ARTICLE CONTENT */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 mt-16 pt-12 border-t border-[#2C2C26]">
        
        {/* Section 2 — You May Also Like (Products) */}
        {relatedProducts.length > 0 && (
          <div className="mb-20">
            <h3 className="font-cm text-3xl text-[#F5F0E8] text-center mb-10">You May Also Like</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6 max-w-4xl mx-auto">
              {relatedProducts.map(prod => (
                <ProductCard key={prod._id} product={prod} />
              ))}
            </div>
          </div>
        )}

        {/* Section 3 — Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mb-16">
            <h3 className="font-cm text-3xl text-[#F5F0E8] text-center mb-10">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {relatedPosts.map(p => (
                <BlogCard key={p._id} post={p} />
              ))}
            </div>
          </div>
        )}

        {/* Section 5 — Back to Blog */}
        <div className="text-center">
          <Link to="/blog" className="inline-flex items-center justify-center gap-2 text-[#A89880] font-dm font-medium text-[13px] uppercase tracking-[0.08em] hover:text-[#C9A96E] transition-colors border border-[#2C2C26] rounded-sm px-6 py-3 hover:border-[#3D3D34] bg-[#141410]">
            <ChevronLeft size={16} /> Back to Blog
          </Link>
        </div>
        
      </div>
    </div>
  );
}
