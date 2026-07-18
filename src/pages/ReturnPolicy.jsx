import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import useSettingsStore from '../store/settingsStore';

export default function ReturnPolicy() {
  const { settings } = useSettingsStore();
  const siteName = settings?.siteName || 'Store';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const S = {
    dm: "'DM Sans', sans-serif",
    cm: "'Cormorant Garamond', serif",
    gold: '#C9A96E',
  };

  const sections = [
    {
      title: '1. 7-Day Return Window',
      content: `We accept returns within 7 days of the delivery date. If 7 days have passed since you received your purchase, unfortunately, we cannot offer you a refund or exchange.`
    },
    {
      title: '2. Video Requirement',
      content: `To be eligible for a return or exchange, you MUST record a clear, continuous video while opening the parcel for the first time. This ensures transparency and helps us verify the condition of the product as it arrived. Claims without a parcel-opening video may be rejected.`
    },
    {
      title: '3. Condition of the Product',
      content: `Your item must be completely unused, unworn, and in the exact same condition that you received it. It must also be in the original packaging with all tags attached.`
    },
    {
      title: '4. How to Initiate a Return',
      content: `To start a return, please contact our support team directly on WhatsApp. Provide your order number, the reason for the return, and the parcel-opening video. Our team will guide you through the process.`
    },
    {
      title: '5. Non-returnable Items',
      content: `Certain items are exempt from being returned, such as custom-made products, gift cards, or items marked as final sale.`
    }
  ];

  return (
    <div style={{ background: '#0D0D0B', minHeight: '100vh', paddingTop: 96, paddingBottom: 80 }}>
      <Helmet>
        <title>Return Policy — {siteName}</title>
        <meta name="description" content={`Return Policy for ${siteName}. Learn about our 7-day return process.`} />
        <link rel="canonical" href={`https://www.crafthid.com/return-policy`} />
        <meta property="og:title" content={`Return Policy — ${siteName}`} />
        <meta property="og:description" content={`Return Policy for ${siteName}. Learn about our 7-day return process.`} />
        <meta property="og:url" content="https://www.crafthid.com/return-policy" />
        <meta property="og:image" content={settings?.logo || ''} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`Return Policy — ${siteName}`} />
        <meta name="twitter:description" content={`Return Policy for ${siteName}. Learn about our 7-day return process.`} />
      </Helmet>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 1, background: S.gold }} />
            <span style={{ fontFamily: S.dm, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.14em', color: S.gold }}>
              Legal Information
            </span>
            <div style={{ width: 40, height: 1, background: S.gold }} />
          </div>
          <h1 style={{ fontFamily: S.cm, fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 500, color: '#F5F0E8', lineHeight: 1.1, margin: 0 }}>
            Return Policy
          </h1>
          <p style={{ fontFamily: S.dm, fontSize: 14, color: '#A89880', marginTop: 16 }}>
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ background: '#141410', border: '1px solid #2C2C26', borderRadius: 4, padding: 'clamp(32px, 5vw, 56px)' }}
        >
          {sections.map((section, idx) => (
            <div key={idx} style={{ marginBottom: idx === sections.length - 1 ? 0 : 40 }}>
              <h2 style={{ fontFamily: S.cm, fontSize: 24, fontWeight: 500, color: '#F5F0E8', marginBottom: 16 }}>
                {section.title}
              </h2>
              <p style={{ fontFamily: S.dm, fontSize: 15, color: '#A89880', lineHeight: 1.8, fontWeight: 300, margin: 0 }}>
                {section.content}
              </p>
            </div>
          ))}
          
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid #2C2C26' }}>
            <h2 style={{ fontFamily: S.cm, fontSize: 24, fontWeight: 500, color: '#F5F0E8', marginBottom: 16 }}>
              Contact Us on WhatsApp
            </h2>
            <p style={{ fontFamily: S.dm, fontSize: 15, color: '#A89880', lineHeight: 1.8, fontWeight: 300, margin: 0 }}>
              To initiate a return, please send us a message on WhatsApp:{' '}
              <a 
                href={settings?.whatsappNumber ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}` : '#'} 
                target="_blank" 
                rel="noreferrer"
                style={{ color: S.gold, textDecoration: 'none', fontWeight: 500 }}
              >
                {settings?.whatsappNumber || 'Our WhatsApp'}
              </a>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
