import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import useSettingsStore from '../store/settingsStore';
import { ChevronLeft } from 'lucide-react';
import ProductCard from '../components/ProductCard';

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const settings = useSettingsStore(s => s.settings);
  const siteName = settings?.siteName || 'Store';

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + `/blogs/${slug}`);
        setBlog(data);
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#0D0D0B]">
        <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#0D0D0B] text-center px-4">
        <h1 className="text-4xl font-bold text-[#F5F0E8] mb-4 font-['Cormorant_Garamond']">Blog Not Found</h1>
        <p className="text-[#A89880] mb-8 font-['DM_Sans']">The article you are looking for does not exist or has been removed.</p>
        <Link to="/blogs" className="px-8 py-3 bg-[#1C1C17] border border-[#2C2C26] text-[#F5F0E8] hover:text-[#0D0D0B] hover:bg-[#C9A96E] hover:border-[#C9A96E] transition-all duration-300 rounded-sm font-semibold uppercase tracking-wider text-sm font-['DM_Sans']">
          Return to Journal
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0B]">
      <Helmet>
        <title>{`${blog.title} | ${siteName}`}</title>
        <meta name="description" content={blog.metaDescription || `Read ${blog.title} on ${siteName}`} />
        {blog.coverImage && <meta property="og:image" content={blog.coverImage} />}
        <meta property="og:title" content={`${blog.title} | ${siteName}`} />
        <meta property="og:description" content={blog.metaDescription || `Read ${blog.title} on ${siteName}`} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `${(import.meta.env.VITE_FRONTEND_URL || 'https://www.crafthid.com')}/blog/${blog.slug}`
            },
            "headline": blog.title,
            "description": blog.metaDescription || blog.title,
            "image": blog.coverImage ? [blog.coverImage] : [],
            "datePublished": blog.createdAt,
            "dateModified": blog.updatedAt || blog.createdAt,
            "author": {
              "@type": "Organization",
              "name": siteName
            },
            "publisher": {
              "@type": "Organization",
              "name": siteName,
              "logo": {
                "@type": "ImageObject",
                "url": settings?.logo || ''
              }
            }
          })}
        </script>
      </Helmet>

      {/* Header Section */}
      <div className="max-w-4xl mx-auto px-4 pt-[120px] pb-12 text-center relative z-10">
        <Link to="/blogs" className="inline-flex items-center gap-2 text-[#A89880] hover:text-[#C9A96E] transition-colors mb-8 font-['DM_Sans'] text-sm tracking-wide uppercase">
          <ChevronLeft size={16} /> Back to Journal
        </Link>
        <div className="text-xs text-[#C9A96E] uppercase tracking-[0.1em] font-semibold mb-6 font-['DM_Sans']">
          {new Date(blog.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-[#C9A96E] font-['Cormorant_Garamond'] leading-[1.15] mb-12">
          {blog.title}
        </h1>
        {blog.coverImage && (
          <div className="w-full aspect-[21/9] md:aspect-video rounded-sm overflow-hidden mb-12 border border-[#2C2C26] shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="max-w-[800px] mx-auto px-4 pb-16 relative z-10">
        <div 
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </div>

      {/* Related Products Section */}
      {blog.relatedProducts && blog.relatedProducts.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 pb-24 relative z-10 border-t border-[#2C2C26] pt-16">
          <h2 className="text-3xl font-semibold text-[#F5F0E8] font-['Cormorant_Garamond'] mb-8 text-center">Shop the Article</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {blog.relatedProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Custom Styles for Raw HTML content to match Luxury Dark Theme */}
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
        .blog-content h1 { font-size: 2.5rem; }
        .blog-content h2 { font-size: 2rem; color: #F5F0E8; }
        .blog-content h3 { font-size: 1.5rem; color: #F5F0E8; }
        .blog-content p {
          margin-bottom: 1.5rem;
        }
        .blog-content a {
          color: #C9A96E;
          text-decoration: none;
          border-bottom: 1px solid rgba(201, 169, 110, 0.4);
          transition: all 0.2s ease;
        }
        .blog-content a:hover {
          color: #F5F0E8;
          border-bottom-color: #F5F0E8;
        }
        .blog-content img, .blog-content video, .blog-content iframe {
          max-width: 100%;
          height: auto;
          border-radius: 2px;
          margin: 3rem auto;
          display: block;
          border: 1px solid #2C2C26;
        }
        .blog-content ul, .blog-content ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }
        .blog-content ul { list-style-type: disc; }
        .blog-content ol { list-style-type: decimal; }
        .blog-content li { margin-bottom: 0.75rem; }
        .blog-content li::marker { color: #A89880; }
        .blog-content blockquote {
          border-left: 2px solid #C9A96E;
          padding-left: 1.5rem;
          font-style: italic;
          color: #A89880;
          margin: 3rem 0;
          background: #1C1C17;
          padding: 2rem;
          border-radius: 2px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
        }
      `}</style>
    </div>
  );
}
