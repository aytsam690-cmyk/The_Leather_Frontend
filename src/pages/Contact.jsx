import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, MessageCircle, ExternalLink } from 'lucide-react';
import useSettingsStore from '../store/settingsStore';

export default function Contact() {
  const { settings } = useSettingsStore();
  const siteName = settings?.siteName || 'Store';
  const ci = settings?.contactInfo || {};

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const S = {
    dm: "'DM Sans', sans-serif",
    cm: "'Cormorant Garamond', serif",
    gold: '#C9A96E',
  };

  const getSocialIcon = (platform) => {
    if (platform === 'instagram') return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
      </svg>
    );
    if (platform === 'facebook') return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    );
    if (platform === 'tiktok') return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
      </svg>
    );
    return <ExternalLink size={20} />;
  };

  return (
    <div style={{ background: '#0D0D0B', minHeight: '100vh', paddingTop: 96, paddingBottom: 80 }}>
      <Helmet>
        <title>Contact Us — {siteName}</title>
        <meta name="description" content={`Get in touch with ${siteName}. We're here to help with your orders and inquiries.`} />
        <link rel="canonical" href={`https://www.crafthid.com/contact`} />
        <meta property="og:title" content={`Contact Us — ${siteName}`} />
        <meta property="og:description" content={`Get in touch with ${siteName}. We're here to help with your orders and inquiries.`} />
        <meta property="og:url" content={window.location.origin + '/contact'} />
        <meta property="og:image" content={settings?.logo || ''} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`Contact Us — ${siteName}`} />
        <meta name="twitter:description" content={`Get in touch with ${siteName}. We're here to help with your orders and inquiries.`} />
      </Helmet>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 1, background: S.gold }} />
            <span style={{ fontFamily: S.dm, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.14em', color: S.gold }}>
              Get In Touch
            </span>
            <div style={{ width: 40, height: 1, background: S.gold }} />
          </div>
          <h1 style={{ fontFamily: S.cm, fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 500, color: '#F5F0E8', lineHeight: 1.1, margin: 0 }}>
            Contact Us
          </h1>
          <p style={{ fontFamily: S.dm, fontSize: 16, color: '#A89880', marginTop: 16, maxWidth: 500, margin: '16px auto 0' }}>
            Have a question about an order, a product, or just want to say hello? We'd love to hear from you.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {/* Email */}
          {(ci.email || 'crafthidstore@gmail.com') && (
            <motion.a 
              href={`mailto:${ci.email || 'crafthidstore@gmail.com'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{
                background: '#141410', border: '1px solid #2C2C26', borderRadius: 4, padding: 32,
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                textDecoration: 'none', transition: 'all 0.3s ease', cursor: 'pointer'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = S.gold; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2C2C26'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(201, 169, 110, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.gold, marginBottom: 20 }}>
                <Mail size={24} />
              </div>
              <h3 style={{ fontFamily: S.cm, fontSize: 24, fontWeight: 500, color: '#F5F0E8', margin: '0 0 12px 0' }}>Email</h3>
              <p style={{ fontFamily: S.dm, fontSize: 15, color: '#A89880', margin: 0 }}>
                {ci.email || 'crafthidstore@gmail.com'}
              </p>
            </motion.a>
          )}

          {/* WhatsApp */}
          {settings?.whatsappNumber && (
            <motion.a 
              href={`https://wa.me/${settings.whatsappNumber.trim()}`}
              target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                background: '#141410', border: '1px solid #2C2C26', borderRadius: 4, padding: 32,
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                textDecoration: 'none', transition: 'all 0.3s ease', cursor: 'pointer'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#25D366'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2C2C26'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(37, 211, 102, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25D366', marginBottom: 20 }}>
                <MessageCircle size={24} />
              </div>
              <h3 style={{ fontFamily: S.cm, fontSize: 24, fontWeight: 500, color: '#F5F0E8', margin: '0 0 12px 0' }}>WhatsApp</h3>
              <p style={{ fontFamily: S.dm, fontSize: 15, color: '#A89880', margin: 0 }}>
                +{settings.whatsappNumber.trim()}
              </p>
            </motion.a>
          )}

          {/* Phone */}
          {ci.phone && (
            <motion.a 
              href={`tel:${ci.phone}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{
                background: '#141410', border: '1px solid #2C2C26', borderRadius: 4, padding: 32,
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                textDecoration: 'none', transition: 'all 0.3s ease', cursor: 'pointer'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = S.gold; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2C2C26'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(201, 169, 110, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.gold, marginBottom: 20 }}>
                <Phone size={24} />
              </div>
              <h3 style={{ fontFamily: S.cm, fontSize: 24, fontWeight: 500, color: '#F5F0E8', margin: '0 0 12px 0' }}>Phone</h3>
              <p style={{ fontFamily: S.dm, fontSize: 15, color: '#A89880', margin: 0 }}>
                {ci.phone}
              </p>
            </motion.a>
          )}

          {/* Address */}
          {ci.address && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{
                background: '#141410', border: '1px solid #2C2C26', borderRadius: 4, padding: 32,
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(201, 169, 110, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.gold, marginBottom: 20 }}>
                <MapPin size={24} />
              </div>
              <h3 style={{ fontFamily: S.cm, fontSize: 24, fontWeight: 500, color: '#F5F0E8', margin: '0 0 12px 0' }}>Address</h3>
              <p style={{ fontFamily: S.dm, fontSize: 15, color: '#A89880', margin: 0, whiteSpace: 'pre-line' }}>
                {ci.address}
              </p>
            </motion.div>
          )}
        </div>

        {/* Social Links */}
        {settings?.socialLinks?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{ marginTop: 56, textAlign: 'center', paddingTop: 56, borderTop: '1px solid #2C2C26' }}
          >
            <h2 style={{ fontFamily: S.cm, fontSize: 32, fontWeight: 500, color: '#F5F0E8', marginBottom: 24 }}>Follow Us</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              {settings.socialLinks.map((s, idx) => (
                <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer" style={{
                  width: 56, height: 56, border: '1px solid #2C2C26', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#F5F0E8', background: '#141410', cursor: 'pointer',
                  transition: 'all 0.3s ease', textDecoration: 'none'
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = S.gold; e.currentTarget.style.color = S.gold; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2C2C26'; e.currentTarget.style.color = '#F5F0E8'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {getSocialIcon(s.platform)}
                </a>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
