import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Check, Mail, Lock } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import { login as apiLogin } from '../services/api';

function LabelInput({ label, name, value, onChange, error, type = 'text', icon: Icon }) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label
        className="block mb-1.5 uppercase text-[#6B6B6B] font-medium tracking-[0.08em]"
        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px' }}
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E9E9E] pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <input
          type={isPassword && showPass ? 'text' : type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={isPassword ? 'current-password' : name === 'email' ? 'email' : 'off'}
          className="w-full bg-white border border-[#E8E8E4] rounded-sm py-3 text-sm text-[#111111] placeholder:text-[#9E9E9E] focus:border-[#111111] focus:outline-none transition-all"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            borderColor: error ? '#9B2226' : focused ? '#111111' : '#E8E8E4',
            paddingLeft: Icon ? '44px' : '16px',
            paddingRight: isPassword ? '44px' : '16px',
            boxShadow: focused && !error ? '0 0 0 3px rgba(17,17,17,0.06)' : 'none',
          }}
          placeholder={label}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass((s) => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9E9E9E] hover:text-[#111111] transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9B2226' }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const storeLogin = useAuthStore((s) => s.login);
  const { settings } = useSettingsStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');
    try {
      const data = await apiLogin({ email: form.email, password: form.password });
      const token = data.accessToken || data.token;
      storeLogin({ _id: data._id, name: data.name, email: data.email, role: data.role }, token);
      navigate('/account');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white border border-[#E8E8E4] rounded-sm p-6 sm:p-10 lg:p-14 w-full max-w-md shadow-card"
      >
        <div className="flex flex-col items-center">
          <Link to="/" className="flex flex-col items-center no-underline">
            <div className="flex items-center gap-3">
              {settings?.logo && (
                <img src={settings.logo} alt={settings.siteName || 'Store Logo'} style={{ maxHeight: '40px', maxWidth: '140px', width: 'auto', height: 'auto', objectFit: 'contain' }} />
              )}
              <span className="font-cormorant text-[28px] font-medium text-[#111111] tracking-[0.12em] uppercase text-center leading-none">
                {settings?.siteName || 'LUXE STORE'}
              </span>
            </div>
          </Link>
        </div>

        <h1 className="mt-8 font-cormorant text-[32px] font-medium text-[#111111] text-center leading-none">
          Welcome Back
        </h1>
        <p className="mt-2 font-dm text-[13px] text-[#6B6B6B] text-center font-light">
          Sign in to your account
        </p>

        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 bg-[#FFF1F2] border border-[#FECDD3] rounded-sm p-3.5 font-dm text-[12px] text-[#9B2226] text-center"
            >
              {apiError}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <LabelInput label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} icon={Mail} />
          <LabelInput label="Password" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} icon={Lock} />

          <div className="flex justify-between items-center mt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className="w-4 h-4 rounded-sm flex items-center justify-center transition-all cursor-pointer"
                style={{
                  border: `1px solid ${rememberMe ? '#111111' : '#E8E8E4'}`,
                  background: rememberMe ? '#111111' : 'transparent',
                }}
              >
                {rememberMe && <Check size={10} color="#fff" strokeWidth={3} />}
              </div>
              <span className="font-dm text-[12px] text-[#6B6B6B]">
                Remember me
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="font-dm text-[12px] text-[#C9A96E] hover:text-[#A07840] cursor-pointer no-underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 bg-[#111111] hover:bg-[#333333] text-white border border-[#111111] rounded-sm px-8 py-3.5 font-dm font-medium text-sm uppercase tracking-[0.04em] transition-colors"
            style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              'Sign In →'
            )}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-[#E8E8E4]" />
          <span className="font-dm text-[11px] uppercase tracking-[0.1em] text-[#9E9E9E]">or</span>
          <div className="flex-1 h-px bg-[#E8E8E4]" />
        </div>

        <p className="mt-6 text-center font-dm text-[13px] text-[#6B6B6B]">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-[#111111] font-medium hover:text-[#C9A96E] cursor-pointer underline underline-offset-4 transition-colors"
          >
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
