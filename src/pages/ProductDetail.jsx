import { useState, useEffect, useRef } from 'react';
import { getProduct, addReview } from '../services/api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Star, X, ChevronLeft, ChevronRight, Share2, Check, Truck, RefreshCw, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import useCartStore from '../store/cartStore';

import useSettingsStore from '../store/settingsStore';
import { useCurrency } from '../utils/currency';
import ProductCard from '../components/ProductCard';




// ─── Stars ───────────────────────────────────────────────────────────────────
function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" className="star-input"
          onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Star size={28} fill={(hovered || value) >= s ? '#C9A96E' : 'none'}
            stroke={(hovered || value) >= s ? '#C9A96E' : '#D0D0CA'} />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ fontSize: size, color: s <= Math.round(rating) ? '#C9A96E' : '#E8E8E4' }}>
          {s <= Math.round(rating) ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

// ─── Image Gallery ───────────────────────────────────────────────────────────
function Gallery({ images }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <div>
        {/* Main image */}
        <div
          onClick={() => setLightboxOpen(true)}
          style={{
            position: 'relative',
            aspectRatio: '1/1',
            background: '#1C1C17',
            border: '1px solid #2C2C26',
            borderRadius: 2,
            overflow: 'hidden',
            cursor: 'zoom-in',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ position: 'absolute', inset: 0 }}
            >
              {images[active]?.url ? (
                <img
                  src={images[active].url}
                  alt={images[active].alt || 'Product'}
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    transition: 'transform 700ms ease-out',
                  }}
                  className="gallery-main-img"
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: images[active]?.bg || '#F8F8F6' }} />
              )}
            </motion.div>
          </AnimatePresence>
          <div style={{
            position: 'absolute', bottom: 12, right: 12,
            fontFamily: "'DM Sans', sans-serif", fontSize: 10,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            color: '#9E9E9E', background: 'rgba(255,255,255,0.9)',
            padding: '4px 8px', borderRadius: 2,
          }}>
            Click to zoom
          </div>
        </div>

        {/* Thumbnails */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="pd-thumb"
              style={{
                width: 64, height: 64, flexShrink: 0,
                borderRadius: 2, overflow: 'hidden',
                border: i === active ? '2px solid #C9A96E' : '2px solid transparent',
                cursor: 'pointer', background: '#1C1C17',
                transition: 'border-color 0.2s ease',
                padding: 0,
              }}
              onMouseEnter={e => { if (i !== active) e.currentTarget.style.borderColor = '#3D3D34'; }}
              onMouseLeave={e => { if (i !== active) e.currentTarget.style.borderColor = 'transparent'; }}
            >
              {img.url ? (
                <img src={img.url} alt={img.alt || 'thumb'} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: img.bg || '#2C2C26' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(17,17,17,0.96)',
              zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setLightboxOpen(false)}
          >
            <div style={{ position: 'relative', maxWidth: '88vw', maxHeight: '88vh' }} onClick={e => e.stopPropagation()}>
              {images[active]?.url ? (
                <img src={images[active].url} alt="zoom" style={{ maxHeight: '88vh', maxWidth: '88vw', objectFit: 'contain' }} />
              ) : (
                <div style={{ width: 600, height: 600, maxWidth: '90vw', maxHeight: '90vh', background: images[active]?.bg || '#1C1C17', borderRadius: 2 }} />
              )}
            </div>

            {/* Close */}
            <button
              onClick={() => setLightboxOpen(false)}
              style={{
                position: 'absolute', top: 24, right: 24,
                width: 44, height: 44,
                border: '1px solid #333333', borderRadius: 2,
                background: 'transparent', color: '#FFFFFF',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#FFFFFF'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#333333'; }}
            >
              <X size={18} />
            </button>

            {/* Prev */}
            <button
              onClick={() => setActive(a => Math.max(0, a - 1))}
              disabled={active === 0}
              style={{
                position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44,
                border: '1px solid #333333', borderRadius: 2,
                background: 'transparent', color: '#FFFFFF',
                cursor: active === 0 ? 'not-allowed' : 'pointer',
                opacity: active === 0 ? 0.3 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.2s',
              }}
            >
              <ChevronLeft size={18} />
            </button>

            {/* Next */}
            <button
              onClick={() => setActive(a => Math.min(images.length - 1, a + 1))}
              disabled={active === images.length - 1}
              style={{
                position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44,
                border: '1px solid #333333', borderRadius: 2,
                background: 'transparent', color: '#FFFFFF',
                cursor: active === images.length - 1 ? 'not-allowed' : 'pointer',
                opacity: active === images.length - 1 ? 0.3 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.2s',
              }}
            >
              <ChevronRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`.gallery-main-img:hover { transform: scale(1.05); }`}</style>
    </>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────
function Tabs({ product, reviews, onReviewSubmit }) {
  const [tab, setTab] = useState('description');
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' });

  const TABS = ['description', 'specifications', 'reviews'];

  // ── handleSubmitReview logic unchanged ──
  const handleSubmitReview = async () => {
    if (reviewForm.rating === 0) { setReviewMsg({ type: 'error', text: 'Please select a rating' }); return; }
    if (!reviewForm.comment.trim()) { setReviewMsg({ type: 'error', text: 'Please enter a comment' }); return; }
    setIsSubmitting(true);
    setReviewMsg({ type: '', text: '' });
    try {
      await addReview(product._id, reviewForm);
      setReviewMsg({ type: 'success', text: 'Review submitted! It will appear once approved.' });
      setReviewForm({ rating: 0, comment: '' });
      if (onReviewSubmit) onReviewSubmit();
    } catch (err) {
      setReviewMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit review' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rating distribution
  const ratingDist = [5, 4, 3, 2, 1].map(r => ({
    star: r,
    count: reviews.filter(rv => Math.round(rv.rating) === r).length,
  }));
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : (product.ratings?.average || 0).toFixed(1);

  return (
    <div style={{ marginTop: 64, borderTop: '1px solid #2C2C26' }}>
      {/* Tab bar */}
      <div className="pd-tab-bar" style={{ display: 'flex', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '14px 16px', flexShrink: 0, minHeight: 44,
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t ? '2px solid #C9A96E' : '2px solid transparent',
              color: tab === t ? '#F5F0E8' : '#6B6055',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { if (tab !== t) e.currentTarget.style.color = '#A89880'; }}
            onMouseLeave={e => { if (tab !== t) e.currentTarget.style.color = '#6B6055'; }}
          >
            {t === 'reviews' ? `Reviews (${reviews.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ paddingTop: 32 }}
        >
          {/* ── Description ── */}
          {tab === 'description' && (
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: '#A89880',
              lineHeight: 1.8,
              maxWidth: 680,
            }}>
              {product.description}
            </p>
          )}

          {/* ── Specifications ── */}
          {tab === 'specifications' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2, maxWidth: 700 }}>
              {Object.entries(product.specs || {}).map(([k, v], i) => (
                <div key={k} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: i % 2 === 0 ? '#1C1C17' : '#141410',
                  border: '1px solid #2C2C26',
                }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6B6055' }}>{k}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: '#F5F0E8' }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Reviews ── */}
          {tab === 'reviews' && (
            <div>
              {/* Summary */}
              {reviews.length > 0 && (
                <div style={{
                  display: 'flex',
                  gap: 24,
                  alignItems: 'center',
                  paddingBottom: 32,
                  borderBottom: '1px solid #2C2C26',
                  flexWrap: 'wrap',
                }}>
                  {/* Left: big score */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(48px, 10vw, 64px)', fontWeight: 500, color: '#F5F0E8', lineHeight: 1 }}>
                      {avgRating}
                    </div>
                    <StarDisplay rating={parseFloat(avgRating)} size={16} />
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6B6055', marginTop: 6 }}>
                      Based on {reviews.length} reviews
                    </p>
                  </div>
                  {/* Right: bars */}
                  <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ratingDist.map(({ star, count }) => (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6B6055', width: 16, textAlign: 'right' }}>{star}</span>
                        <div style={{ flex: 1, height: 6, background: '#1C1C17', border: '1px solid #2C2C26', borderRadius: 9999, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%',
                            background: '#C9A96E',
                            borderRadius: 9999,
                            transition: 'width 0.6s ease',
                          }} />
                        </div>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#6B6055', width: 16 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review list */}
              <div>
                {reviews.length === 0 ? (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6B6055', padding: '32px 0' }}>
                    No reviews yet. Be the first to review this product!
                  </p>
                ) : (
                  reviews.map((r, idx) => (
                    <div key={r.id || r._id || idx} style={{ paddingTop: 32, paddingBottom: 32, borderBottom: '1px solid #2C2C26' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 2,
                          background: '#1C1C17', border: '1px solid #2C2C26',
                          fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                          color: '#F5F0E8', fontSize: 14,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {(r.user?.name || r.name || 'A')[0].toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#F5F0E8', margin: 0 }}>
                            {r.user?.name || r.name || 'Anonymous'}
                          </p>
                        </div>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6B6055', marginLeft: 'auto' }}>
                          {r.date || new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <StarDisplay rating={r.rating} size={13} />
                      </div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#A89880', lineHeight: 1.7, marginTop: 12 }}>
                        {r.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Write Review Form */}
              <div style={{ marginTop: 48, borderTop: '1px solid #2C2C26', paddingTop: 40 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 500, color: '#F5F0E8', marginBottom: 32 }}>
                  Write a Review
                </h3>

                {/* Star selector */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6055', display: 'block', marginBottom: 8 }}>
                    Your Rating
                  </label>
                  <StarInput value={reviewForm.rating} onChange={r => setReviewForm(f => ({ ...f, rating: r }))} />
                </div>

                {/* Comment */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6055', display: 'block', marginBottom: 6 }}>
                    Your Review
                  </label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: '#1C1C17', border: '1px solid #2C2C26',
                      borderRadius: 2, padding: '12px 16px',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                      color: '#F5F0E8', outline: 'none', resize: 'vertical',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#C9A96E'; }}
                    onBlur={e => { e.target.style.borderColor = '#2C2C26'; }}
                  />
                </div>

                {reviewMsg.text && (
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginBottom: 16,
                    color: reviewMsg.type === 'error' ? '#C0392B' : '#2D6A4F',
                  }}>
                    {reviewMsg.text}
                  </p>
                )}

                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting}
                  style={{
                    background: isSubmitting ? '#3D3D34' : '#F5F0E8',
                    border: 'none', borderRadius: 2,
                    color: '#0D0D0B', padding: '12px 28px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = '#C9A96E'; }}
                  onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = '#F5F0E8'; }}
                >
                  {isSubmitting ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id } = useParams();
  const { settings } = useSettingsStore();
  const { formatPrice } = useCurrency();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [qty, setQty] = useState(1);
  const [addedAnim, setAddedAnim] = useState(false);
  const [relatedPage, setRelatedPage] = useState(0);

  const { addItem } = useCartStore();
  const navigate = useNavigate();


  const DEFAULT_GRADIENT = 'linear-gradient(135deg,#667eea,#764ba2)';

  // ── Fetch logic unchanged ──
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await getProduct(id);
        const p = data.product || data;
        if (!p || !p.name) throw new Error('Product not found');

        const images = (p.images && p.images.length > 0)
          ? p.images.map(img => ({
              ...img,
              bg: img.url ? `url(${img.url}) center/cover no-repeat` : DEFAULT_GRADIENT,
              alt: img.alt || 'Product',
            }))
          : [{ url: '', bg: DEFAULT_GRADIENT, alt: 'Product' }];

        const mappedProduct = {
          ...p,
          images,
          ratings: { average: p.ratings?.average || 0, count: p.ratings?.count || 0 },
          colors: p.colors || [],
          sizes: p.sizes || [],
          specs: p.specs || {},
          stock: p.stock ?? 0,
          comparePrice: p.comparePrice || p.price,
        };

        setProduct(mappedProduct);
        setReviews(p.reviews || []);
        setRelatedProducts(data.relatedProducts || []);
      } catch (err) {
        setProduct(null);
        setReviews([]);
        setRelatedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // ── Loading state ──
  if (loading || !product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0D0B' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '2px solid #2C2C26', borderTopColor: '#C9A96E', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6B6055' }}>Loading product…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }


  const discountPct = product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem({ ...product, ratings: { average: product.ratings.average, count: product.ratings.count } }, qty, { size: selectedSize, color: product.colors[selectedColor] });
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1500);
  };

  const handleBuyNow = () => {
    if (product.stock <= 0) return;
    addItem({ ...product, ratings: { average: product.ratings.average, count: product.ratings.count } }, qty, { size: selectedSize, color: product.colors[selectedColor] });
    navigate('/checkout');
  };

  const ITEMS_PER_SLIDE = 4;
  const relatedSlides = Math.ceil(relatedProducts.length / ITEMS_PER_SLIDE);

  return (
    <div style={{ background: '#0D0D0B', minHeight: '100vh', paddingTop: 96 }}>
      <Helmet>
        <title>{product.name} | {settings?.siteName || 'Store'}</title>
        <meta name="description" content={product.description?.slice(0, 150) + '...'} />
        <meta property="og:title" content={product.name} />
        {product.images?.[0]?.url && <meta property="og:image" content={product.images[0].url} />}
      </Helmet>

      <div className="pd-container" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {[{ label: 'Home', to: '/' }, { label: 'Products', to: '/products' }].map((item, i) => (
            <span key={item.to} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link to={item.to} style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                color: '#6B6055', textDecoration: 'none', transition: 'color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = '#F5F0E8'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6B6055'; }}
              >
                {item.label}
              </Link>
              <span style={{ color: '#2C2C26', fontFamily: "'DM Sans', sans-serif" }}>/</span>
            </span>
          ))}
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#F5F0E8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50vw' }}>
            {product.name}
          </span>
        </div>

        {/* Two-column grid */}
        <div className="pd-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* LEFT: Gallery */}
          <Gallery images={product.images} />

          {/* RIGHT: Product info */}
          <div>
            {/* Category / Brand */}
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6055', marginBottom: 12 }}>
              {product.brand}
            </p>

            {/* Name */}
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: 500, color: '#F5F0E8', lineHeight: 1.15, margin: 0 }}>
              {product.name}
            </h1>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <StarDisplay rating={product.ratings.average} size={15} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6B6055', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                ({product.ratings.count.toLocaleString()} reviews)
              </span>
            </div>

            {/* Price block */}
            <div style={{ borderTop: '1px solid #2C2C26', borderBottom: '1px solid #2C2C26', padding: '20px 0', marginTop: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, fontWeight: 600, color: discountPct ? '#C9A96E' : '#F5F0E8' }}>
                {formatPrice(product.price)}
              </span>
              {product.comparePrice > product.price && (
                <>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: '#6B6055', textDecoration: 'line-through' }}>
                    {formatPrice(product.comparePrice)}
                  </span>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700,
                    color: '#0D0D0B', background: '#C9A96E',
                    padding: '3px 10px', borderRadius: 2,
                  }}>
                    {discountPct}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Colors */}
            {product.colors.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6055', display: 'block', marginBottom: 10 }}>
                  Colour: {product.colors[selectedColor]}
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {product.colors.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedColor(i)}
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: c,
                        border: '2px solid transparent',
                        cursor: 'pointer',
                        outline: selectedColor === i ? '2px solid #C9A96E' : 'none',
                        outlineOffset: 3,
                        transition: 'transform 0.15s ease',
                        minWidth: 44, minHeight: 44,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6055', display: 'block', marginBottom: 10 }}>
                  Size:
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {product.sizes.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      style={{
                        border: selectedSize === s ? '1px solid #C9A96E' : '1px solid #2C2C26',
                        borderRadius: 2,
                        padding: '10px 16px', minHeight: 44,
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                        background: selectedSize === s ? '#C9A96E' : 'transparent',
                        color: selectedSize === s ? '#0D0D0B' : '#A89880',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => { if (selectedSize !== s) { e.currentTarget.style.borderColor = '#3D3D34'; e.currentTarget.style.color = '#F5F0E8'; } }}
                      onMouseLeave={e => { if (selectedSize !== s) { e.currentTarget.style.borderColor = '#2C2C26'; e.currentTarget.style.color = '#A89880'; } }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div style={{ marginTop: 20 }}>
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6055', display: 'block', marginBottom: 10 }}>
                Quantity:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #2C2C26', borderRadius: 2, width: 'fit-content' }}>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  style={{ width: 44, height: 44, background: 'transparent', border: 'none', cursor: 'pointer', color: '#A89880', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#F5F0E8'; e.currentTarget.style.background = '#1C1C17'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#A89880'; e.currentTarget.style.background = 'transparent'; }}
                >
                  −
                </button>
                <span style={{ width: 48, textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: '#F5F0E8', fontSize: 15, borderLeft: '1px solid #2C2C26', borderRight: '1px solid #2C2C26' }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                  style={{ width: 44, height: 44, background: 'transparent', border: 'none', cursor: 'pointer', color: '#A89880', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#F5F0E8'; e.currentTarget.style.background = '#1C1C17'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#A89880'; e.currentTarget.style.background = 'transparent'; }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Stock indicator */}
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: product.stock > 0 ? '#2D6A4F' : '#C0392B',
              marginTop: 12,
            }}>
              {product.stock > 0 ? `● In Stock (${product.stock} left)` : '● Out of Stock'}
            </p>

            {/* Action buttons */}
            <div style={{ marginTop: 24 }}>
              {/* Add to cart */}
              <AnimatePresence mode="wait">
                {addedAnim ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      width: '100%', padding: '16px 0', borderRadius: 2,
                      background: '#2D6A4F', color: '#FFFFFF',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    <Check size={16} /> Added to Cart!
                  </motion.div>
                ) : (
                  <motion.button
                    key="add"
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    style={{
                      width: '100%', padding: '16px 0', borderRadius: 2,
                      background: product.stock === 0 ? '#3D3D34' : '#F5F0E8',
                      border: 'none', color: '#0D0D0B',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={e => { if (product.stock > 0) e.currentTarget.style.background = '#C9A96E'; }}
                    onMouseLeave={e => { if (product.stock > 0) e.currentTarget.style.background = '#F5F0E8'; }}
                  >
                    <ShoppingCart size={16} /> Add to Cart
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Buy Now button */}
              <motion.button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', padding: '16px 0', borderRadius: 2,
                  background: product.stock === 0 ? '#3D3D34' : '#C9A96E',
                  border: 'none', color: '#fff',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.2s ease',
                  opacity: product.stock === 0 ? 0.4 : 1,
                  marginTop: 10,
                }}
                onMouseEnter={e => { if (product.stock > 0) e.currentTarget.style.background = '#A07840'; }}
                onMouseLeave={e => { if (product.stock > 0) e.currentTarget.style.background = '#C9A96E'; }}
              >
                Buy Now
              </motion.button>

              {/* Share */}
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button style={{
                  width: 44, height: 44, borderRadius: 2,
                  border: '1px solid #2C2C26', background: 'transparent',
                  color: '#A89880', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease', flexShrink: 0,
                }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E4'; e.currentTarget.style.color = '#6B6B6B'; }}
                >
                  <Share2 size={15} />
                </button>
              </div>
            </div>

            {/* Highlights */}
            <div style={{ borderTop: '1px solid #2C2C26', marginTop: 24, paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: <Check size={15} />, text: 'Free Delivery All Over Pakistan' },
                { icon: <Truck size={15} />, text: 'Cash on delivery available nationwide' },
                { icon: <Shield size={15} />, text: '100% authentic, sourced from brand' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#C9A96E', flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#A89880' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs product={product} reviews={reviews} onReviewSubmit={() => {}} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: 80, background: '#141410', marginLeft: -16, marginRight: -16, padding: '48px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C9A96E', marginBottom: 8 }}>
                  You May Also Like
                </p>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 500, color: '#F5F0E8', margin: 0 }}>
                  Related Products
                </h2>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setRelatedPage(p => Math.max(0, p - 1))}
                  disabled={relatedPage === 0}
                  style={{ width: 44, height: 44, border: '1px solid #2C2C26', borderRadius: 2, background: '#1C1C17', color: '#A89880', cursor: relatedPage === 0 ? 'not-allowed' : 'pointer', opacity: relatedPage === 0 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (relatedPage > 0) { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.color = '#C9A96E'; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2C2C26'; e.currentTarget.style.color = '#A89880'; }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setRelatedPage(p => Math.min(relatedSlides - 1, p + 1))}
                  disabled={relatedPage >= relatedSlides - 1}
                  style={{ width: 44, height: 44, border: '1px solid #2C2C26', borderRadius: 2, background: '#1C1C17', color: '#A89880', cursor: relatedPage >= relatedSlides - 1 ? 'not-allowed' : 'pointer', opacity: relatedPage >= relatedSlides - 1 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (relatedPage < relatedSlides - 1) { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.color = '#C9A96E'; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2C2C26'; e.currentTarget.style.color = '#A89880'; }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {relatedProducts.slice(relatedPage * ITEMS_PER_SLIDE, (relatedPage + 1) * ITEMS_PER_SLIDE).map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Responsive */}
      <style>{`
  .pd-container { padding: 24px 16px; }
  @media (min-width: 768px) { .pd-container { padding: 48px 24px; } }
  @media (max-width: 1023px) { .pd-grid { grid-template-columns: 1fr !important; gap: 32px !important; } }
  @media (max-width: 639px) { 
    .pd-thumb { width: 56px !important; height: 56px !important; }
  }
  .pd-tab-bar::-webkit-scrollbar { display: none; }
  .pd-tab-bar { scrollbar-width: none; }
      `}</style>
    </div>
  );
}
