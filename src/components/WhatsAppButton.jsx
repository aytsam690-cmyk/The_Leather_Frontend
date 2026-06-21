import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSettingsStore from '../store/settingsStore';

// Track globally so delay only happens once per session, not on every navigation
let hasShownOnce = false;

export default function WhatsAppButton() {
  const settings = useSettingsStore(s => s.settings);
  const whatsappNumber = settings?.whatsappNumber || '';

  const [show, setShow] = useState(hasShownOnce);
  const [hovered, setHovered] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);

  // Delayed entrance — only on first ever load, not on route changes
  useEffect(() => {
    if (hasShownOnce) {
      setShow(true);
      return;
    }
    const timer = setTimeout(() => {
      setShow(true);
      hasShownOnce = true;
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // If no number set, render nothing
  if (!whatsappNumber || !whatsappNumber.trim()) return null;
  if (!show) return null;

  const whatsappUrl = 'https://wa.me/' + whatsappNumber.trim();

  const handleHoverStart = () => {
    setHovered(true);
    setIsPulsing(false);
  };

  return (
    <>
      {/* Pulse keyframes */}
      <style>{`
        @keyframes whatsapp-pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      <motion.div
        initial={hasShownOnce ? false : { opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 15 }}
        style={{
          position: 'fixed',
          bottom: 28,
          right: 24,
          zIndex: 9998,
        }}
        onMouseEnter={handleHoverStart}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ── Desktop tooltip (left of button, on hover only) ── */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 4 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 4 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                right: 72,
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#111111',
                color: '#FFFFFF',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                padding: '8px 14px',
                borderRadius: 2,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                pointerEvents: 'none',
              }}
            >
              Chat with us
              <div style={{
                position: 'absolute',
                right: -6,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 0,
                height: 0,
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderLeft: '6px solid #111111',
              }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Pulse rings ── */}
        {isPulsing && (
          <>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: '#25D366',
              animation: 'whatsapp-pulse 2s ease-out infinite',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: '#25D366',
              animation: 'whatsapp-pulse 2s ease-out 0.8s infinite',
              pointerEvents: 'none',
            }} />
          </>
        )}

        {/* ── Main button — using <a> tag for reliable cross-device behavior ── */}
        <motion.a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          onMouseEnter={(e) => {
            handleHoverStart();
            e.currentTarget.style.background = '#1DA851';
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(37,211,102,0.55), 0 4px 12px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#25D366';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,211,102,0.4), 0 2px 8px rgba(0,0,0,0.15)';
          }}
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: '#25D366',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(37,211,102,0.4), 0 2px 8px rgba(0,0,0,0.15)',
            transition: 'background 0.25s ease, box-shadow 0.25s ease',
            position: 'relative',
            zIndex: 1,
            textDecoration: 'none',
          }}
          aria-label="Chat on WhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="white" style={{ width: 30, height: 30 }}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.849L.057 23.994l6.305-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.368l-.359-.213-3.722.976.994-3.624-.234-.373A9.818 9.818 0 1112 21.818z"/>
          </svg>
        </motion.a>
      </motion.div>
    </>
  );
}
