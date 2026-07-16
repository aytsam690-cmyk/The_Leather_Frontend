// BLOG FEATURE — PATCH 3 — BLOG LISTING PAGE
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function BlogCard({ post }) {
  const imageUrl = post.featuredImage || 'https://via.placeholder.com/600x800?text=No+Image';
  const category = post.category?.name || 'Uncategorized';
  const date = new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  return (
    <Link to={`/blog/${post.slug}`} className="no-underline block h-full">
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="group relative bg-[#141410] border border-[#2C2C26] rounded-sm overflow-hidden cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.25),0_4px_16px_rgba(0,0,0,0.20)] transition-all duration-250 ease-out hover:shadow-[0_4px_16px_rgba(0,0,0,0.35),0_8px_40px_rgba(0,0,0,0.25)] hover:border-[#3D3D34] flex flex-col h-full"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-[#1C1C17]">
          <img
            src={imageUrl}
            alt={post.featuredImageAlt || post.title}
            loading="lazy"
            className="w-full h-full object-cover block transition-all duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 z-[2]">
            <span className="bg-[#1C1C17]/90 backdrop-blur-sm border border-[#2C2C26] text-[#C9A96E] font-dm font-semibold uppercase tracking-[0.06em] rounded-sm text-[10px] px-2 py-[3px]">
              {category}
            </span>
          </div>
        </div>
        <div className="p-[16px] flex flex-col flex-1">
          <h3 className="font-cm font-medium text-[#F5F0E8] leading-[1.3] line-clamp-2 overflow-hidden mb-2 text-[18px]">
            {post.title}
          </h3>
          <p className="font-dm text-[#A89880] text-[13px] leading-[1.5] line-clamp-3 mb-4 flex-1">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#2C2C26]">
            <div className="flex flex-col">
              <span className="font-dm text-[#F5F0E8] text-[11px] font-medium">{post.author?.name || 'Admin'}</span>
              <span className="font-dm text-[#6B6055] text-[10px]">{date} • {post.readTime || 5} min read</span>
            </div>
            <span className="font-dm text-[10px] text-[#C9A96E] uppercase tracking-[0.08em] font-medium group-hover:underline">
              Read More
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
