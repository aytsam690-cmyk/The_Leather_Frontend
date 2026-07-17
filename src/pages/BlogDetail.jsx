import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft } from 'lucide-react';
import useSettingsStore from '../store/settingsStore';
import { getBlogPost } from '../services/api';
import { optimizeImage } from '../utils/cloudinary';
import ProductCard from '../components/ProductCard';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://www.crafthid.com');

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const settings = useSettingsStore((s) => s.settings);
  const siteName = settings?.siteName || 'Store';

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(false);
        const data = await getBlogPost(slug);
        if (!active) return;
        setPost(data.post || null);
        setRelated(data.related || []);
      } catch (err) {
        console.error('Error fetching post:', err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [slug]);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#0D0D0B]">
        <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#0D0D0B] text-center px-4">
        <h1 className="text-4xl font-bold text-[#F5F0E8] mb-4 font-['Cormorant_Garamond']">Article Not Found</h1>
        <p className="text-[#A89880] mb-8 font-['DM_Sans']">The article you are looking for does not exist or has been removed.</p>
        <Link to="/blogs" className="px-8 py-3 bg-[#1C1C17] border border-[#2C2C26] text-[#F5F0E8] hover:text-[#0D0D0B] hover:bg-[#C9A96E] hover:border-[#C9A96E] transition-all duration-300 rounded-sm font-semibold uppercase tracking-wider text-sm font-['DM_Sans']">
          Return to Journal
        </Link>
      </div>
    );
  }

  // ── SEO field resolution with fallbacks ──────────────────────────────────────
  const metaTitle = post.metaTitle || post.title;
  const metaDescription = post.metaDescription || post.excerpt || `Read ${post.title} on ${siteName}`;
  const postUrl = `${FRONTEND_URL}/blog/${post.slug}`;
  const canonical = post.canonicalUrl || postUrl;
  const ogImage = post.ogImage || post.featuredImage || settings?.metaTags?.ogImage || '';
  const robotsContent = `${post.robots?.index === false ? 'noindex' : 'index'},${post.robots?.follow === false ? 'nofollow' : 'follow'}`;
  const published = post.publishedAt || post.createdAt;
  const authorName = post.author?.name || siteName;

  return (
    <div className="min-h-screen bg-[#0D0D0B]">
      <Helmet>
        <title>{`${metaTitle} | ${siteName}`}</title>
        <meta name="description" content={metaDescription} />
        <meta name="robots" content={robotsContent} />
        <link rel="canonical" href={canonical} />

        {/* Open Graph */}
        <meta property="og:title" content={`${metaTitle} | ${siteName}`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={postUrl} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="article:published_time" content={published} />
        {post.updatedAt && <meta property="article:modified_time" content={post.updatedAt} />}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${metaTitle} | ${siteName}`} />
        <meta name="twitter:description" content={metaDescription} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}

        {/* RSS discovery */}
        <link rel="alternate" type="application/rss+xml" title={`${siteName} Blog`} href={`${FRONTEND_URL}/rss.xml`} />

        {/* Article structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
            headline: post.title,
            description: metaDescription,
            image: ogImage ? [ogImage] : [],
            datePublished: published,
            dateModified: post.updatedAt || published,
            author: { '@type': post.author?.name ? 'Person' : 'Organization', name: authorName },
            publisher: {
              '@type': 'Organization',
              name: siteName,
              logo: { '@type': 'ImageObject', url: settings?.logo || '' },
            },
          })}
        </script>

        {/* Breadcrumb structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: FRONTEND_URL },
              { '@type': 'ListItem', position: 2, name: 'Journal', item: `${FRONTEND_URL}/blogs` },
              ...(post.category
                ? [{ '@type': 'ListItem', position: 3, name: post.category.name, item: `${FRONTEND_URL}/blogs?category=${post.category.slug}` }]
                : []),
              { '@type': 'ListItem', position: post.category ? 4 : 3, name: post.title, item: postUrl },
            ],
          })}
        </script>
      </Helmet>

      <article>
        {/* Header */}
        <div className="max-w-4xl mx-auto px-4 pt-[120px] pb-12 text-center relative z-10">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center justify-center flex-wrap gap-2 text-xs text-[#6B6055] font-['DM_Sans'] uppercase tracking-[0.08em]">
              <li><Link to="/" className="hover:text-[#C9A96E] transition-colors">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link to="/blogs" className="hover:text-[#C9A96E] transition-colors">Journal</Link></li>
              {post.category && (
                <>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link to={`/blogs?category=${post.category.slug}`} className="hover:text-[#C9A96E] transition-colors">
                      {post.category.name}
                    </Link>
                  </li>
                </>
              )}
            </ol>
          </nav>

          <Link to="/blogs" className="inline-flex items-center gap-2 text-[#A89880] hover:text-[#C9A96E] transition-colors mb-8 font-['DM_Sans'] text-sm tracking-wide uppercase">
            <ChevronLeft size={16} /> Back to Journal
          </Link>

          <div className="flex items-center justify-center gap-2 text-xs text-[#C9A96E] uppercase tracking-[0.1em] font-semibold mb-6 font-['DM_Sans']">
            {post.category?.name && <span>{post.category.name}</span>}
            {post.category?.name && <span className="text-[#3D3D34]">•</span>}
            <time dateTime={published}>{fmtDate(published)}</time>
            <span className="text-[#3D3D34]">•</span>
            <span>{authorName}</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-[#C9A96E] font-['Cormorant_Garamond'] leading-[1.15] mb-12">
            {post.title}
          </h1>

          {post.featuredImage && (
            <div className="w-full aspect-[21/9] md:aspect-video rounded-sm overflow-hidden mb-12 border border-[#2C2C26] shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <img src={optimizeImage(post.featuredImage, 1200)} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-w-[800px] mx-auto px-4 pb-16 relative z-10">
          <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.content }} />

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-[#2C2C26]">
              {post.tags.map((t) => (
                <span key={t._id || t} className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#A89880] border border-[#2C2C26] font-['DM_Sans']">
                  #{t.name || t}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* Related posts (same category) */}
      {related.length > 0 && (
        <aside className="max-w-6xl mx-auto px-4 pb-24 relative z-10 border-t border-[#2C2C26] pt-16">
          <h2 className="text-3xl font-semibold text-[#F5F0E8] font-['Cormorant_Garamond'] mb-8 text-center">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {related.map((r) => (
              <article key={r._id}>
                <Link to={`/blog/${r.slug}`} className="group block bg-[#141410] rounded-sm overflow-hidden border border-[#2C2C26] hover:border-[#C9A96E] transition-all duration-300 no-underline h-full">
                  <div className="w-full aspect-[16/10] bg-[#1C1C17] overflow-hidden border-b border-[#2C2C26]">
                    {r.featuredImage ? (
                      <img src={optimizeImage(r.featuredImage, 600)} alt={r.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#A89880] font-['Cormorant_Garamond'] text-lg italic">Journal Entry</div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#F5F0E8] group-hover:text-[#C9A96E] transition-colors line-clamp-2 font-['Cormorant_Garamond'] leading-snug mb-2">
                      {r.title}
                    </h3>
                    <p className="text-[#A89880] text-sm line-clamp-2 font-['DM_Sans'] leading-relaxed">
                      {r.excerpt || ''}
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </aside>
      )}

      {/* Related products — internal links to storefront */}
      {post.relatedProducts?.length > 0 && (
        <aside className="max-w-6xl mx-auto px-4 pb-24 relative z-10 border-t border-[#2C2C26] pt-16">
          <h2 className="text-3xl font-semibold text-[#F5F0E8] font-['Cormorant_Garamond'] mb-8 text-center">Shop the Article</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {post.relatedProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </aside>
      )}

      {/* Content styling — matches the luxury dark theme */}
      <style>{`
        .blog-content {
          color: #D0D0CA;
          line-height: 1.8;
          font-size: 1.05rem;
          font-family: 'DM Sans', sans-serif;
        }
        .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4 {
          color: #C9A96E;
          font-family: 'Cormorant Garamond', serif;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          font-weight: 600;
          line-height: 1.2;
        }
        .blog-content h2 { font-size: 2rem; color: #F5F0E8; }
        .blog-content h3 { font-size: 1.5rem; color: #F5F0E8; }
        .blog-content p { margin-bottom: 1.5rem; }
        .blog-content a {
          color: #C9A96E;
          text-decoration: none;
          border-bottom: 1px solid rgba(201, 169, 110, 0.4);
          transition: all 0.2s ease;
        }
        .blog-content a:hover { color: #F5F0E8; border-bottom-color: #F5F0E8; }
        .blog-content img, .blog-content video, .blog-content iframe {
          max-width: 100%;
          height: auto;
          border-radius: 2px;
          margin: 3rem auto;
          display: block;
          border: 1px solid #2C2C26;
        }
        .blog-content ul, .blog-content ol { margin-bottom: 1.5rem; padding-left: 1.5rem; }
        .blog-content ul { list-style-type: disc; }
        .blog-content ol { list-style-type: decimal; }
        .blog-content li { margin-bottom: 0.75rem; }
        .blog-content li::marker { color: #A89880; }
        .blog-content blockquote {
          border-left: 2px solid #C9A96E;
          padding-left: 1.5rem;
          font-style: italic;
          color: #A89880;
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
}
