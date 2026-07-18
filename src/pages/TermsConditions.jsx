import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import useSettingsStore from '../store/settingsStore';

export default function TermsConditions() {
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
      title: '1. Introduction',
      content: `Welcome to ${siteName}. By accessing or using our website, you agree to be bound by these Terms and Conditions. Please read them carefully before making a purchase.`
    },
    {
      title: '2. Products and Pricing',
      content: `We strive to display our products as accurately as possible. However, we do not guarantee that the product descriptions, colors, or other content available on the site are entirely accurate, complete, reliable, or error-free. All prices are subject to change without prior notice.`
    },
    {
      title: '3. Orders and Payment',
      content: `We offer Cash on Delivery (COD) as our primary payment method for orders within Pakistan. By placing a COD order, you commit to paying the full amount in cash to the courier upon delivery. We reserve the right to refuse or cancel any order for any reason, including suspected fraud or unauthorized transactions.`
    },
    {
      title: '4. Shipping and Delivery',
      content: `We offer free delivery nationwide. Standard delivery times are typically 3-5 business days within Pakistan, though unforeseen circumstances may cause delays. We are not liable for any delays caused by the courier service.`
    },
    {
      title: '5. Returns and Exchanges',
      content: `We accept returns or exchanges for defective or incorrect items within 7 days of delivery. The item must be unused, in its original packaging, and accompanied by the original receipt. Please contact our support team to initiate a return request.`
    },
    {
      title: '6. Limitation of Liability',
      content: `In no event shall ${siteName}, its directors, employees, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the site or any products purchased through it.`
    },
    {
      title: '7. Governing Law',
      content: `These Terms and Conditions shall be governed by and construed in accordance with the laws of Pakistan. Any disputes arising under or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of Pakistan.`
    }
  ];

  return (
    <div style={{ background: '#0D0D0B', minHeight: '100vh', paddingTop: 96, paddingBottom: 80 }}>
      <Helmet>
        <title>Terms & Conditions — {siteName}</title>
        <meta name="description" content={`Terms and Conditions for ${siteName}. Read the rules and guidelines for using our website and purchasing our products.`} />
        <link rel="canonical" href={`https://www.crafthid.com/terms-conditions`} />
        <meta property="og:title" content={`Terms & Conditions — ${siteName}`} />
        <meta property="og:description" content={`Terms and Conditions for ${siteName}. Read the rules and guidelines for using our website and purchasing our products.`} />
        <meta property="og:url" content="https://www.crafthid.com/terms-conditions" />
        <meta property="og:image" content={settings?.logo || ''} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`Terms & Conditions — ${siteName}`} />
        <meta name="twitter:description" content={`Terms and Conditions for ${siteName}. Read the rules and guidelines for using our website and purchasing our products.`} />
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
            Terms & Conditions
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
              If you have any questions about our Terms & Conditions, please contact us at{' '}
              <a href={`mailto:${settings?.contactInfo?.email || 'crafthidstore@gmail.com'}`} style={{ color: S.gold, textDecoration: 'none' }}>
                {settings?.contactInfo?.email || 'crafthidstore@gmail.com'}
              </a>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
