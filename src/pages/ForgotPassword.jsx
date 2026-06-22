import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, Send } from 'lucide-react';
import { forgotPassword } from '../services/api';
import useSettingsStore from '../store/settingsStore';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const { settings } = useSettingsStore();
  const siteName = settings?.siteName || 'Store';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return; }

    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Helmet>
      <title>{`Forgot Password | ${siteName}`}</title>
      <meta name="description" content={`Reset your ${siteName} account password.`} />
      <link rel="canonical" href={window.location.origin + '/forgot-password'} />
      <meta property="og:title" content={`Forgot Password | ${siteName}`} />
      <meta property="og:description" content={`Reset your ${siteName} account password.`} />
      <meta property="og:url" content={window.location.origin + '/forgot-password'} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={`Forgot Password | ${siteName}`} />
      <meta name="twitter:description" content={`Reset your ${siteName} account password.`} />
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
            {!sent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
              >
                {/* Header */}
                <div className="text-center mb-8">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 border border-[#2C2C26] rounded-sm flex items-center justify-center mx-auto mb-5"
                  >
                    <Mail size={20} style={{ color: '#6B6055' }} />
                  </div>
                  <h1
                    className="text-[#F5F0E8] mb-2"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: 500 }}
                  >
                    Forgot Password?
                  </h1>
                  <p
                    className="text-[#A89880] leading-relaxed"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
                  >
                    Enter your email and we'll send you a reset link.
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

                <form onSubmit={handleSubmit}>
                  {/* Email input */}
                  <div className="mb-5">
                    <label
                      className="block mb-2 uppercase text-[#6B6055] font-medium"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', letterSpacing: '0.06em' }}
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      placeholder="your@email.com"
                      className="w-full bg-[#1C1C17] border border-[#2C2C26] rounded-sm px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#6B6055] focus:outline-none transition-all"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        borderColor: error ? '#C0392B' : focused ? '#C9A96E' : '#2C2C26',
                        boxShadow: focused && !error ? '0 0 0 3px rgba(201,169,110,0.12)' : 'none',
                      }}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#F5F0E8] text-[#0D0D0B] border border-[#F5F0E8] text-sm font-medium uppercase tracking-widest px-8 py-3 rounded-sm hover:bg-[#C9A96E] transition-colors flex items-center justify-center gap-2"
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
                        <Send size={14} />
                        Send Reset Link
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
                  Check Your Email
                </h2>
                <p
                  className="text-[#A89880] leading-relaxed mb-1"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
                >
                  We've sent a reset link to
                </p>
                <p
                  className="font-medium mb-6"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#C9A96E' }}
                >
                  {email}
                </p>
                <p
                  className="text-[#A89880] leading-relaxed"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px' }}
                >
                  Didn't receive it? Check your spam folder or{' '}
                  <button
                    onClick={() => { setSent(false); setError(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#C9A96E',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#A07840')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#C9A96E')}
                  >
                    try again
                  </button>
                </p>
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
