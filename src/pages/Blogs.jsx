import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useSettingsStore from '../store/settingsStore';
import { getBlogPosts, getBlogCategories } from '../services/api';
import { optimizeImage } from '../utils/cloudinary';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://www.crafthid.com');

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

export default function Blogs() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';

  const settings = useSettingsStore((s) => s.settings);
  const siteName = settings?.siteName || 'Store';

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBlogPosts({ page, limit: 9, category: activeCategory || undefined });
      setPosts(data.posts || []);
      setPages(data.pages || 1);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  useEffect(() => {
    getBlogCategories().then((c) => setCategories(c || [])).catch(() => setCategories([]));
  }, []);

  const selectCategory = (slug) => {
    setPage(1);
    const next = {};
    if (slug) next.category = slug;
    setSearchParams(next);
  };

  // Canonical: paginated pages point to the clean base URL to avoid duplicate content.
  const canonical = `${FRONTEND_URL}/blogs`;

  return (
    <div className="min-h-[80vh] bg-[#0D0D0B] pt-[120px] pb-16 px-4">
      <Helmet>
        <title>{`Journal | ${siteName}`}</title>
        <meta name="description" content={`Read the latest news, guides, and articles from ${siteName}.`} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`Journal | ${siteName}`} />
        <meta property="og:description" content={`Read the latest news, guides, and articles from ${siteName}.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <link rel="alternate" type="application/rss+xml" title={`${siteName} Blog`} href={`${FRONTEND_URL}/rss.xml`} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `Journal | ${siteName}`,
            url: canonical,
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: posts.map((p, i) => ({
                '@type': 'ListItem',
                position: (page - 1) * 9 + i + 1,
                url: `${FRONTEND_URL}/blog/${p.slug}`,
                name: p.title,
              })),
            },
          })}
        </script>
      </Helmet>

      <div className="max-w-6xl mx-auto">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-xs text-[#6B6055] font-['DM_Sans'] uppercase tracking-[0.08em]">
            <li><Link to="/" className="hover:text-[#C9A96E] transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-[#A89880]" aria-current="page">Journal</li>
          </ol>
        </nav>

        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold text-[#F5F0E8] font-['Cormorant_Garamond'] mb-4 uppercase tracking-wider">
            Our Journal
          </h1>
          <p className="text-[#A89880] max-w-2xl mx-auto font-['DM_Sans']">
            Discover our latest articles, styling guides, and news.
          </p>
        </header>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <button
              onClick={() => selectCategory('')}
              className={`px-4 py-2 rounded-sm text-xs font-semibold uppercase tracking-[0.06em] font-['DM_Sans'] border transition-all duration-300 ${
                !activeCategory
                  ? 'bg-[#C9A96E] text-[#0D0D0B] border-[#C9A96E]'
                  : 'bg-transparent text-[#A89880] border-[#2C2C26] hover:border-[#C9A96E] hover:text-[#C9A96E]'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => selectCategory(c.slug)}
                className={`px-4 py-2 rounded-sm text-xs font-semibold uppercase tracking-[0.06em] font-['DM_Sans'] border transition-all duration-300 ${
                  activeCategory === c.slug
                    ? 'bg-[#C9A96E] text-[#0D0D0B] border-[#C9A96E]'
                    : 'bg-transparent text-[#A89880] border-[#2C2C26] hover:border-[#C9A96E] hover:text-[#C9A96E]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-[#A89880] font-['DM_Sans']">
            No articles published yet. Check back later!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post._id}>
                <Link
                  to={`/blog/${post.slug}`}
                  className="group bg-[#141410] rounded-sm overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.25),0_4px_16px_rgba(0,0,0,0.20)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-[#C9A96E] transition-all duration-300 border border-[#2C2C26] flex flex-col h-full no-underline"
                >
                  <div className="w-full aspect-[16/10] bg-[#1C1C17] overflow-hidden border-b border-[#2C2C26]">
                    {post.featuredImage ? (
                      <img
                        src={optimizeImage(post.featuredImage, 600)}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#A89880] font-['Cormorant_Garamond'] text-lg italic">
                        Journal Entry
                      </div>
                    )}
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-[#C9A96E] mb-3 uppercase tracking-[0.1em] font-semibold font-['DM_Sans']">
                      {post.category?.name && <span>{post.category.name}</span>}
                      {post.category?.name && <span className="text-[#3D3D34]">•</span>}
                      <time dateTime={post.publishedAt || post.createdAt}>
                        {fmtDate(post.publishedAt || post.createdAt)}
                      </time>
                    </div>
                    <h2 className="text-2xl font-bold text-[#F5F0E8] mb-4 group-hover:text-[#C9A96E] transition-colors line-clamp-2 font-['Cormorant_Garamond'] leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-[#A89880] text-sm line-clamp-3 mb-6 flex-1 font-['DM_Sans'] leading-relaxed">
                      {post.excerpt || 'Click to read more about this article.'}
                    </p>
                    <span className="text-[#F5F0E8] font-semibold text-[13px] uppercase tracking-wider inline-flex items-center gap-2 mt-auto font-['DM_Sans'] group-hover:text-[#C9A96E] transition-colors">
                      Read Article <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-center gap-3 mt-16">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-sm border border-[#2C2C26] text-[#A89880] text-sm font-['DM_Sans'] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="text-[#A89880] text-sm font-['DM_Sans']">Page {page} of {pages}</span>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-sm border border-[#2C2C26] text-[#A89880] text-sm font-['DM_Sans'] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all"
            >
              Next <ChevronRight size={16} />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
