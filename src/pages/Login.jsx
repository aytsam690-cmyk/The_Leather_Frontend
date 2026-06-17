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
        className="block mb-1.5 uppercase text-[#6B6055] font-medium tracking-[0.08em]"
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
          className="w-full border rounded-sm py-3 text-sm placeholder:text-[#6B6055] focus:outline-none transition-all"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            background: '#1C1C17',
            color: '#F5F0E8',
            borderColor: error ? '#C0392B' : focused ? '#C9A96E' : '#2C2C26',
            paddingLeft: Icon ? '44px' : '16px',
            paddingRight: isPassword ? '44px' : '16px',
            boxShadow: focused && !error ? '0 0 0 3px rgba(201,169,110,0.12)' : 'none',
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
        <p className="mt-1" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#C0392B' }}>
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#0D0D0B' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="auth-card border rounded-sm p-6 sm:p-10 lg:p-14 w-full max-w-md"
        style={{ background: '#141410', borderColor: '#2C2C26', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
      >
        <div className="flex flex-col items-center">
          <Link to="/" className="flex flex-col items-center no-underline">
            <div className="flex items-center gap-3">
              {settings?.logo && (
                <img src={settings.logo} alt={settings.siteName || 'Store Logo'} style={{ maxHeight: '40px', maxWidth: '140px', width: 'auto', height: 'auto', objectFit: 'contain' }} />
              )}
              <span className="font-cormorant text-[28px] font-medium tracking-[0.12em] uppercase text-center leading-none" style={{ color: '#F5F0E8' }}>
                {settings?.siteName || 'LUXE STORE'}
              </span>
            </div>
          </Link>
        </div>

        <h1 className="mt-8 font-cormorant text-[32px] font-medium text-center leading-none" style={{ color: '#F5F0E8' }}>
          Welcome Back
        </h1>
        <p className="mt-2 font-dm text-[13px] text-center font-light" style={{ color: '#A89880' }}>
          Sign in to your account
        </p>

        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 border rounded-sm p-3.5 font-dm text-[12px] text-center"
              style={{ background: 'rgba(192,57,43,0.12)', borderColor: 'rgba(192,57,43,0.3)', color: '#C0392B' }}
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
                border: `1px solid ${rememberMe ? '#C9A96E' : '#2C2C26'}`,
                background: rememberMe ? '#C9A96E' : 'transparent',
              }}
              >
                {rememberMe && <Check size={10} color="#0D0D0B" strokeWidth={3} />}
              </div>
              <span className="font-dm text-[12px]" style={{ color: '#A89880' }}>
                Remember me
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="font-dm text-[12px] cursor-pointer no-underline transition-colors"
              style={{ color: '#C9A96E' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#A89880'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#C9A96E'; }}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 border rounded-sm px-8 py-3.5 font-dm font-medium text-sm uppercase tracking-[0.04em] transition-colors"
            style={{
              background: '#F5F0E8', color: '#0D0D0B', borderColor: '#F5F0E8',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#C9A96E'; e.currentTarget.style.borderColor = '#C9A96E'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F5F0E8'; e.currentTarget.style.borderColor = '#F5F0E8'; }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              'Sign In →'
            )}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: '#2C2C26' }} />
          <span className="font-dm text-[11px] uppercase tracking-[0.1em]" style={{ color: '#6B6055' }}>or</span>
          <div className="flex-1 h-px" style={{ background: '#2C2C26' }} />
        </div>

        <p className="mt-6 text-center font-dm text-[13px]" style={{ color: '#A89880' }}>
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium cursor-pointer underline underline-offset-4 transition-colors"
            style={{ color: '#F5F0E8' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#C9A96E'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#F5F0E8'; }}
          >
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
