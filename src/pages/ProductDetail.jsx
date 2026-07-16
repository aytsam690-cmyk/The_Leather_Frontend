import React, { useState, useEffect } from 'react';
import { getProduct, addReview, addGuestReview } from '../services/api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Star, X, ChevronLeft, ChevronRight, Share2, Check, Truck, Shield, RotateCcw } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import { useCurrency } from '../utils/currency';
import { optimizeImage } from '../utils/cloudinary';
import ProductCard from '../components/ProductCard';
import ImageUploader from '../components/ImageUploader';

// ─── Stars ───────────────────────────────────────────────────────────────────
function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="bg-transparent border-none cursor-pointer p-0"
        >
          <Star size={28} fill={(hovered || value) >= s ? '#C9A96E' : 'none'} stroke={(hovered || value) >= s ? '#C9A96E' : '#D0D0CA'} />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating, size = 14 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ fontSize: size }} className={s <= Math.round(rating) ? 'text-[#C9A96E]' : 'text-[#E8E8E4]'}>
          {s <= Math.round(rating) ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

// ─── Image Gallery ───────────────────────────────────────────────────────────
function Gallery({ images, productName }) {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const scrollRef = React.useRef(null);
  const isScrollingRef = React.useRef(false);

  // Sync dot indicators with scroll position
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (isScrollingRef.current) return;
      const scrollLeft = container.scrollLeft;
      const width = container.offsetWidth;
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== active && newIndex >= 0 && newIndex < images.length) {
        setActive(newIndex);
      }
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [active, images.length]);

  // Scroll to image when thumbnail is clicked (desktop)
  const scrollToIndex = (index) => {
    const container = scrollRef.current;
    if (!container) return;
    isScrollingRef.current = true;
    setDirection(index > active ? 1 : -1);
    setActive(index);
    container.scrollTo({ left: index * container.offsetWidth, behavior: 'smooth' });
    setTimeout(() => { isScrollingRef.current = false; }, 400);
  };

  return (
    <>
      <div>
        {/* ── Mobile: Horizontal scroll-snap slider ── */}
        <div className="pd-gallery-mobile" style={{ display: 'none' }}>
          <div
            ref={scrollRef}
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              borderRadius: 2,
              border: '1px solid #2C2C26',
              background: '#1C1C17',
            }}
            className="hide-scrollbar"
          >
            {images.map((img, i) => (
              <div
                key={i}
                style={{
                  flex: '0 0 100%',
                  scrollSnapAlign: 'start',
                  aspectRatio: '1 / 1',
                  position: 'relative',
                }}
              >
                {img.url ? (
                  <img
                    src={optimizeImage(img.url, 800)}
                    alt={img.alt || `${productName} - Image ${i + 1}`}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: img.bg || '#F8F8F6' }} />
                )}
              </div>
            ))}
          </div>

          {/* Dot indicators */}
          {images.length > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 6,
              marginTop: 12,
            }}>
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToIndex(i)}
                  aria-label={`Go to image ${i + 1}`}
                  style={{
                    width: i === active ? 20 : 7,
                    height: 7,
                    borderRadius: 4,
                    border: 'none',
                    background: i === active ? '#C9A96E' : '#3D3D34',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Desktop: AnimatePresence slider with thumbnails ── */}
        <div className="pd-gallery-desktop">
          <div className="relative aspect-square bg-[#1C1C17] border border-[#2C2C26] rounded-sm overflow-hidden cursor-zoom-in group">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={active}
                custom={direction}
                variants={{
                  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
                  center: { zIndex: 1, x: 0, opacity: 1 },
                  exit: (dir) => ({ zIndex: 0, x: dir < 0 ? '100%' : '-100%', opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                className="absolute inset-0 touch-pan-y"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset }) => {
                  const swipe = offset.x;
                  if (swipe < -40) {
                    setDirection(1);
                    setActive(a => (a + 1) % images.length);
                  } else if (swipe > 40) {
                    setDirection(-1);
                    setActive(a => (a - 1 + images.length) % images.length);
                  } else {
                    setLightboxOpen(true);
                  }
                }}
              >
                {images[active]?.url ? (
                  <img
                    src={images[active].url}
                    alt={images[active].alt || 'Product'}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full" style={{ background: images[active]?.bg || '#F8F8F6' }} />
                )}
              </motion.div>
            </AnimatePresence>
            <div className="absolute bottom-3 right-3 font-dm text-[10px] uppercase tracking-[0.08em] text-[#9E9E9E] bg-white/90 px-2 py-1 rounded-sm">
              Click to zoom
            </div>
          </div>

          <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > active ? 1 : -1);
                  setActive(i);
                }}
                className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-sm overflow-hidden cursor-pointer bg-[#1C1C17] p-0 transition-colors duration-200 border-2 ${i === active ? 'border-[#C9A96E]' : 'border-transparent hover:border-[#3D3D34]'}`}
              >
                {img.url ? (
                  <img src={optimizeImage(img.url, 200)} alt={img.alt || `${productName} Thumbnail ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{ background: img.bg || '#2C2C26' }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#111111]/95 z-[100] flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <div className="relative max-w-[88vw] max-h-[88vh]" onClick={e => e.stopPropagation()}>
              {images[active]?.url ? (
                <img src={optimizeImage(images[active].url, 1200)} alt={`${productName} - Detailed View ${active + 1}`} className="max-h-[88vh] max-w-[88vw] object-contain" />
              ) : (
                <div className="w-[600px] h-[600px] max-w-[90vw] max-h-[90vh] rounded-sm" style={{ background: images[active]?.bg || '#1C1C17' }} />
              )}
            </div>

            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-6 right-6 w-11 h-11 border border-[#333] rounded-sm bg-transparent text-white cursor-pointer flex items-center justify-center transition-colors duration-200 hover:border-white"
            >
              <X size={18} />
            </button>

            <button
              onClick={() => { setDirection(-1); setActive(a => Math.max(0, a - 1)); }}
              disabled={active === 0}
              className={`absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 border border-[#333] rounded-sm bg-transparent text-white flex items-center justify-center transition-colors duration-200 hover:border-white ${active === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() => { setDirection(1); setActive(a => Math.min(images.length - 1, a + 1)); }}
              disabled={active === images.length - 1}
              className={`absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 border border-[#333] rounded-sm bg-transparent text-white flex items-center justify-center transition-colors duration-200 hover:border-white ${active === images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <ChevronRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Product Reviews ─────────────────────────────────────────────────────────
function ProductReviews({ product, reviews, onReviewSubmit }) {
  const { user } = useAuthStore();
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '', phone: '' });
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' });

  const handleSubmitReview = async () => {
    if (reviewForm.rating === 0) { setReviewMsg({ type: 'error', text: 'Please select a rating' }); return; }
    if (!reviewForm.comment.trim()) { setReviewMsg({ type: 'error', text: 'Please enter a comment' }); return; }
    if (!user && !reviewForm.phone.trim()) { setReviewMsg({ type: 'error', text: 'Please enter your phone number' }); return; }
    setIsSubmitting(true);
    setReviewMsg({ type: '', text: '' });
    
    const formData = new FormData();
    formData.append('rating', reviewForm.rating);
    formData.append('comment', reviewForm.comment);
    if (!user) formData.append('phone', reviewForm.phone);
    images.forEach(img => formData.append('images', img));

    try {
      if (user) {
        await addReview(product._id, formData);
      } else {
        await addGuestReview(product._id, formData);
      }
      setReviewMsg({ type: 'success', text: 'Review submitted! It will appear once approved.' });
      setReviewForm({ rating: 0, comment: '', phone: '' });
      setImages([]);
      if (onReviewSubmit) onReviewSubmit();
    } catch (err) {
      setReviewMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit review' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingDist = [5, 4, 3, 2, 1].map(r => ({
    star: r,
    count: reviews.filter(rv => Math.round(rv.rating) === r).length,
  }));
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : (product.ratings?.average || 0).toFixed(1);

  return (
    <div>
      <h3 className="font-cormorant text-[24px] font-medium text-[#F5F0E8] mb-4">Customer Reviews</h3>

      {reviews.length > 0 && (
        <div className="flex gap-6 items-center pb-5 border-b border-[#2C2C26] flex-wrap">
          <div className="text-center">
            <div className="font-cormorant text-[clamp(48px,10vw,64px)] font-medium text-[#F5F0E8] leading-none">
              {avgRating}
            </div>
            <StarDisplay rating={parseFloat(avgRating)} size={16} />
            <p className="font-dm text-[12px] text-[#6B6055] mt-1.5">
              Based on {reviews.length} reviews
            </p>
          </div>
          <div className="flex-1 min-w-[200px] flex flex-col gap-2">
            {ratingDist.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="font-dm text-[12px] text-[#6B6055] w-4 text-right">{star}</span>
                <div className="flex-1 h-1.5 bg-[#1C1C17] border border-[#2C2C26] rounded-full overflow-hidden">
                  <div className="h-full bg-[#C9A96E] transition-all duration-600 ease-out" style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }} />
                </div>
                <span className="font-dm text-[11px] text-[#6B6055] w-4">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        {reviews.length === 0 ? (
          <p className="font-dm text-[14px] text-[#6B6055] py-4">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          reviews.map((r, idx) => (
            <div key={r.id || r._id || idx} className="py-5 border-b border-[#2C2C26]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-sm bg-[#1C1C17] border border-[#2C2C26] font-dm font-medium text-[#F5F0E8] text-[14px] flex items-center justify-center shrink-0">
                  {(r.user?.name || r.name || 'A')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-dm text-[14px] font-medium text-[#F5F0E8] m-0">
                    {r.user?.name || r.name || 'Anonymous'}
                  </p>
                </div>
                <p className="font-dm text-[12px] text-[#6B6055] ml-auto">
                  {r.date || new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-2.5">
                <StarDisplay rating={r.rating} size={13} />
              </div>
              <p className="font-dm text-[13px] text-[#A89880] leading-[1.7] mt-3">
                {r.comment}
              </p>
              {r.images && r.images.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {r.images.map((img, i) => (
                    <img key={img.publicId || i} src={optimizeImage(img.url, 100)} alt="review attachment" className="w-16 h-16 object-cover rounded-sm border border-[#2C2C26]" />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-6 border-t border-[#2C2C26] pt-6">
        <h3 className="font-cormorant text-[28px] font-medium text-[#F5F0E8] mb-4">
          Write a Review
        </h3>

        {!user && (
          <div className="mb-4">
            <label className="font-dm text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6055] block mb-1.5">Your Phone Number</label>
            <input type="tel" value={reviewForm.phone} onChange={e => setReviewForm(f => ({ ...f, phone: e.target.value }))} placeholder="Enter phone number used in your order" className="w-full box-border bg-[#1C1C17] border border-[#2C2C26] rounded-sm px-4 py-3 font-dm text-[14px] text-[#F5F0E8] outline-none transition-colors duration-200 focus:border-[#C9A96E]" />
            <p className="font-dm text-[11px] text-[#6B6055] mt-1.5">We'll fetch your name from your order automatically</p>
          </div>
        )}

        <div className="mb-4">
          <label className="font-dm text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6055] block mb-2">Your Rating</label>
          <StarInput value={reviewForm.rating} onChange={r => setReviewForm(f => ({ ...f, rating: r }))} />
        </div>

        <div className="mb-4">
          <label className="font-dm text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6055] block mb-1.5">Your Review</label>
          <textarea value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} placeholder="Share your experience with this product..." rows={4} className="w-full box-border bg-[#1C1C17] border border-[#2C2C26] rounded-sm px-4 py-3 font-dm text-[14px] text-[#F5F0E8] outline-none resize-y transition-colors duration-200 focus:border-[#C9A96E]" />
        </div>

        <div className="mb-6">
          <label className="font-dm text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6055] block mb-2">Photos (Optional)</label>
          <ImageUploader images={images} setImages={setImages} maxImages={3} maxSizeMB={3} />
        </div>

        {reviewMsg.text && (
          <p className={`font-dm text-[13px] mb-4 ${reviewMsg.type === 'error' ? 'text-[#C0392B]' : 'text-[#2D6A4F]'}`}>
            {reviewMsg.text}
          </p>
        )}

        <button onClick={handleSubmitReview} disabled={isSubmitting} className={`bg-[#F5F0E8] border-none rounded-sm text-[#0D0D0B] px-7 py-3 font-dm text-[13px] font-medium uppercase tracking-[0.06em] transition-colors duration-200 ${isSubmitting ? 'bg-[#3D3D34] cursor-not-allowed' : 'cursor-pointer hover:bg-[#C9A96E]'}`}>
          {isSubmitting ? 'Submitting…' : 'Submit Review'}
        </button>
      </div>
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0B]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#2C2C26] border-t-[#C9A96E] rounded-full animate-spin" />
          <p className="font-dm text-[13px] text-[#6B6055]">Loading product…</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0B]">
        <div className="flex flex-col items-center gap-4">
          <p className="font-cormorant text-[24px] text-[#C9A96E]">Product Not Found</p>
          <p className="font-dm text-[14px] text-[#6B6055]">The item you are looking for does not exist or has been removed.</p>
          <Link to="/products" className="mt-4 px-6 py-2.5 bg-[#C9A96E] text-[#0D0D0B] no-underline rounded-sm font-dm text-[13px] font-medium transition-colors hover:bg-[#A07840]">
            Browse Products
          </Link>
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
    <div className="bg-[#0D0D0B] min-h-screen pt-24">
      <Helmet>
        <title>{product.metaTitle || product.name} | {settings?.siteName || 'Store'}</title>
        <meta name="description" content={product.metaDescription || product.description?.slice(0, 155) || `Buy ${product.name} at ${settings?.siteName || 'our store'}`} />
        {product.metaKeywords && <meta name="keywords" content={product.metaKeywords} />}
        <link rel="canonical" href={`https://www.crafthid.com${window.location.pathname}`} />
        <meta property="og:title" content={`${product.metaTitle || product.name} | ${settings?.siteName || 'Store'}`} />
        <meta property="og:description" content={product.metaDescription || product.description?.slice(0, 155) || `Buy ${product.name} at ${settings?.siteName || 'our store'}`} />
        <meta property="og:url" content={`https://www.crafthid.com${window.location.pathname}`} />
        <meta property="og:image" content={product.images?.[0]?.url || settings?.logo || ''} />
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content={settings?.siteName || 'CRAFT HID'} />
        <meta property="product:price:amount" content={String(product.comparePrice && product.comparePrice > product.price ? product.price : product.price)} />
        <meta property="product:price:currency" content="PKR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.metaTitle || product.name} | ${settings?.siteName || 'Store'}`} />
        <meta name="twitter:description" content={product.metaDescription || product.description?.slice(0, 155) || `Buy ${product.name} at ${settings?.siteName || 'our store'}`} />
        <meta name="twitter:image" content={product.images?.[0]?.url || settings?.logo || ''} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": product.name,
          "image": product.images?.map(img => img.url) || [],
          "description": product.description,
          "sku": product.SKU || product._id,
          "brand": {
            "@type": "Brand",
            "name": settings?.siteName || "CRAFT HID"
          },
          ...(product.ratings?.count > 0 ? {
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": product.ratings.average,
              "reviewCount": product.ratings.count
            }
          } : {}),
          "offers": {
            "@type": "Offer",
            "url": `https://www.crafthid.com${window.location.pathname}`,
            "priceCurrency": "PKR",
            "price": product.price,
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": {
              "@type": "Organization",
              "name": settings?.siteName || "CRAFT HID"
            }
          }
        })}</script>
      </Helmet>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-5 overflow-hidden whitespace-nowrap text-ellipsis">
          {[{ label: 'Home', to: '/' }, { label: 'Products', to: '/products' }].map((item, i) => (
            <span key={item.to} className="flex items-center gap-2">
              <Link to={item.to} className="font-dm text-[12px] uppercase tracking-[0.06em] text-[#6B6055] no-underline transition-colors hover:text-[#F5F0E8]">
                {item.label}
              </Link>
              <span className="text-[#2C2C26] font-dm">/</span>
            </span>
          ))}
          <span className="font-dm text-[12px] uppercase tracking-[0.06em] text-[#F5F0E8] overflow-hidden text-ellipsis whitespace-nowrap max-w-[50vw]">
            {product.name}
          </span>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* LEFT: Gallery */}
          <Gallery images={product.images} productName={product.name} />

          {/* RIGHT: Product info */}
          <div>
            <p className="font-dm text-[10px] uppercase tracking-[0.1em] text-[#6B6055] mb-3">
              {product.brand}
            </p>

            <h1 className="font-cormorant text-[clamp(24px,5vw,40px)] font-medium text-[#F5F0E8] leading-[1.15] m-0">
              {product.name}
            </h1>

            <div className="flex items-center gap-2.5 mt-3.5">
              <StarDisplay rating={product.ratings.average} size={15} />
              <span className="font-dm text-[12px] text-[#6B6055] cursor-pointer underline underline-offset-2">
                ({product.ratings.count.toLocaleString()} reviews)
              </span>
            </div>

            <div className="border-y border-[#2C2C26] py-3.5 mt-3.5 flex items-center gap-3 flex-wrap">
              <span className={`font-dm text-[28px] font-semibold ${discountPct ? 'text-[#C9A96E]' : 'text-[#F5F0E8]'}`}>
                {formatPrice(product.price)}
              </span>
              {product.comparePrice > product.price && (
                <>
                  <span className="font-dm text-[18px] text-[#6B6055] line-through">
                    {formatPrice(product.comparePrice)}
                  </span>
                  <span className="font-dm text-[12px] font-bold text-[#0D0D0B] bg-[#C9A96E] px-2.5 py-1 rounded-sm">
                    {discountPct}% OFF
                  </span>
                </>
              )}
            </div>

            {product.colors.length > 0 && (
              <div className="mt-4">
                <label className="font-dm text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6055] block mb-2.5">
                  Colour: {product.colors[selectedColor]}
                </label>
                <div className="flex gap-2.5">
                  {product.colors.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedColor(i)}
                      className={`w-11 h-11 rounded-full border-2 border-transparent cursor-pointer transition-transform duration-150 hover:scale-110 ${selectedColor === i ? 'outline outline-2 outline-[#C9A96E] outline-offset-2' : 'outline-none'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.sizes.length > 0 && (
              <div className="mt-3.5">
                <label className="font-dm text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6055] block mb-2.5">
                  Size:
                </label>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`border rounded-sm px-4 min-h-[44px] font-dm text-[13px] cursor-pointer transition-colors duration-150 ${selectedSize === s ? 'border-[#C9A96E] bg-[#C9A96E] text-[#0D0D0B]' : 'border-[#2C2C26] bg-transparent text-[#A89880] hover:border-[#3D3D34] hover:text-[#F5F0E8]'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3.5">
              <label className="font-dm text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6055] block mb-2.5">
                Quantity:
              </label>
              <div className="flex items-center border border-[#2C2C26] rounded-sm w-fit">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-11 h-11 bg-transparent border-none cursor-pointer text-[#A89880] text-[18px] flex items-center justify-center transition-colors hover:text-[#F5F0E8] hover:bg-[#1C1C17]"
                >
                  −
                </button>
                <span className="w-12 text-center font-dm font-medium text-[#F5F0E8] text-[15px] border-x border-[#2C2C26]">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                  className="w-11 h-11 bg-transparent border-none cursor-pointer text-[#A89880] text-[18px] flex items-center justify-center transition-colors hover:text-[#F5F0E8] hover:bg-[#1C1C17]"
                >
                  +
                </button>
              </div>
            </div>

            <p className={`font-dm text-[12px] uppercase tracking-[0.06em] mt-3 ${product.stock > 0 ? 'text-[#2D6A4F]' : 'text-[#C0392B]'}`}>
              {product.stock > 0 ? `● In Stock (${product.stock} left)` : '● Out of Stock'}
            </p>

            <div className="mt-4 flex flex-col gap-2.5">
              <AnimatePresence mode="wait">
                {addedAnim ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full py-4 rounded-sm bg-[#2D6A4F] text-white font-dm text-[13px] font-medium uppercase tracking-[0.06em] flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> Added to Cart!
                  </motion.div>
                ) : (
                  <motion.button
                    key="add"
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className={`w-full py-4 rounded-sm border-none font-dm text-[13px] font-medium uppercase tracking-[0.06em] flex items-center justify-center gap-2 transition-colors duration-200 ${product.stock === 0 ? 'bg-[#3D3D34] text-[#0D0D0B] cursor-not-allowed' : 'bg-[#F5F0E8] text-[#0D0D0B] cursor-pointer hover:bg-[#C9A96E]'}`}
                  >
                    <ShoppingCart size={16} /> Add to Cart
                  </motion.button>
                )}
              </AnimatePresence>

              <motion.button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                whileTap={{ scale: 0.97 }}
                className={`w-full py-4 rounded-sm border-none text-white font-dm text-[13px] font-medium uppercase tracking-[0.06em] flex items-center justify-center gap-2 transition-colors duration-200 ${product.stock === 0 ? 'bg-[#3D3D34] opacity-40 cursor-not-allowed' : 'bg-[#C9A96E] cursor-pointer hover:bg-[#A07840]'}`}
              >
                Buy Now
              </motion.button>

              <div className="flex gap-3 mt-1">
                <button
                  onClick={async () => {
                    const shareUrl = `${window.location.origin}/share/product/${product.slug}`;
                    const shareData = {
                      title: product.name,
                      text: `Check out ${product.name} at ${settings?.siteName || 'CRAFT HID'}!`,
                      url: shareUrl,
                    };
                    try {
                      if (navigator.share) await navigator.share(shareData);
                      else {
                        await navigator.clipboard.writeText(shareUrl);
                        alert('Link copied to clipboard!');
                      }
                    } catch (err) {}
                  }}
                  className="w-11 h-11 shrink-0 rounded-sm border border-[#2C2C26] bg-transparent text-[#A89880] cursor-pointer flex items-center justify-center transition-colors duration-200 hover:border-[#E8E8E4] hover:text-[#6B6B6B]"
                >
                  <Share2 size={15} />
                </button>
              </div>
            </div>

            <div className="border-t border-[#2C2C26] mt-4 pt-4 flex flex-col gap-2">
              {[
                { icon: <Check size={15} />, text: 'Free Delivery All Over Pakistan' },
                { icon: <Truck size={15} />, text: 'Cash on delivery available nationwide' },
                { icon: <Shield size={15} />, text: '100% authentic, sourced from brand' },
                { icon: <RotateCcw size={15} />, text: <>7 days return policy available. <Link to="/return-policy" className="text-[#C9A96E] hover:underline transition-colors hover:text-[#e0c58e]">Read Return Policy</Link></> },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[#C9A96E] shrink-0">{item.icon}</span>
                  <span className="font-dm text-[13px] text-[#A89880]">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#2C2C26] mt-10" />
        <section className="py-7">
          <ProductReviews product={product} reviews={reviews} onReviewSubmit={() => {}} />
        </section>

        <div className="border-t border-[#2C2C26]" />
        <section className="py-7">
          <h3 className="font-cormorant text-[clamp(32px,5vw,40px)] font-medium text-[#F5F0E8] mb-4">
            Description
          </h3>
          <p className="font-dm text-[14px] text-[#A89880] leading-[1.5] max-w-[680px]">
            {product.description}
          </p>
        </section>

        {Object.keys(product.specs || {}).length > 0 && (
          <>
            <div className="border-t border-[#2C2C26]" />
            <section className="py-7">
              <h3 className="font-cormorant text-[clamp(32px,5vw,40px)] font-medium text-[#F5F0E8] mb-4">
                Details & Specifications
              </h3>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[2px] max-w-[700px]">
                {Object.entries(product.specs || {}).map(([k, v], i) => (
                  <div key={k} className={`flex justify-between items-center px-4 py-3 border border-[#2C2C26] ${i % 2 === 0 ? 'bg-[#1C1C17]' : 'bg-[#141410]'}`}>
                    <span className="font-dm text-[13px] text-[#6B6055]">{k}</span>
                    <span className="font-dm text-[13px] font-medium text-[#F5F0E8]">{v}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {relatedProducts.length > 0 && (
          <div className="mt-10 bg-[#141410] -mx-4 sm:-mx-6 px-4 sm:px-6 py-7">
            <div className="flex justify-between items-center mb-5">
              <div>
                <p className="font-dm text-[11px] font-medium uppercase tracking-[0.12em] text-[#C9A96E] mb-2">
                  You May Also Like
                </p>
                <h2 className="font-cormorant text-[32px] font-medium text-[#F5F0E8] m-0">
                  Related Products
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setRelatedPage(p => Math.max(0, p - 1))}
                  disabled={relatedPage === 0}
                  className={`w-11 h-11 border rounded-sm flex items-center justify-center transition-colors duration-150 ${relatedPage === 0 ? 'border-[#2C2C26] bg-[#1C1C17] text-[#A89880] opacity-35 cursor-not-allowed' : 'border-[#2C2C26] bg-[#1C1C17] text-[#A89880] cursor-pointer hover:border-[#C9A96E] hover:text-[#C9A96E]'}`}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setRelatedPage(p => Math.min(relatedSlides - 1, p + 1))}
                  disabled={relatedPage >= relatedSlides - 1}
                  className={`w-11 h-11 border rounded-sm flex items-center justify-center transition-colors duration-150 ${relatedPage >= relatedSlides - 1 ? 'border-[#2C2C26] bg-[#1C1C17] text-[#A89880] opacity-35 cursor-not-allowed' : 'border-[#2C2C26] bg-[#1C1C17] text-[#A89880] cursor-pointer hover:border-[#C9A96E] hover:text-[#C9A96E]'}`}
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
    </div>
  );
}
