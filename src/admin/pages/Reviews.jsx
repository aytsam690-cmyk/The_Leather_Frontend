import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';
import useAdminStore from '../store/adminStore';
import adminApi from '../adminApi';

const CORAL = '#111111';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved
  const [search, setSearch] = useState('');
  const { setBreadcrumbs } = useAdminStore();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Reviews', path: '/admin/reviews' }
    ]);
    fetchReviews();
  }, [setBreadcrumbs]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get('/reviews');
      setReviews(data || []);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, isApproved) => {
    try {
      await adminApi.put(`/reviews/${id}/approve`, { isApproved });
      setReviews(prev => prev.map(r => r._id === id ? { ...r, isApproved } : r));
    } catch (err) {
      console.error('Failed to approve review', err);
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === 'pending' && r.isApproved) return false;
    if (filter === 'approved' && !r.isApproved) return false;
    
    if (search) {
      const q = search.toLowerCase();
      return r.comment?.toLowerCase().includes(q) || 
             r.user?.name?.toLowerCase().includes(q) ||
             r.product?.name?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-[#111111]">Product Reviews</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" />
            <input 
              type="text" 
              placeholder="Search reviews..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#D0D0CA] rounded-sm text-sm focus:outline-none focus:border-[#9E9E9E]"
            />
          </div>
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            className="px-4 py-2 border border-[#D0D0CA] rounded-sm text-sm focus:outline-none bg-white text-[#111111]"
          >
            <option value="all">All Reviews</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-sm border border-[#E8E8E4] overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="w-8 h-8 border-4 border-[#D0D0CA] border-t-slate-800 rounded-full animate-spin" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-10 text-center text-[#6B6B6B]">
            <p>No reviews found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReviews.map(review => (
              <div key={review._id} className="p-5 flex flex-col sm:flex-row gap-5 hover:bg-[#F8F8F6]/50 transition-colors">
                {/* Product Info */}
                <div className="sm:w-1/4 shrink-0">
                  <p className="text-xs text-[#9E9E9E] mb-1">Product</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-[#F8F8F6] flex items-center justify-center overflow-hidden shrink-0">
                      {review.product?.images?.[0]?.url ? (
                        <img src={review.product.images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[#9E9E9E] text-xs">No img</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[#111111] line-clamp-2">{review.product?.name || 'Unknown Product'}</p>
                  </div>
                </div>

                {/* Review Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-[#111111]">{review.user?.name || review.name || 'Anonymous'}</p>
                      <p className="text-xs text-[#9E9E9E]">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={14} fill={s <= review.rating ? '#fbbf24' : 'none'} stroke={s <= review.rating ? '#fbbf24' : '#6B6B6B'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed bg-[#F8F8F6] p-3 rounded-sm border border-[#E8E8E4]">{review.comment}</p>
                </div>

                {/* Actions */}
                <div className="sm:w-48 shrink-0 flex flex-col sm:items-end justify-center gap-2 border-t sm:border-t-0 sm:border-l border-[#E8E8E4] pt-4 sm:pt-0 sm:pl-5">
                  {review.isApproved ? (
                    <div className="flex items-center gap-1 text-emerald-500 text-sm font-semibold mb-2">
                      <CheckCircle size={16} /> Approved
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-500 text-sm font-semibold mb-2">
                      <Clock size={16} /> Pending
                    </div>
                  )}
                  
                  <div className="flex gap-2 w-full sm:justify-end">
                    {!review.isApproved && (
                      <button 
                        onClick={() => handleApprove(review._id, true)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-sm text-xs font-semibold transition-colors flex-1 sm:flex-none text-center"
                      >
                        Approve
                      </button>
                    )}
                    {review.isApproved && (
                      <button 
                        onClick={() => handleApprove(review._id, false)}
                        className="px-3 py-1.5 bg-[#F8F8F6] text-[#6B6B6B] hover:bg-[#E8E8E4] rounded-sm text-xs font-semibold transition-colors flex-1 sm:flex-none text-center"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
