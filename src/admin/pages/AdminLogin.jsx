import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LayoutDashboard, Loader2, AlertCircle, KeyRound, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import useAdminAuthStore from '../store/adminAuthStore';
import useSettingsStore from '../../store/settingsStore';

const CORAL = '#111111';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminLogin() {
  const [secretKey, setSecretKey]   = useState('');
  const [showKey, setShowKey]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const { login }                   = useAdminAuthStore();
  const { settings }                = useSettingsStore();
  const navigate                    = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!secretKey.trim()) {
      setError('Please enter the admin secret key.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/admin-login`, { secretKey }, { withCredentials: true });

      if (data.role !== 'admin') {
        setError('Access denied. Not an admin account.');
        setLoading(false);
        return;
      }

      login(
        { _id: data._id, name: data.name, email: data.email, role: data.role },
        data.accessToken || data.token
      );
      navigate('/aytsam-abdullah/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid secret key. Access denied.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-sm mb-4 shadow-xl"
            style={{ background: `linear-gradient(135deg, ${CORAL}, #ff9a5c)` }}
          >
            <ShieldCheck size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#111111] tracking-tight">
            Admin<span style={{ color: CORAL }}>.</span>Access
          </h1>
          <p className="text-[#9E9E9E] text-sm mt-1">Authorized personnel only</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-sm shadow-xl border border-[#E8E8E4] p-8">

          {error && (
            <div className="mb-5 px-4 py-3 rounded-sm bg-[#FEF2F2] border border-red-200 flex items-start gap-2">
              <AlertCircle size={16} className="text-[#9B2226] mt-0.5 shrink-0" />
              <p className="text-[#9B2226] text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Secret Key field */}
            <div>
              <label className="block text-xs font-semibold text-[#6B6B6B] mb-2 uppercase tracking-wider">
                Admin Secret Key
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <KeyRound size={16} className="text-[#9E9E9E]" />
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={secretKey}
                  onChange={(e) => { setSecretKey(e.target.value); setError(''); }}
                  placeholder="Enter your secret key"
                  autoComplete="off"
                  className="w-full pl-10 pr-12 py-3.5 border rounded-sm text-sm text-[#111111] outline-none transition-all"
                  style={{
                    borderColor: error ? '#ef4444' : '#e2e8f0',
                    boxShadow: error ? '0 0 0 3px #fee2e2' : 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor = CORAL; e.target.style.boxShadow = `0 0 0 3px ${CORAL}18`; }}
                  onBlur={e => { e.target.style.borderColor = error ? '#ef4444' : '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E] hover:text-[#6B6B6B] transition-colors"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-sm text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-70"
              style={{ background: `linear-gradient(135deg, ${CORAL}, #ff9a5c)` }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Verifying…</>
                : <><ShieldCheck size={16} /> Access Dashboard</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-[#9E9E9E] text-xs mt-6">
          {settings?.siteName || 'Store'} Admin Panel · Unauthorized access is prohibited
        </p>
      </div>
    </div>
  );
}
