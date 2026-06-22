import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import useSettingsStore from '../store/settingsStore';

const VALUES = [
  {
    icon: '✦',
    title: 'Quality First',
    desc: 'Every product in our collection is carefully vetted for craftsmanship, durability, and design excellence.',
  },
  {
    icon: '◎',
    title: 'Curated Selection',
    desc: 'We handpick each item from trusted brands and artisans around the world, so you don\'t have to search.',
  },
  {
    icon: '⟐',
    title: 'Transparent Pricing',
    desc: 'No hidden markups. We believe in fair pricing that reflects true value — nothing more, nothing less.',
  },
  {
    icon: '◇',
    title: 'Sustainable Practices',
    desc: 'We partner with brands committed to ethical sourcing and environmentally responsible manufacturing.',
  },
];

const STATS = [
  { num: '12,000+', label: 'Happy Customers' },
  { num: '500+', label: 'Curated Products' },
  { num: '4.9', label: 'Average Rating' },
  { num: '24/7', label: 'Customer Support' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay: i * 0.1 },
  }),
};

export default function About() {
  const { settings } = useSettingsStore();
  const siteName = settings?.siteName || 'Luxe Store';

  return (
    <div style={{ background: '#0D0D0B', minHeight: '100vh' }}>
      <Helmet>
        <title>About Us — {siteName}</title>
        <meta name="description" content={`Learn about ${siteName} — our story, values, and commitment to bringing you premium products with exceptional quality.`} />
        <link rel="canonical" href={window.location.origin + window.location.pathname} />
        <meta property="og:title" content={`About Us — ${siteName}`} />
        <meta property="og:description" content={`Learn about ${siteName} — our story, values, and commitment to bringing you premium products with exceptional quality.`} />
        <meta property="og:url" content={window.location.origin + '/about'} />
        <meta property="og:image" content={settings?.logo || ''} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`About Us — ${siteName}`} />
        <meta name="twitter:description" content={`Learn about ${siteName} — our story, values, and commitment to bringing you premium products with exceptional quality.`} />
        <meta name="twitter:image" content={settings?.logo || ''} />
      </Helmet>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{
        paddingTop: 72,
        background: '#111111',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle decorative line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: 1,
          height: '100%',
          background: 'linear-gradient(to bottom, transparent, rgba(201,169,110,0.15), transparent)',
        }} />

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '96px 24px 80px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 1, background: '#C9A96E' }} />
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: '#C9A96E',
              }}>Our Story</span>
              <div style={{ width: 40, height: 1, background: '#C9A96E' }} />
            </div>
          </motion.div>

          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(40px, 5vw, 64px)',
              fontWeight: 500,
              color: '#FFFFFF',
              lineHeight: 1.1,
              margin: '0 0 24px',
              letterSpacing: '-0.01em',
            }}
          >
            Redefining Premium Shopping
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 17,
              color: 'rgba(255,255,255,0.55)',
              fontWeight: 300,
              lineHeight: 1.75,
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            We started with a simple belief: everyone deserves access to beautifully crafted products
            without the luxury price tag. Today, we bring that vision to life — one curated collection at a time.
          </motion.p>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <section style={{ background: '#141410', borderBottom: '1px solid #2C2C26' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                style={{
                  padding: '40px 16px',
                  textAlign: 'center',
                  borderRight: i < 3 ? '1px solid #2C2C26' : 'none',
                }}
              >
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 36,
                  fontWeight: 500,
                  color: '#F5F0E8',
                  lineHeight: 1,
                }}>{s.num}</div>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#6B6055',
                  marginTop: 8,
                }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Brand story ───────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 0', background: '#0D0D0B' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="about-story-grid">

            {/* Left — text */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#C9A96E',
                marginBottom: 12,
              }}>Who We Are</p>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(28px, 5vw, 44px)',
                fontWeight: 500,
                color: '#F5F0E8',
                lineHeight: 1.1,
                margin: '0 0 24px',
              }}>Built on a Passion for Quality</h2>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                color: '#A89880',
                fontWeight: 300,
                lineHeight: 1.8,
                marginBottom: 16,
              }}>
                {siteName} was founded with the vision of making premium products accessible to everyone.
                We believe that great design and exceptional quality should not come with an unreachable price tag.
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                color: '#A89880',
                fontWeight: 300,
                lineHeight: 1.8,
                marginBottom: 32,
              }}>
                Our team scours the globe to find the finest brands and craftspeople, bringing you a curated
                selection of products that stand the test of time. From electronics to fashion, home to sports —
                every item in our catalog has earned its place.
              </p>
              <Link
                to="/products"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#F5F0E8',
                  border: '1px solid #3D3D34',
                  borderRadius: 2,
                  padding: '12px 28px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  display: 'inline-block',
                  background: 'transparent',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F5F0E8'; e.currentTarget.style.color = '#0D0D0B'; e.currentTarget.style.borderColor = '#F5F0E8'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#F5F0E8'; e.currentTarget.style.borderColor = '#3D3D34'; }}
              >
                Explore Our Collection →
              </Link>
            </motion.div>

            {/* Right — image/visual placeholder */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={2}
            >
              <div style={{
                background: '#1C1C17',
                border: '1px solid #2C2C26',
                borderRadius: 2,
                aspectRatio: '4/5',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 24,
                padding: 40,
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Decorative rings */}
                <div style={{
                  position: 'absolute',
                  width: 300, height: 300,
                  border: '1px solid #E8E8E4',
                  borderRadius: '50%',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  opacity: 0.1
                }} />
                <div style={{
                  position: 'absolute',
                  width: 200, height: 200,
                  border: '1px solid #2C2C26',
                  borderRadius: '50%',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                }} />
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 120,
                  fontWeight: 600,
                  color: '#F5F0E8',
                  lineHeight: 1,
                  opacity: 0.03,
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  whiteSpace: 'nowrap'
                }}>{siteName.toUpperCase()}</div>

                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 56,
                  fontWeight: 500,
                  color: '#F5F0E8',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                  position: 'relative',
                  zIndex: 1,
                }}>{siteName.split(' ')[0].toUpperCase()}</div>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  color: '#9E9E9E',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  position: 'relative',
                  zIndex: 1,
                }}>STORE · EST. 2024</div>
                <div style={{
                  width: 40, height: 1,
                  background: '#C9A96E',
                  position: 'relative',
                  zIndex: 1,
                }} />
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: '#6B6055',
                  textAlign: 'center',
                  maxWidth: 240,
                  lineHeight: 1.7,
                  position: 'relative',
                  zIndex: 1,
                }}>
                  Premium products, curated with care for those who appreciate quality.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Values ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 0', background: '#141410' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#C9A96E',
              marginBottom: 12,
            }}>Our Values</p>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 44,
              fontWeight: 500,
              color: '#F5F0E8',
              lineHeight: 1.1,
              margin: 0,
            }}>What We Stand For</h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
              >
                <div
                  style={{
                    background: '#1C1C17',
                    border: '1px solid #2C2C26',
                    borderRadius: 2,
                    padding: 32,
                    height: '100%',
                    boxSizing: 'border-box',
                    transition: 'box-shadow 0.25s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{
                    width: 48, height: 48,
                    background: '#2C2C26',
                    border: '1px solid #3D3D34',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    marginBottom: 24,
                    color: '#C9A96E',
                  }}>{v.icon}</div>
                  <h3 style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#F5F0E8',
                    margin: '0 0 8px',
                  }}>{v.title}</h3>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: '#A89880',
                    lineHeight: 1.65,
                    fontWeight: 300,
                    margin: 0,
                  }}>{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', background: '#111111' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: '#C9A96E',
              marginBottom: 16,
            }}>Join Us</p>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 500,
              color: '#FFFFFF',
              lineHeight: 1.1,
              margin: '0 0 16px',
            }}>Start Your Journey</h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              color: 'rgba(255,255,255,0.55)',
              fontWeight: 300,
              lineHeight: 1.7,
              marginBottom: 32,
            }}>
              Discover what makes us different. Browse our curated collections and experience shopping the way it should be.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Link
                to="/products"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#FFFFFF',
                  border: '1px solid #C9A96E',
                  background: '#C9A96E',
                  borderRadius: 2,
                  padding: '12px 28px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C9A96E'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#C9A96E'; e.currentTarget.style.color = '#FFFFFF'; }}
              >
                Shop Now →
              </Link>
              <Link
                to="/track-order"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.6)',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                  padding: '12px 16px',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >
                Track Order
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Responsive ─────────────────────────────────────────────────────── */}
      <style>{`
        @media (max-width: 1024px) {
          .about-story-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
