import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { resetPassword } from '../services/api';
import useSettingsStore from '../store/settingsStore';

// ─── Password Strength ────────────────────────────────────────────────────────
function getPasswordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const levels = [
    { label: '', color: 'transparent', width: '0%' },
    { label: 'Weak', color: '#9B2226', width: '20%' },
    { label: 'Fair', color: '#C9A96E', width: '40%' },
    { label: 'Good', color: '#C9A96E', width: '70%' },
    { label: 'Strong', color: '#2D6A4F', width: '100%' },
  ];
  return levels[Math.min(score, 4)];
}

// ─── Password Input ────────────────────────────────────────────────────────────
function PasswordInput({ label, value, onChange, error, name }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);

  return (
    <div>
      <label
        className="block mb-2 uppercase text-[#6B6055] font-medium"
        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', letterSpacing: '0.06em' }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-[#1C1C17] border border-[#2C2C26] rounded-sm px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#6B6055] focus:outline-none transition-all pr-11"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            borderColor: error ? '#C0392B' : focused ? '#C9A96E' : '#2C2C26',
            boxShadow: focused && !error ? '0 0 0 3px rgba(201,169,110,0.12)' : 'none',
          }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6055] hover:text-[#F5F0E8] transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="mt-1"
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#C0392B' }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ─── Reset Password Page ──────────────────────────────────────────────────────
export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const siteName = settings?.siteName || 'Store';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const strength = getPasswordStrength(password);

  // Auto-redirect after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => navigate('/login'), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Minimum 6 characters';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setLoading(true);
    setError('');
    setFieldErrors({});
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired reset token. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Helmet>
      <title>{`Reset Password | ${siteName}`}</title>
      <meta name="description" content={`Set a new password for your ${siteName} account.`} />
      <link rel="canonical" href={window.location.origin + '/reset-password'} />
      <meta property="og:title" content={`Reset Password | ${siteName}`} />
      <meta property="og:description" content={`Set a new password for your ${siteName} account.`} />
      <meta property="og:url" content={window.location.origin + '/reset-password'} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={`Reset Password | ${siteName}`} />
      <meta name="twitter:description" content={`Set a new password for your ${siteName} account.`} />
    </Helmet>
    <div
      className="min-h-screen flex items-center justify-center bg-[#0D0D0B]"
      style={{ padding: '5rem 1rem 2rem' }}
    >
      <div className="w-full max-w-sm mx-auto">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center mb-6"
        >
          <Link to="/" className="flex flex-col items-center gap-0.5 no-underline">
            <div className="flex items-center gap-3">
              {settings?.logo && (
                <img src={settings.logo} alt={settings.siteName || 'Store Logo'} style={{ maxHeight: '40px', maxWidth: '140px', width: 'auto', height: 'auto', objectFit: 'contain' }} />
              )}
              <span
                className="text-[#F5F0E8] uppercase tracking-widest"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 600, lineHeight: 1 }}
              >
                {settings?.siteName || 'LUXE STORE'}
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="bg-[#141410] border border-[#2C2C26] rounded-sm p-6 sm:p-10"
        >
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <div
                    className="w-12 h-12 border border-[#2C2C26] rounded-sm flex items-center justify-center mx-auto mb-5"
                  >
                    <ShieldCheck size={20} style={{ color: '#6B6055' }} />
                  </div>
                  <h1
                    className="text-[#F5F0E8] mb-2"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: 500 }}
                  >
                    Reset Password
                  </h1>
                  <p
                    className="text-[#A89880]"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
                  >
                    Enter your new password below
                  </p>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-5 px-4 py-3 border rounded-sm"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#C0392B', borderColor: '#C0392B', background: 'rgba(192,57,43,0.12)' }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <PasswordInput
                    label="New Password"
                    name="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: '' })); }}
                    error={fieldErrors.password}
                  />

                  {/* Strength bar */}
                  {password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      style={{ marginTop: '-0.5rem' }}
                    >
                      <div className="h-[3px] rounded-sm bg-[#2C2C26] overflow-hidden">
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: strength.width }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          style={{ height: '100%', background: strength.color }}
                        />
                      </div>
                      {strength.label && (
                        <p
                          className="mt-1"
                          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: strength.color }}
                        >
                          {strength.label}
                        </p>
                      )}
                    </motion.div>
                  )}

                  <PasswordInput
                    label="Confirm Password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); if (fieldErrors.confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: '' })); }}
                    error={fieldErrors.confirmPassword}
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-[#F5F0E8] text-[#0D0D0B] border border-[#F5F0E8] text-sm font-medium uppercase tracking-widest px-8 py-3 rounded-sm hover:bg-[#C9A96E] transition-colors flex items-center justify-center gap-2"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: '0.1em',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                        style={{
                          width: '1.1rem',
                          height: '1.1rem',
                          border: '2px solid rgba(13,13,11,0.3)',
                          borderTopColor: '#0D0D0B',
                          borderRadius: '50%',
                        }}
                      />
                    ) : (
                      <>
                        <Lock size={14} />
                        Reset Password
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              /* Success state */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 14 }}
                  className="w-14 h-14 border border-[#2C2C26] rounded-sm flex items-center justify-center mx-auto mb-5"
                >
                  <CheckCircle size={26} style={{ color: '#2d6a4f' }} />
                </motion.div>
                <h2
                  className="text-[#F5F0E8] mb-2"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 500 }}
                >
                  Password Reset!
                </h2>
                <p
                  className="text-[#A89880] leading-relaxed mb-5"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
                >
                  Your password has been successfully reset. Redirecting to login…
                </p>
                {/* Progress bar */}
                <div
                  className="h-[2px] bg-[#2C2C26] overflow-hidden mx-auto"
                  style={{ maxWidth: '10rem', borderRadius: '1px' }}
                >
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3, ease: 'linear' }}
                    style={{ height: '100%', background: '#C9A96E' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Back to login */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          className="text-center mt-5"
        >
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 transition-colors"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: '#6B6055',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F5F0E8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6B6055')}
          >
            <ArrowLeft size={13} />
            Back to Login
          </Link>
        </motion.div>
      </div>
    </div>
    </>
  );
}
