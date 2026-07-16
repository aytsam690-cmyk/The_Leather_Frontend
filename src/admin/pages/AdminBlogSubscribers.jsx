// BLOG FEATURE — PATCH 5 — ADMIN PANEL
import { useState, useEffect } from 'react';
import { Download, Search } from 'lucide-react';
import adminApi from '../adminApi';

const CORAL = '#111111';

export default function AdminBlogSubscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get('/admin/blog/subscribers', { params: { page, limit: 20 } });
      setSubscribers(res.data.subscribers || []);
      setTotalPages(res.data.pages || 1);
    } catch (e) { } finally { setLoading(false); }
  };

  useEffect(() => { fetchSubscribers(); }, [page]);

  const handleExport = async () => {
    try {
      const res = await adminApi.get('/admin/blog/subscribers/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'subscribers.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Export failed');
    }
  };

  const filtered = subscribers.filter(s => s.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Newsletter Subscribers</h1>
          <p className="text-sm text-[#6B6B6B]">Manage your blog newsletter audience</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E8E8E4] text-[#111111] text-sm font-medium rounded-sm hover:bg-[#F8F8F6] transition-all">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="bg-white p-4 border border-[#E8E8E4] rounded-sm mb-6 flex items-center gap-3">
        <Search size={18} className="text-[#9E9E9E]" />
        <input type="text" placeholder="Search by email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 outline-none text-sm text-[#111111]" />
      </div>

      <div className="bg-white border border-[#E8E8E4] rounded-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E8E8E4] bg-[#F8F8F6]">
              <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Email</th>
              <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Subscribed Date</th>
              <th className="p-4 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E8E4]">
            {loading ? <tr><td colSpan="3" className="p-8 text-center text-[#9E9E9E]">Loading...</td></tr>
             : filtered.length === 0 ? <tr><td colSpan="3" className="p-8 text-center text-[#9E9E9E]">No subscribers found.</td></tr>
             : filtered.map(sub => (
              <tr key={sub._id} className="hover:bg-[#F8F8F6]/50 transition-colors">
                <td className="p-4 text-sm font-medium text-[#111111]">{sub.email}</td>
                <td className="p-4 text-sm text-[#6B6B6B]">{new Date(sub.subscribedAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full ${sub.isActive ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                    {sub.isActive ? 'Active' : 'Unsubscribed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {totalPages > 1 && !searchTerm && (
          <div className="p-4 border-t border-[#E8E8E4] flex justify-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 flex items-center justify-center rounded-sm text-sm border ${page === i + 1 ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#6B6B6B] border-[#E8E8E4] hover:bg-[#F8F8F6]'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
