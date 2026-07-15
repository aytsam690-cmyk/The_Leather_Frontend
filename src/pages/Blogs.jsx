import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useSettingsStore from '../store/settingsStore';

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const settings = useSettingsStore(s => s.settings);
  const siteName = settings?.siteName || 'Store';

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const { data } = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/blogs');
        setBlogs(data);
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="min-h-[80vh] bg-[#0D0D0B] pt-[120px] pb-16 px-4">
      <Helmet>
        <title>Our Journal | {siteName}</title>
        <meta name="description" content={`Read the latest news, guides, and articles from ${siteName}.`} />
      </Helmet>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-semibold text-[#F5F0E8] font-['Cormorant_Garamond'] mb-4 uppercase tracking-wider">Our Journal</h1>
          <p className="text-[#A89880] max-w-2xl mx-auto font-['DM_Sans']">
            Discover our latest articles, styling guides, and news.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 text-[#A89880] font-['DM_Sans']">
            No articles published yet. Check back later!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map(blog => (
              <Link 
                key={blog._id} 
                to={`/blog/${blog.slug}`}
                className="group bg-[#1C1C17] rounded-sm overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-[#C9A96E] transition-all duration-300 border border-[#2C2C26] flex flex-col"
              >
                <div className="w-full aspect-[16/10] bg-[#11110E] overflow-hidden border-b border-[#2C2C26]">
                  {blog.coverImage ? (
                    <img 
                      src={blog.coverImage} 
                      alt={blog.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#A89880] font-['Cormorant_Garamond'] text-lg italic">
                      Journal Entry
                    </div>
                  )}
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="text-xs text-[#C9A96E] mb-3 uppercase tracking-[0.1em] font-semibold font-['DM_Sans']">
                    {new Date(blog.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <h2 className="text-2xl font-bold text-[#F5F0E8] mb-4 group-hover:text-[#C9A96E] transition-colors line-clamp-2 font-['Cormorant_Garamond'] leading-snug">
                    {blog.title}
                  </h2>
                  <p className="text-[#A89880] text-sm line-clamp-3 mb-6 flex-1 font-['DM_Sans'] leading-relaxed">
                    {blog.metaDescription || "Click to read more about this article."}
                  </p>
                  <div className="text-[#F5F0E8] font-semibold text-[13px] uppercase tracking-wider inline-flex items-center gap-2 mt-auto font-['DM_Sans'] group-hover:text-[#C9A96E] transition-colors">
                    Read Article <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
