import React from 'react';
import { Link } from 'react-router-dom';
import useSettingsStore from '../store/settingsStore';

const S = {
  dm: "'DM Sans', sans-serif",
  cm: "'Cormorant Garamond', serif",
};

export default function Footer() {
  const { settings } = useSettingsStore();

  return (
    <footer style={{ background: '#0A0A08', borderTop: '1px solid #2C2C26' }}>
      <div className="footer-container" style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 16px' }}>
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {settings?.logo && (
                <img src={settings.logo} alt={settings.siteName || 'Store Logo'} loading="lazy" style={{ maxHeight: '32px', maxWidth: '140px', width: 'auto', height: 'auto', objectFit: 'contain' }} />
              )}
              <div style={{ fontFamily: S.cm, fontSize: 24, fontWeight: 500, color: '#F5F0E8', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{settings?.siteName || 'Store'}</div>
            </div>
            <p style={{ fontFamily: S.dm, fontSize: 12, color: '#6B6055', fontWeight: 300, marginTop: 8, lineHeight: 1.7 }}>
              {settings?.footerDescription || 'Premium products curated for those who appreciate quality and craftsmanship.'}
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              {(settings?.socialLinks || []).map(s => {
                let IconComponent = null;
                if (s.platform === 'instagram') IconComponent = (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                );
                else if (s.platform === 'facebook') IconComponent = (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                );
                else if (s.platform === 'tiktok') IconComponent = (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                  </svg>
                );
                else IconComponent = <span style={{ fontSize: 13, fontWeight: 600 }}>{s.platform.charAt(0).toUpperCase()}</span>;

                return (
                  <a key={s.platform} aria-label={s.platform} href={s.url} target="_blank" rel="noopener noreferrer" style={{
                    width: 36, height: 36, minWidth: 44, minHeight: 44, border: '1px solid #2C2C26', borderRadius: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#6B6055', background: 'transparent', cursor: 'pointer',
                    transition: 'all 0.2s', textDecoration: 'none'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.color = '#C9A96E'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#2C2C26'; e.currentTarget.style.color = '#6B6055'; }}
                  >
                    {IconComponent}
                  </a>
                );
              })}
            </div>
          </div>
          {(settings?.footerColumns?.length > 0 ? settings.footerColumns : [
            { title: 'Shop', links: [{ label: 'All Products', url: '/products' }] },
            { title: 'Help', links: [{ label: 'Journal', url: '/blogs' }, { label: 'Track Order', url: '/track-order' }, { label: 'Return Policy', url: '/return-policy' }] },
            { title: 'Legal', links: [{ label: 'Privacy Policy', url: '/privacy-policy' }, { label: 'Terms & Conditions', url: '/terms-conditions' }] },
          ]).map((col, idx) => (
            <div key={col.title || idx}>
              <h4 style={{ fontFamily: S.dm, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A89880', marginBottom: 16 }}>{col.title}</h4>
              {(col.links || []).map((link, li) => (
                <Link key={li} to={link.url || '/'} style={{ fontFamily: S.dm, fontSize: 13, color: '#6B6055', textDecoration: 'none', display: 'block', lineHeight: 2.2, transition: 'color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#F5F0E8'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#6B6055'; }}
                >{link.label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #2C2C26', marginTop: 36, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontFamily: S.dm, fontSize: 12, color: '#4A4A3F' }}>{settings?.footerCopyright || `© ${new Date().getFullYear()} ${settings?.siteName || 'Store'}. All rights reserved.`}</span>
          <span style={{ fontFamily: S.dm, fontSize: 12, color: '#4A4A3F' }}>{settings?.footerBottomText || 'Made with ❤️ in Pakistan'}</span>
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .footer-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .footer-grid > div:first-child { grid-column: 1 / -1 !important; }
        }
        .footer-container { padding-left: 16px !important; padding-right: 16px !important; }
        @media (min-width: 768px) { .footer-container { padding-left: 24px !important; padding-right: 24px !important; } }
      `}</style>
    </footer>
  );
}
