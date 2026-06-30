import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { getFeaturedProducts, getCategories, getBanners, getFeaturedReviews } from '../services/api';

import useSettingsStore from '../store/settingsStore';
import ProductCard from '../components/ProductCard';

// ─── Style tokens ─────────────────────────────────────────────────────────────
const S = {
  dm: "'DM Sans', sans-serif",
  cm: "'Cormorant Garamond', serif",
  black: '#0D0D0B', white: '#F5F0E8', surface: '#141410',
  muted: '#6B6055', secondary: '#A89880', gold: '#C9A96E',
  border: '#2C2C26', dark2: '#1C1C17',
  cream: '#F5F0E8', trueBlack: '#0D0D0B',
};

const GRADIENTS = [
  'linear-gradient(135deg,#2C2418,#4A3A28)', 'linear-gradient(135deg,#1C1810,#3A2E1C)',
  'linear-gradient(135deg,#261E14,#4A3828)', 'linear-gradient(135deg,#1E1A10,#38300E)',
  'linear-gradient(135deg,#2A2016,#4A3820)', 'linear-gradient(135deg,#1C1814,#3A2E24)',
];

// ─── Countdown ────────────────────────────────────────────────────────────────
function Countdown({ endDate }) {
  const targetDate = useRef(endDate ? new Date(endDate) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000));
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, targetDate.current - Date.now());
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');
  const segs = [
    { label: 'Days', val: pad(time.days) },
    { label: 'Hours', val: pad(time.hours) },
    { label: 'Mins', val: pad(time.mins) },
    { label: 'Secs', val: pad(time.secs) },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
      {segs.map(({ label, val }) => (
        <div key={label} style={{ background: '#1C1C17', border: '1px solid #2C2C26', borderRadius: 2, padding: 'clamp(12px, 3vw, 20px) clamp(8px, 2vw, 12px)', textAlign: 'center' }}>
          <div style={{ fontFamily: S.cm, fontSize: 'clamp(24px, 6vw, 44px)', fontWeight: 500, color: S.white, lineHeight: 1 }}>{val}</div>
          <div style={{ fontFamily: S.dm, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Promo Popup (extracted to fix hooks-in-IIFE violation) ───────────────────
function PromoPopup({ settings }) {
  const [showPromo, setShowPromo] = useState(false);

  React.useEffect(() => {
    if (settings?.promoBanner?.enabled === false) return;
    if (!sessionStorage.getItem('promoSeen')) {
      const timer = setTimeout(() => setShowPromo(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [settings?.promoBanner?.enabled]);

  if (!showPromo || settings?.promoBanner?.enabled === false) return null;

  const pb = settings?.promoBanner || {};
  const eyebrow    = pb.eyebrow    || 'Limited Time';
  const heading    = pb.heading    || 'Up to 50% Off This Week';
  const subtext    = pb.subtext    || "Don't miss our biggest sale. Limited stock — act fast.";
  const buttonText = pb.buttonText || 'Shop the Sale →';
  const buttonLink = pb.buttonLink || '/products';
  const bgImage    = pb.image      || '';
  const endDate    = pb.endDate;

  const closePromo = () => {
    setShowPromo(false);
    sessionStorage.setItem('promoSeen', '1');
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, boxSizing: 'border-box',
    }} onClick={closePromo}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
        className="promo-popup"
        style={{
          position: 'relative',
          width: '100%', maxWidth: 520,
          background: bgImage
            ? `linear-gradient(rgba(10,10,8,0.88), rgba(10,10,8,0.92)), url(${bgImage}) center/cover no-repeat`
            : '#141410',
          border: '1px solid #2C2C26', borderRadius: 6,
          padding: 'clamp(24px, 5vw, 40px)',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <button onClick={closePromo} style={{
          position: 'absolute', top: 12, right: 12,
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', border: '1px solid #2C2C26',
          color: '#A89880', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#F5F0E8'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#A89880'; }}
        >✕</button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: S.dm, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: S.gold, marginBottom: 12 }}>{eyebrow}</p>
          <h2 style={{ fontFamily: S.cm, fontSize: 'clamp(26px, 6vw, 38px)', fontWeight: 500, color: S.white, lineHeight: 1.1, margin: 0 }}>
            {heading}
          </h2>
          <p style={{ fontFamily: S.dm, fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: 300, marginTop: 12, lineHeight: 1.6 }}>
            {subtext}
          </p>
        </div>

        <div style={{ marginTop: 24 }}>
          <Countdown endDate={endDate} />
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to={buttonLink} onClick={closePromo} style={{
            display: 'inline-block', padding: '12px 32px',
            background: S.gold, border: 'none', borderRadius: 2,
            color: '#0A0A08', fontFamily: S.dm, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.2s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#D4B87A'; }}
            onMouseLeave={e => { e.currentTarget.style.background = S.gold; }}
          >{buttonText}</Link>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [homeBanners, setHomeBanners] = useState([]);
  const [promoBanners, setPromoBanners] = useState([]);
  const [featuredReviews, setFeaturedReviews] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const dragRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftRef = useRef(0);


  // ── Hero billboard state ──
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef(null);
  const bannerCountRef = useRef(0);
  const transitioningRef = useRef(false);

  // Keep refs in sync
  bannerCountRef.current = homeBanners.length;
  transitioningRef.current = isTransitioning;

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const len = bannerCountRef.current;
      if (len <= 1) return;
      setIsTransitioning(true);
      transitioningRef.current = true;
      setCurrentSlide(prev => (prev + 1) % len);
      setTimeout(() => { setIsTransitioning(false); transitioningRef.current = false; }, 1400);
    }, 5000);
  }, []);

  const goToNext = useCallback(() => {
    if (transitioningRef.current || bannerCountRef.current <= 1) return;
    setIsTransitioning(true);
    transitioningRef.current = true;
    setCurrentSlide(prev => (prev + 1) % bannerCountRef.current);
    setTimeout(() => { setIsTransitioning(false); transitioningRef.current = false; }, 1400);
    startInterval();
  }, [startInterval]);

  const goToPrev = useCallback(() => {
    if (transitioningRef.current || bannerCountRef.current <= 1) return;
    setIsTransitioning(true);
    transitioningRef.current = true;
    setCurrentSlide(prev => (prev - 1 + bannerCountRef.current) % bannerCountRef.current);
    setTimeout(() => { setIsTransitioning(false); transitioningRef.current = false; }, 1400);
    startInterval();
  }, [startInterval]);

  const goToSlide = useCallback((index) => {
    if (transitioningRef.current) return;
    setCurrentSlide(prev => {
      if (index === prev) return prev;
      setIsTransitioning(true);
      transitioningRef.current = true;
      setTimeout(() => { setIsTransitioning(false); transitioningRef.current = false; }, 1400);
      startInterval();
      return index;
    });
  }, [startInterval]);

  // ── Touch swipe for mobile ──
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  }, []);
  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  }, [goToNext, goToPrev]);

  // Auto-advance hero slides
  useEffect(() => {
    if (homeBanners.length > 1) startInterval();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [homeBanners.length, startInterval]);

  const activeBanner = homeBanners[currentSlide] ?? null;
  const pad2 = (n) => String(n + 1).padStart(2, '0');

  // ── Fetch data ──
  useEffect(() => {
    // Banners are LCP-critical — fetch first and preload the hero image
    setBannersLoading(true);
    getBanners()
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        const heroBanners = items.filter(b => b.position === 'Home Hero' && b.isActive !== false);
        setHomeBanners(heroBanners);
        setPromoBanners(items.filter(b => b.position === 'Promotional Strip' && b.isActive !== false));

        // Preload the first hero image for instant LCP
        if (heroBanners[0]?.image) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = heroBanners[0].image;
          link.fetchPriority = 'high';
          document.head.appendChild(link);
        }
      })
      .catch(() => {})
      .finally(() => setBannersLoading(false));

    // Non-critical data — load in parallel but after banners
    getFeaturedProducts()
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.products || []);
        if (items.length > 0) {
          setFeaturedProducts(items.map((p, i) => {
            const firstImage = p.images?.[0]?.url || p.images?.[0];
            return {
              id: p._id, _id: p._id, slug: p.slug, name: p.name,
              price: p.price, comparePrice: p.comparePrice,
              rating: p.ratings?.average || p.rating || 0,
              reviews: p.ratings?.count || p.numReviews || 0,
              bg: firstImage ? `url(${firstImage}) center/cover no-repeat` : GRADIENTS[i % GRADIENTS.length],
              badge: p.comparePrice > p.price ? `${Math.round((1 - p.price / p.comparePrice) * 100)}% OFF` : 'New',
              images: p.images || [], brand: p.brand, category: p.category, ratings: p.ratings,
            };
          }));
        }
      })
      .catch(() => {});

    getCategories()
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        if (items.length > 0) {
          setCategories(items.map((c, i) => ({
            name: c.name, image: c.image || null,
            bg: c.image ? `url(${c.image}) center/cover no-repeat` : GRADIENTS[i % GRADIENTS.length],
            count: c.productCount || 0, slug: c.slug,
          })));
        }
      })
      .catch(() => {});

    getFeaturedReviews()
      .then((data) => {
        if (Array.isArray(data)) setFeaturedReviews(data);
      })
      .catch(() => {});
  }, []);

  // ── Drag scroll ──
  const onMouseDown = (e) => { isDragging.current = true; startX.current = e.pageX - dragRef.current.offsetLeft; scrollLeftRef.current = dragRef.current.scrollLeft; };
  const onMouseMove = (e) => { if (!isDragging.current) return; e.preventDefault(); dragRef.current.scrollLeft = scrollLeftRef.current - (e.pageX - dragRef.current.offsetLeft - startX.current); };
  const onMouseUp = () => { isDragging.current = false; };

  // ── Scroll to next section ──
  const scrollToContent = () => {
    const hero = document.getElementById('hero-billboard');
    if (hero) {
      const next = hero.nextElementSibling;
      if (next) next.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ background: '#0D0D0B', minHeight: '100vh' }}>
      <Helmet>
        <title>{settings?.siteName || 'Store'} — Premium Products</title>
        <meta name="description" content={`Discover premium products curated just for you at ${settings?.siteName || 'our store'}. Quality you can feel, style you can trust.`} />
        <link rel="canonical" href={window.location.origin + window.location.pathname} />
        <meta property="og:title" content={`${settings?.siteName || 'Store'} — Premium Products`} />
        <meta property="og:description" content={`Discover premium products curated just for you at ${settings?.siteName || 'our store'}. Quality you can feel, style you can trust.`} />
        <meta property="og:url" content={window.location.origin} />
        <meta property="og:image" content={settings?.logo || ''} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${settings?.siteName || 'Store'} — Premium Products`} />
        <meta name="twitter:description" content={`Discover premium products curated just for you at ${settings?.siteName || 'our store'}. Quality you can feel, style you can trust.`} />
        <meta name="twitter:image" content={settings?.logo || ''} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: settings?.siteName || 'CRAFT HID',
          url: window.location.origin,
          description: `Discover premium products at ${settings?.siteName || 'CRAFT HID'}.`,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${window.location.origin}/products?keyword={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        })}</script>
      </Helmet>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO SECTION — FULL SCREEN BILLBOARD
      ═══════════════════════════════════════════════════════════════════════ */}
      {bannersLoading ? (
        /* ── Loading State ── */
        <section className="hero-billboard" style={{ width: '100%', height: '100vh', minHeight: 600, background: S.black, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
          <div style={{ fontFamily: S.cm, fontSize: 28, fontWeight: 500, color: S.white, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{settings?.siteName || 'Store'}</div>
          <div style={{ width: 128, height: 1, background: 'rgba(255,255,255,0.2)', marginTop: 24, position: 'relative', overflow: 'hidden', borderRadius: 1 }}>
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)' }}
            />
          </div>
        </section>
      ) : homeBanners.length === 0 ? (
        /* ── No Banners Fallback ── */
        <section id="hero-billboard" className="hero-billboard" style={{ width: '100%', height: '100vh', minHeight: 600, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 16px' }}>
          <div style={{ fontFamily: S.dm, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Welcome</div>
          <h1 style={{ fontFamily: S.cm, fontSize: 'clamp(48px, 8vw, 72px)', fontWeight: 500, color: S.white, lineHeight: 1, margin: 0 }}>Discover More</h1>
          <p style={{ fontFamily: S.dm, fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 300, marginTop: 24, maxWidth: 400 }}>Add banners from your admin panel to display campaigns here.</p>
          <Link to="/products" style={{
            display: 'inline-block', marginTop: 40, padding: '14px 32px',
            background: S.white, color: S.black, borderRadius: 2,
            fontFamily: S.dm, fontSize: 12, fontWeight: 500, textDecoration: 'none',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>Browse Products</Link>
        </section>
      ) : (
        /* ── Billboard Hero ── */
        <section id="hero-billboard" className="hero-billboard" style={{ position: 'relative', width: '100%', overflow: 'hidden' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >

          {/* LAYER 1 — Banner Image with crossfade */}
          <AnimatePresence mode="sync">
            <motion.img
              key={`banner-img-${currentSlide}`}
              src={activeBanner?.image}
              alt={activeBanner?.title || 'Banner'}
              fetchPriority="high"
              decoding="sync"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            />
          </AnimatePresence>

          {/* LAYER 2 — Dark Gradient Overlays */}
          <div className="hero-overlay-lr" style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.08) 100%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 30%)',
          }} />

          {/* LAYER 3 — Text Content */}
          <div className="hero-content-wrap" style={{
            position: 'relative', zIndex: 10,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>



            {/* CENTER TEXT */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 680 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`banner-text-${currentSlide}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
                >
                  {/* Eyebrow */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: 48 }}
                      transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                      style={{ height: 1, background: S.gold }}
                    />
                    {activeBanner?.title && (
                      <span style={{ fontFamily: S.dm, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.7)' }}>
                        {activeBanner.title}
                      </span>
                    )}
                  </div>

                  {/* Main Headline */}
                  {activeBanner?.subtitle && (
                    <h1 className="hero-headline" style={{
                      fontFamily: S.cm, fontWeight: 500, color: S.white,
                      lineHeight: 1.0, letterSpacing: '-0.01em', margin: 0,
                      textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {activeBanner.subtitle}
                    </h1>
                  )}

                  {/* CTA Buttons */}
                  <div className="hero-cta-wrap" style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 40, flexWrap: 'wrap' }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(activeBanner?.link || '/products')}
                      className="hero-cta-btn"
                      style={{
                        background: S.white, color: S.black,
                        fontFamily: S.dm, fontSize: 12, fontWeight: 500,
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        padding: '14px 32px', borderRadius: 2, border: 'none',
                        cursor: 'pointer', transition: 'all 0.3s ease',
                      }}
                    >
                      {activeBanner?.buttonText || activeBanner?.btn || 'Shop Now'}
                    </motion.button>
                    <button
                      onClick={() => navigate('/products')}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: S.dm, fontSize: 12, textTransform: 'uppercase',
                        letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)',
                        display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'color 0.3s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = S.white; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                    >
                      View All <span>→</span>
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* BOTTOM CONTROLS */}
            <div className="hero-bottom-controls" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>

              {/* Left — Progress bars */}
              <div className="hero-progress-bars" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {homeBanners.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => goToSlide(i)}
                    className="hero-progress-track"
                    style={{
                      height: 2, borderRadius: 1, overflow: 'hidden', cursor: 'pointer', position: 'relative',
                      background: i < currentSlide ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
                    }}
                  >
                    {i === currentSlide && (
                      <motion.div
                        key={`progress-${currentSlide}`}
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 5, ease: 'linear' }}
                        style={{ position: 'absolute', inset: 0, background: S.white, borderRadius: 1 }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Right — Arrow navigation (desktop only) */}
              <div className="hero-arrows-desktop" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={goToPrev}
                  style={{
                    width: 44, height: 44,
                    border: '1px solid rgba(255,255,255,0.3)', borderRadius: 2,
                    background: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.7)', transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = S.white; e.currentTarget.style.color = S.white; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'none'; }}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={goToNext}
                  style={{
                    width: 44, height: 44,
                    border: '1px solid rgba(255,255,255,0.3)', borderRadius: 2,
                    background: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.7)', transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = S.white; e.currentTarget.style.color = S.white; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'none'; }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION END
      ═══════════════════════════════════════════════════════════════════════ */}

      {/* ══════════════════════════════════════════════════════════════════════
          PROMO STRIP
      ═══════════════════════════════════════════════════════════════════════ */}
      {promoBanners.length > 0 && (
        <div style={{ background: '#1C1C17', borderTop: '1px solid #2C2C26', borderBottom: '1px solid #2C2C26', padding: '14px 0', overflow: 'hidden' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            {promoBanners.map(pb => (
              <div key={pb._id || pb.id} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                <h3 style={{ fontFamily: S.dm, fontWeight: 600, fontSize: 14, color: '#F5F0E8', margin: 0 }}>{pb.title}</h3>
                {pb.subtitle && <span style={{ fontFamily: S.dm, fontSize: 13, color: '#A89880' }}>— {pb.subtitle}</span>}
                {pb.btn && pb.link && (
                  <Link to={pb.link} style={{
                    padding: '5px 14px', background: '#F5F0E8', color: '#0D0D0B', borderRadius: 2,
                    fontFamily: S.dm, fontSize: 11, fontWeight: 600, textDecoration: 'none',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{pb.btn}</Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          CATEGORIES — bigger images, tighter layout
      ═══════════════════════════════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section style={{ padding: 'clamp(48px, 8vw, 64px) 0', background: '#141410' }}>
          <div className="home-container" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: S.dm, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: S.gold, marginBottom: 12 }}>
                Shop by Category
              </p>
              <h2 style={{ fontFamily: S.cm, fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 500, color: S.gold, lineHeight: 1.1, margin: 0 }}>
                Find What You Love
              </h2>
            </motion.div>

            <div
              ref={dragRef} className="drag-scroll"
              onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
              style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, marginTop: 32 }}
            >
              {categories.map((cat, i) => (
                <motion.div key={cat.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }} style={{ flexShrink: 0, width: 'clamp(150px, 40vw, 200px)' }}>
                  <Link to={`/products?category=${encodeURIComponent(cat.name)}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="cat-card" style={{
                      background: '#1C1C17', border: '1px solid #2C2C26', borderRadius: 2,
                      overflow: 'hidden', transition: 'all 0.25s ease', cursor: 'pointer',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#3D3D34'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#2C2C26'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ width: '100%', height: 140, overflow: 'hidden' }}>
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease' }}
                            className="cat-img" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: GRADIENTS[i % GRADIENTS.length] }} />
                        )}
                      </div>
                      <div style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <p style={{ fontFamily: S.dm, fontSize: 13, fontWeight: 500, color: '#F5F0E8', margin: 0 }}>{cat.name}</p>
                        <p style={{ fontFamily: S.dm, fontSize: 11, color: '#6B6055', margin: '3px 0 0' }}>{cat.count} Products</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
          <style>{`.cat-card:hover .cat-img { transform: scale(1.05); }`}</style>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          FEATURED PRODUCTS
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(48px, 8vw, 64px) 0', background: '#0D0D0B' }}>
        <div className="home-container" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.45 }} className="featured-header" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            <div>
              <p style={{ fontFamily: S.dm, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: S.gold, marginBottom: 12 }}>
                Curated Picks
              </p>
              <h2 style={{ fontFamily: S.cm, fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 500, color: S.gold, lineHeight: 1.1, margin: 0 }}>
                Featured Products
              </h2>
            </div>
            <Link to="/products" style={{ fontFamily: S.dm, fontSize: 13, color: S.secondary, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              View All →
            </Link>
          </motion.div>

          {featuredProducts.length > 0 ? (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5"
              style={{ display: 'grid' }}>
              {featuredProducts.map(p => (
                <motion.div key={p.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontFamily: S.dm, fontSize: 15, color: '#6B6055', marginBottom: 20 }}>No featured products yet.</p>
              <Link to="/products" style={{
                display: 'inline-block', padding: '12px 28px', background: '#F5F0E8', color: '#0D0D0B',
                borderRadius: 2, fontFamily: S.dm, fontSize: 13, fontWeight: 500, textDecoration: 'none',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>Browse All Products</Link>
            </div>
          )}

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          WHY CHOOSE US — tighter
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(48px, 8vw, 64px) 0', background: '#141410' }}>
        <div className="home-container" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.45 }} style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontFamily: S.dm, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: S.gold, marginBottom: 12 }}>Our Promise</p>
            <h2 style={{ fontFamily: S.cm, fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 500, color: S.gold, lineHeight: 1.1, margin: 0 }}>Why Shop With Us</h2>
            <p style={{ fontFamily: S.dm, fontSize: 15, color: S.secondary, fontWeight: 300, maxWidth: 480, margin: '14px auto 0' }}>
              We're committed to providing the best shopping experience with every order.
            </p>
          </motion.div>

          <div className="why-us-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, maxWidth: 960, margin: '0 auto' }}>
            {[
              { icon: '🚚', title: 'Free Delivery', desc: 'Free shipping on all orders. Fast and reliable delivery across Pakistan.' },
              { icon: '💵', title: 'Cash on Delivery', desc: 'Pay when your order arrives. No online payment required.' },
              { icon: '📦', title: '3–5 Days Delivery', desc: 'Quick processing and fast shipping. Get your order within days.' },
              { icon: '✅', title: 'Authentic Products', desc: '100% genuine products sourced directly from brands.' },
            ].map((card, i) => (
              <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.45 }}>
                <div style={{
                  background: '#1C1C17', border: '1px solid #2C2C26', borderRadius: 2,
                  padding: 'clamp(16px, 3vw, 28px)', height: '100%', boxSizing: 'border-box', transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.35)'; e.currentTarget.style.borderColor = '#3D3D34'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#2C2C26'; }}>
                  <div style={{
                    width: 44, height: 44, background: '#222219', border: '1px solid #3D3D34',
                    borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, marginBottom: 20,
                  }}>{card.icon}</div>
                  <h3 style={{ fontFamily: S.dm, fontSize: 14, fontWeight: 500, color: '#F5F0E8', margin: '0 0 8px' }}>{card.title}</h3>
                  <p style={{ fontFamily: S.dm, fontSize: 13, color: '#A89880', lineHeight: 1.65, fontWeight: 300, margin: 0 }}>{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          TESTIMONIALS CAROUSEL
      ═══════════════════════════════════════════════════════════════════════ */}
      {featuredReviews.length > 0 && (
        <section style={{ padding: 'clamp(48px, 8vw, 64px) 0', background: '#0D0D0B' }}>
          <div className="home-container" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} style={{ textAlign: 'center', marginBottom: 40 }}>
              <p style={{ fontFamily: S.dm, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: S.gold, marginBottom: 12 }}>What They Say</p>
              <h2 style={{ fontFamily: S.cm, fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 500, color: S.gold, lineHeight: 1.1, margin: 0 }}>Loved by Customers</h2>
            </motion.div>

            <div
              className="drag-scroll"
              style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 16, scrollSnapType: 'x mandatory' }}
            >
              {featuredReviews.map((review, i) => (
                <motion.div key={review._id || i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.4 }} 
                  style={{ flexShrink: 0, width: 'clamp(280px, 70vw, 400px)', scrollSnapAlign: 'start' }}>
                  <div style={{
                    background: '#1C1C17', border: '1px solid #2C2C26', borderRadius: 4,
                    padding: 'clamp(20px, 4vw, 32px)', height: '100%', display: 'flex', flexDirection: 'column',
                  }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={14} fill={s <= review.rating ? '#C9A96E' : 'none'} stroke={s <= review.rating ? '#C9A96E' : '#6B6055'} />
                      ))}
                    </div>
                    <p style={{ fontFamily: S.dm, fontSize: 'clamp(14px, 2vw, 16px)', color: '#F5F0E8', lineHeight: 1.6, fontWeight: 300, flex: 1, fontStyle: 'italic', marginBottom: 24 }}>
                      "{review.comment}"
                    </p>
                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                        {review.images.map((img, idx) => (
                          <div key={idx} style={{ width: 48, height: 48, borderRadius: 2, overflow: 'hidden', border: '1px solid #2C2C26' }}>
                            <img src={img.url} alt="review" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0D0D0B', border: '1px solid #2C2C26', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.gold, fontFamily: S.dm, fontWeight: 600, fontSize: 14 }}>
                        {review.name ? review.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <p style={{ fontFamily: S.dm, fontSize: 14, fontWeight: 600, color: '#F5F0E8', margin: 0 }}>{review.name || 'Anonymous'}</p>
                        {review.product && (
                          <Link to={`/product/${review.product.slug}`} style={{ fontFamily: S.dm, fontSize: 12, color: '#6B6055', textDecoration: 'none', margin: '2px 0 0', display: 'inline-block' }}>
                            On {review.product.name}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PROMO POPUP — Sale countdown (editable from Admin → Settings → Promo Banner)
      ═══════════════════════════════════════════════════════════════════════ */}
      <PromoPopup settings={settings} />



      {/* ── Responsive + Hero styles ─────────────────────────────────────────── */}
      <style>{`
        /* Hero billboard layout */
        .hero-billboard {
          height: 100vh;
          min-height: 600px;
        }
        .hero-content-wrap {
          height: 100%;
          padding: 56px 80px;
        }
        .hero-headline {
          font-size: 76px;
        }
        .hero-progress-bars {
          gap: 8px;
        }
        .hero-progress-track {
          width: 48px;
        }
        .hero-arrow-btn {
          width: 40px;
          height: 40px;
        }
        .hero-cta-btn:hover {
          background: #C9A96E !important;
          color: #0D0D0B !important;
        }

        @media (max-width: 1024px) {
          .hero-billboard {
            height: 75vh !important;
            min-height: 500px !important;
          }
          .hero-content-wrap {
            padding: 40px 24px !important;
          }
          .hero-headline {
            font-size: 42px !important;
          }
          .hero-overlay-lr {
            background: rgba(0,0,0,0.6) !important;
          }
          .hero-scroll-indicator {
            display: none !important;
          }
          .hero-progress-bars {
            gap: 6px !important;
          }
          .hero-progress-track {
            width: 32px !important;
          }
          .hero-arrow-btn {
            width: 36px !important;
            height: 36px !important;
          }
          .promo-grid { grid-template-columns: 1fr !important; }
        }
        .home-container { padding-left: 16px !important; padding-right: 16px !important; }
        @media (min-width: 768px) { .home-container { padding-left: 24px !important; padding-right: 24px !important; } }
        .featured-header { flex-direction: column; gap: 12px; }
        @media (min-width: 640px) { .featured-header { flex-direction: row !important; justify-content: space-between !important; align-items: flex-end !important; gap: 0 !important; } }
      `}</style>
    </div>
  );
}
