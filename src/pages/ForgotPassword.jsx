import { useState } from 'react';
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
    <div
      className="min-h-screen flex items-center justify-center bg-[#F8F8F6]"
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
                className="text-[#111111] uppercase tracking-widest"
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
          className="bg-white border border-[#E8E8E4] rounded-sm p-10"
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
                    className="w-12 h-12 border border-[#E8E8E4] rounded-sm flex items-center justify-center mx-auto mb-5"
                  >
                    <Mail size={20} style={{ color: '#6B6B6B' }} />
                  </div>
                  <h1
                    className="text-[#111111] mb-2"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: 500 }}
                  >
                    Forgot Password?
                  </h1>
                  <p
                    className="text-[#6B6B6B] leading-relaxed"
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
                      className="mb-5 px-4 py-3 border border-[#9B2226]/30 bg-[#9B2226]/5 rounded-sm"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#9B2226' }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit}>
                  {/* Email input */}
                  <div className="mb-5">
                    <label
                      className="block mb-2 uppercase text-[#6B6B6B] font-medium"
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
                      className="w-full bg-white border border-[#E8E8E4] rounded-sm px-4 py-3 text-sm text-[#111111] placeholder-[#9E9E9E] focus:border-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]/5 transition-all"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        borderColor: error ? '#9B2226' : focused ? '#111111' : '#E8E8E4',
                      }}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#111111] text-white border border-[#111111] text-sm font-medium uppercase tracking-widest px-8 py-3 rounded-sm hover:bg-[#333333] transition-colors flex items-center justify-center gap-2"
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
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
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
                  className="w-14 h-14 border border-[#E8E8E4] rounded-sm flex items-center justify-center mx-auto mb-5"
                >
                  <CheckCircle size={26} style={{ color: '#2d6a4f' }} />
                </motion.div>
                <h2
                  className="text-[#111111] mb-2"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 500 }}
                >
                  Check Your Email
                </h2>
                <p
                  className="text-[#6B6B6B] leading-relaxed mb-1"
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
                  className="text-[#9E9E9E] leading-relaxed"
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
              color: '#6B6B6B',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#111111')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6B6B6B')}
          >
            <ArrowLeft size={13} />
            Back to Login
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
