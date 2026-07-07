import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import useCartStore from '../store/cartStore';

import { useCurrency } from '../utils/currency';
import { optimizeImage } from '../utils/cloudinary';

function Stars({ rating }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ fontSize: 11, color: s <= Math.round(rating) ? '#C9A96E' : '#3D3D34' }}>
          {s <= Math.round(rating) ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

export default function ProductCard({ product, onBuyNow }) {
  const [clicked, setClicked] = useState(false);
  const { addItem } = useCartStore();
  const navigate = useNavigate();

  const { formatPrice } = useCurrency();


  const discountPct = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Fly-to-cart animation
    const cardImg = e.currentTarget.closest('.group')?.querySelector('.product-card-img');
    const cartIcon = document.querySelector('.navbar-cart-icon');

    if (cardImg && cartIcon) {
      const imgRect = cardImg.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();

      // Create a flying image element
      const flyingImg = document.createElement('img');
      flyingImg.src = cardImg.src;
      flyingImg.style.position = 'fixed';
      flyingImg.style.top = imgRect.top + 'px';
      flyingImg.style.left = imgRect.left + 'px';
      flyingImg.style.width = imgRect.width + 'px';
      flyingImg.style.height = imgRect.height + 'px';
      flyingImg.style.objectFit = 'cover';
      flyingImg.style.borderRadius = '2px';
      flyingImg.style.zIndex = '9999';
      // X-axis transition (linear), transform (scale down), opacity (fade out)
      flyingImg.style.transition = 'left 0.8s linear, transform 0.8s ease, opacity 0.6s ease 0.2s';

      // Create a wrapper for the Y-axis (gravity arc)
      const yContainer = document.createElement('div');
      yContainer.style.position = 'fixed';
      yContainer.style.top = imgRect.top + 'px';
      yContainer.style.left = imgRect.left + 'px';
      yContainer.style.zIndex = '9999';
      // Y-axis transition (ease-in simulates gravity)
      yContainer.style.transition = 'top 0.8s cubic-bezier(0.5, -0.5, 1, 1)';

      // Adjust positions for animation
      flyingImg.style.position = 'static'; // Relative to container
      yContainer.appendChild(flyingImg);
      document.body.appendChild(yContainer);

      // Trigger reflow
      void yContainer.offsetWidth;

      // Animate
      yContainer.style.top = (cartRect.top + cartRect.height / 2 - 20) + 'px';
      flyingImg.style.left = (cartRect.left - imgRect.left + cartRect.width / 2 - 20) + 'px';
      flyingImg.style.transform = 'scale(0.1)';
      flyingImg.style.opacity = '0';

      // Cleanup
      setTimeout(() => {
        if (document.body.contains(yContainer)) {
          document.body.removeChild(yContainer);
        }
      }, 800);
    }

    addItem(product, 1);
    setClicked(true);
    setTimeout(() => setClicked(false), 1500);
  };

  const rawImageUrl = product.images?.[0]?.url || product.images?.[0];
  const imageUrl = optimizeImage(rawImageUrl, 600);
  
  // Second image for hover swap
  const rawImageUrl2 = product.images?.[1]?.url || product.images?.[1];
  const imageUrl2 = rawImageUrl2 ? optimizeImage(rawImageUrl2, 600) : null;

  const category = typeof product.category === 'object' ? product.category?.name : product.category;

  return (
    <Link to={`/products/${product.slug || product._id}`} style={{ textDecoration: 'none' }}>
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="group"
        style={{
          position: 'relative',
          background: '#141410',
          border: '1px solid #2C2C26',
          borderRadius: 2,
          overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.20)',
          transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.35), 0 8px 40px rgba(0,0,0,0.25)';
          e.currentTarget.style.borderColor = '#3D3D34';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.20)';
          e.currentTarget.style.borderColor = '#2C2C26';
        }}
      >
        {/* ── Image area ─────────────────────────────────────────────────── */}
        <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: '#1C1C17' }}>

          {/* Product image */}
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={product.name}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'transform 700ms ease-out, opacity 400ms ease',
                  position: 'relative',
                  zIndex: 1,
                }}
                className={`product-card-img ${imageUrl2 ? 'has-hover' : ''}`}
              />
              {imageUrl2 && (
                <img
                  src={imageUrl2}
                  alt={`${product.name} alternate view`}
                  loading="lazy"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 700ms ease-out, opacity 400ms ease',
                    opacity: 0,
                    zIndex: 2,
                  }}
                  className="product-card-img-hover"
                />
              )}
            </>
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              background: product.bg || 'linear-gradient(135deg,#1C1C17,#2C2C26)',
            }} />
          )}

          {/* Badges */}
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 2 }} className="pc-badges">
            {discountPct && (
              <span className="pc-badge-discount" style={{
                background: '#8C3A2E',
                color: '#F5F0E8',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                letterSpacing: '0.02em',
                borderRadius: 2,
              }}>
                -{discountPct}%
              </span>
            )}
            {!discountPct && product.isNew && (
              <span className="pc-badge-new" style={{
                background: '#222219',
                color: '#A89880',
                border: '1px solid #3D3D34',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                borderRadius: 2,
              }}>
                New
              </span>
            )}
          </div>



          {/* Quick add — slides up on group hover */}
          <div
            className="quick-add-bar"
            onClick={handleAddToCart}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              textTransform: 'uppercase',
              color: '#F5F0E8',
              background: clicked ? '#2C2C26' : '#1C1C17',
              cursor: 'pointer',
              transform: 'translateY(100%)',
              transition: 'transform 0.3s ease-out, background 0.2s ease',
              zIndex: 2,
            }}
          >
            <AnimatePresence mode="wait">
              {clicked ? (
                <motion.span key="added" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  ✓ Added to Cart
                </motion.span>
              ) : (
                <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Quick Add
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Card body ──────────────────────────────────────────────────── */}
        <div className="pc-body">
          {/* Category */}
          {category && (
            <p className="pc-category" style={{
              fontFamily: "'DM Sans', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              color: '#6B6055',
              marginBottom: 4,
            }}>
              {category}
            </p>
          )}

          {/* Product name */}
          <h3 className="pc-name" style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            color: '#F5F0E8',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {product.name}
          </h3>

          {/* Price row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap', marginBottom: 6 }} className="pc-price-row">
            <span className="pc-price" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: discountPct ? '#C9A96E' : '#F5F0E8' }}>
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="pc-compare" style={{ fontFamily: "'DM Sans', sans-serif", color: '#6B6055', textDecoration: 'line-through' }}>
                {formatPrice(product.comparePrice)}
              </span>
            )}
            {discountPct && (
              <span className="pc-discount-text" style={{ fontFamily: "'DM Sans', sans-serif", color: '#C9A96E', fontWeight: 600 }}>
                {discountPct}% off
              </span>
            )}
          </div>

          {/* Star row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Stars rating={product.ratings?.average || product.rating || 0} />
            <span className="pc-review-count" style={{ fontFamily: "'DM Sans', sans-serif", color: '#6B6055' }}>
              ({(product.ratings?.count || product.reviews || 0).toLocaleString()})
            </span>
          </div>

          {/* Buy Now */}
          <button
            className="pc-buy-now"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (product.stock <= 0) return;
              if (onBuyNow) {
                onBuyNow(product);
              } else {
                addItem(product, 1);
                navigate('/checkout');
              }
            }}
            disabled={product.stock <= 0}
            style={{
              width: '100%',
              background: product.stock <= 0 ? '#3D3D34' : '#C9A96E',
              color: '#fff',
              border: 'none',
              borderRadius: 2,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              textTransform: 'uppercase',
              cursor: product.stock <= 0 ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease, opacity 0.2s ease, transform 0.2s ease',
              opacity: product.stock <= 0 ? 0.4 : 1,
            }}
            onMouseEnter={e => { if (product.stock > 0) e.currentTarget.style.background = '#A07840'; }}
            onMouseLeave={e => { if (product.stock > 0) e.currentTarget.style.background = '#C9A96E'; }}
          >
            {product.stock <= 0 ? 'Out of Stock' : 'Buy Now'}
          </button>
        </div>
      </motion.div>

      {/* Scoped hover styles */}
      <style>{`
        .group:hover .product-card-img { transform: scale(1.05); }
        .group:hover .product-card-img.has-hover { opacity: 0; }
        .group:hover .product-card-img-hover { transform: scale(1.05); opacity: 1; }
        .group:hover .quick-add-bar { transform: translateY(0) !important; }

        /* Mobile-first card sizing (2-col layout) */
        .pc-body { padding: 8px 10px; }
        .pc-category { font-size: 9px; }
        .pc-name { font-size: 11px; margin-bottom: 6px; }
        .pc-price { font-size: 13px; }
        .pc-compare { font-size: 10px; }
        .pc-discount-text { font-size: 9px; }
        .pc-review-count { font-size: 10px; }
        .pc-badge-discount { font-size: 9px; padding: 2px 6px; }
        .pc-badge-new { font-size: 8px; padding: 2px 6px; }
        .pc-badges { top: 6px !important; left: 6px !important; }
        .quick-add-bar { padding: 8px 0; min-height: 36px; font-size: 9px; letter-spacing: 0.06em; }
        .pc-buy-now { margin-top: 6px; padding: 7px 0; min-height: 32px; font-size: 9px; letter-spacing: 0.06em; }

        /* sm+ (640px) — restore desktop sizes */
        @media (min-width: 640px) {
          .pc-body { padding: 14px 16px; }
          .pc-category { font-size: 10px; }
          .pc-name { font-size: 14px; margin-bottom: 10px; }
          .pc-price { font-size: 16px; }
          .pc-compare { font-size: 13px; }
          .pc-discount-text { font-size: 11px; }
          .pc-review-count { font-size: 11px; }
          .pc-badge-discount { font-size: 11px; padding: 4px 10px; }
          .pc-badge-new { font-size: 10px; padding: 3px 8px; }
          .pc-badges { top: 12px !important; left: 12px !important; }
          .quick-add-bar { padding: 14px 0; min-height: 44px; font-size: 11px; letter-spacing: 0.10em; }
          .pc-buy-now { margin-top: 8px; padding: 9px 0; min-height: 36px; font-size: 10px; letter-spacing: 0.08em; }
        }
      `}</style>
    </Link>
  );
}
