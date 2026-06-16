import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Check, Mail, Lock, Phone, User, ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import { register as apiRegister } from '../services/api';

function getPasswordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const levels = [
    { label: '', color: 'transparent', width: '0%' },
    { label: 'Weak', color: '#9B2226', width: '25%' },
    { label: 'Fair', color: '#8B4513', width: '50%' },
    { label: 'Good', color: '#C9A96E', width: '75%' },
    { label: 'Strong', color: '#2D6A4F', width: '100%' },
  ];
  return levels[Math.min(score, 4)];
}

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
          autoComplete="off"
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

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

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
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Minimum 6 characters';
    if (form.phone && !/^[+]?[\d\s()-]{7,15}$/.test(form.phone)) errs.phone = 'Enter a valid phone number';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (!termsAccepted) { setErrors({ terms: 'You must accept terms' }); return; }

    setLoading(true);
    setApiError('');
    try {
      const data = await apiRegister({ name: form.name, email: form.email, password: form.password, phone: form.phone });
      const token = data.accessToken || data.token;
      storeLogin({ _id: data._id, name: data.name, email: data.email, role: data.role }, token);
      navigate('/');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(form.password);

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
          Create Account
        </h1>
        <p className="mt-2 font-dm text-[13px] text-[#6B6B6B] text-center font-light">
          Join thousands of happy customers
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
          <LabelInput label="Full Name" name="name" value={form.name} onChange={handleChange} error={errors.name} icon={User} />
          <LabelInput label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} icon={Mail} />
          <LabelInput label="Phone Number" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} icon={Phone} />
          
          <div>
            <LabelInput label="Password" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} icon={Lock} />
            {form.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1 h-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex-1 h-full rounded-full transition-colors duration-300"
                      style={{
                        backgroundColor: i <= (strength.width === '25%' ? 1 : strength.width === '50%' ? 2 : strength.width === '75%' ? 3 : strength.width === '100%' ? 4 : 0) ? strength.color : '#E8E8E4'
                      }}
                    />
                  ))}
                </div>
                <span className="font-dm text-[11px] uppercase tracking-[0.06em] ml-2" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <LabelInput label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} icon={ShieldCheck} />

          <div className="mt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <div
                onClick={() => { setTermsAccepted(!termsAccepted); if (errors.terms) setErrors((p) => ({ ...p, terms: '' })); }}
                className="w-4 h-4 mt-0.5 rounded-sm flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                style={{
                  border: `1px solid ${errors.terms ? '#9B2226' : termsAccepted ? '#111111' : '#E8E8E4'}`,
                  background: termsAccepted ? '#111111' : 'transparent',
                }}
              >
                {termsAccepted && <Check size={10} color="#fff" strokeWidth={3} />}
              </div>
              <span className="font-dm text-[12px] text-[#6B6B6B] leading-relaxed">
                I agree to the{' '}
                <span className="text-[#111111] underline underline-offset-4 hover:text-[#C9A96E] transition-colors">
                  Terms & Conditions
                </span>{' '}
                and{' '}
                <span className="text-[#111111] underline underline-offset-4 hover:text-[#C9A96E] transition-colors">
                  Privacy Policy
                </span>
              </span>
            </label>
            {errors.terms && (
              <p className="mt-1 ml-7 font-dm text-[11px] color-[#9B2226]">
                {errors.terms}
              </p>
            )}
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
              'Create Account →'
            )}
          </button>
        </form>

        <p className="mt-6 text-center font-dm text-[13px] text-[#6B6B6B]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[#111111] font-medium hover:text-[#C9A96E] cursor-pointer underline underline-offset-4 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
