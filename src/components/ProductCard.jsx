import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import useCartStore from '../store/cartStore';

import { useCurrency } from '../utils/currency';

function Stars({ rating }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ fontSize: 11, color: s <= Math.round(rating) ? '#C9A96E' : '#E8E8E4' }}>
          {s <= Math.round(rating) ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

export default function ProductCard({ product }) {
  const [clicked, setClicked] = useState(false);
  const { addItem } = useCartStore();

  const { formatPrice } = useCurrency();


  const discountPct = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setClicked(true);
    setTimeout(() => setClicked(false), 1500);
  };



  const imageUrl = product.images?.[0]?.url || product.images?.[0];
  const category = typeof product.category === 'object' ? product.category?.name : product.category;

  return (
    <Link to={`/products/${product.slug || product._id}`} style={{ textDecoration: 'none' }}>
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="group"
        style={{
          position: 'relative',
          background: '#FFFFFF',
          border: '1px solid #E8E8E4',
          borderRadius: 2,
          overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.06)';
          e.currentTarget.style.borderColor = '#D0D0CA';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)';
          e.currentTarget.style.borderColor = '#E8E8E4';
        }}
      >
        {/* ── Image area ─────────────────────────────────────────────────── */}
        <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: '#F8F8F6' }}>

          {/* Product image */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transition: 'transform 700ms ease-out',
              }}
              className="product-card-img"
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              background: product.bg || 'linear-gradient(135deg,#F8F8F6,#E8E8E4)',
            }} />
          )}

          {/* Badges */}
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 2 }} className="pc-badges">
            {discountPct && (
              <span className="pc-badge-discount" style={{
                background: '#E53935',
                color: '#FFFFFF',
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
                background: '#FFFFFF',
                color: '#111111',
                border: '1px solid #E8E8E4',
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
              color: '#FFFFFF',
              background: clicked ? '#333333' : '#111111',
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
              color: '#9E9E9E',
              marginBottom: 4,
            }}>
              {category}
            </p>
          )}

          {/* Product name */}
          <h3 className="pc-name" style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            color: '#111111',
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
            <span className="pc-price" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: discountPct ? '#E53935' : '#111111' }}>
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="pc-compare" style={{ fontFamily: "'DM Sans', sans-serif", color: '#9E9E9E', textDecoration: 'line-through' }}>
                {formatPrice(product.comparePrice)}
              </span>
            )}
            {discountPct && (
              <span className="pc-discount-text" style={{ fontFamily: "'DM Sans', sans-serif", color: '#2D6A4F', fontWeight: 600 }}>
                {discountPct}% off
              </span>
            )}
          </div>

          {/* Star row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Stars rating={product.ratings?.average || product.rating || 0} />
            <span className="pc-review-count" style={{ fontFamily: "'DM Sans', sans-serif", color: '#9E9E9E' }}>
              ({(product.ratings?.count || product.reviews || 0).toLocaleString()})
            </span>
          </div>
        </div>
      </motion.div>

      {/* Scoped hover styles */}
      <style>{`
        .group:hover .product-card-img { transform: scale(1.05); }
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
        }
      `}</style>
    </Link>
  );
}
