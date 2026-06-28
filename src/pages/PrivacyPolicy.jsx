import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import useSettingsStore from '../store/settingsStore';

export default function PrivacyPolicy() {
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
      title: '1. Information We Collect',
      content: `We collect information that you provide directly to us when creating an account, making a purchase, or contacting customer support. This includes your name, email address, phone number, shipping address, and payment information. We also automatically collect certain information about your device and how you interact with our website, such as your IP address, browser type, and browsing behavior.`
    },
    {
      title: '2. How We Use Your Information',
      content: `Your information is used to process your orders, provide customer support, improve our website and services, and communicate with you about promotions or updates. We do not sell your personal information to third parties.`
    },
    {
      title: '3. Data Security',
      content: `We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems, and are required to keep the information confidential.`
    },
    {
      title: '4. Third-Party Services',
      content: `We may employ third-party companies and individuals to facilitate our Service, to provide the Service on our behalf, or to assist us in analyzing how our Service is used. These third parties have access to your Personal Information only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.`
    },
    {
      title: '5. Your Rights',
      content: `You have the right to access, correct, or delete your personal information. You may also opt-out of receiving promotional communications from us at any time by following the instructions in those emails.`
    },
    {
      title: '6. Changes to This Policy',
      content: `We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.`
    }
  ];

  return (
    <div style={{ background: '#0D0D0B', minHeight: '100vh', paddingTop: 96, paddingBottom: 80 }}>
      <Helmet>
        <title>Privacy Policy — {siteName}</title>
        <meta name="description" content={`Privacy Policy for ${siteName}. Learn how we collect, use, and protect your data.`} />
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
            Privacy Policy
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
              Contact Us
            </h2>
            <p style={{ fontFamily: S.dm, fontSize: 15, color: '#A89880', lineHeight: 1.8, fontWeight: 300, margin: 0 }}>
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href={`mailto:${settings?.contactInfo?.email || 'support@store.com'}`} style={{ color: S.gold, textDecoration: 'none' }}>
                {settings?.contactInfo?.email || 'support@store.com'}
              </a>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
