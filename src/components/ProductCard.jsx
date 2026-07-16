import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import useCartStore from '../store/cartStore';

import { useCurrency } from '../utils/currency';
import { optimizeImage } from '../utils/cloudinary';

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`text-[11px] ${s <= Math.round(rating) ? 'text-[#C9A96E]' : 'text-[#3D3D34]'}`}>
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
    
    if (product.stock <= 0) return;

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
    <Link to={`/products/${product.slug || product._id}`} className="no-underline block">
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="group relative bg-[#141410] border border-[#2C2C26] rounded-sm overflow-hidden cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.25),0_4px_16px_rgba(0,0,0,0.20)] transition-all duration-250 ease-out hover:shadow-[0_4px_16px_rgba(0,0,0,0.35),0_8px_40px_rgba(0,0,0,0.25)] hover:border-[#3D3D34]"
      >
        {/* ── Image area ─────────────────────────────────────────────────── */}
        <div className="relative aspect-square overflow-hidden bg-[#1C1C17]">

          {/* Product image */}
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={product.name}
                loading="lazy"
                className={`product-card-img absolute inset-0 w-full h-full object-cover block transition-all duration-700 ease-out z-[1] group-hover:scale-105 ${imageUrl2 ? 'group-hover:opacity-0' : ''}`}
              />
              {imageUrl2 && (
                <img
                  src={imageUrl2}
                  alt={`${product.name} alternate view`}
                  loading="lazy"
                  className="product-card-img-hover absolute top-0 left-0 w-full h-full object-cover block transition-all duration-700 ease-out z-[2] opacity-0 group-hover:scale-105 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full" style={{ background: product.bg || 'linear-gradient(135deg,#1C1C17,#2C2C26)' }} />
          )}

          {/* Badges */}
          <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex flex-col gap-1 z-[2]">
            {discountPct && (
              <span className="bg-[#8C3A2E] text-[#F5F0E8] font-dm font-bold tracking-[0.02em] rounded-sm text-[9px] sm:text-[11px] px-1.5 py-0.5 sm:px-2.5 sm:py-1">
                -{discountPct}%
              </span>
            )}
            {!discountPct && product.isNew && (
              <span className="bg-[#222219] text-[#A89880] border border-[#3D3D34] font-dm font-semibold uppercase tracking-[0.06em] rounded-sm text-[8px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 sm:py-[3px]">
                New
              </span>
            )}
          </div>

          {/* Quick add — slides up on group hover */}
          <div
            onClick={handleAddToCart}
            className={`absolute -bottom-full left-0 right-0 group-hover:bottom-0 text-center font-dm font-medium uppercase transition-all duration-300 ease-out z-[2] py-2 sm:py-3.5 min-h-[36px] sm:min-h-[44px] text-[9px] sm:text-[11px] tracking-[0.06em] sm:tracking-[0.10em] border-none outline-none shadow-[0_10px_0_#1C1C17] ${product.stock <= 0 ? 'text-[#A89880] bg-[#3D3D34] cursor-not-allowed' : clicked ? 'text-[#F5F0E8] bg-[#2C2C26] cursor-pointer' : 'text-[#F5F0E8] bg-[#1C1C17] cursor-pointer'}`}
          >
            <AnimatePresence mode="wait">
              {product.stock <= 0 ? (
                <motion.span key="outofstock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Out of Stock
                </motion.span>
              ) : clicked ? (
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
        <div className="p-2 sm:p-[14px_16px]">
          {/* Category */}
          {category && (
            <p className="font-dm uppercase tracking-[0.10em] text-[#6B6055] mb-1 text-[9px] sm:text-[10px]">
              {category}
            </p>
          )}

          {/* Product name */}
          <h3 className="font-dm font-normal text-[#F5F0E8] leading-[1.35] line-clamp-2 overflow-hidden mb-1.5 sm:mb-2.5 text-[11px] sm:text-[14px]">
            {product.name}
          </h3>

          {/* Price row */}
          <div className="flex items-baseline gap-1 flex-wrap mb-1.5 pc-price-row">
            <span className={`font-dm font-semibold text-[13px] sm:text-[16px] ${discountPct ? 'text-[#C9A96E]' : 'text-[#F5F0E8]'}`}>
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="font-dm text-[#6B6055] line-through text-[10px] sm:text-[13px]">
                {formatPrice(product.comparePrice)}
              </span>
            )}
            {discountPct && (
              <span className="font-dm text-[#C9A96E] font-semibold text-[9px] sm:text-[11px]">
                {discountPct}% off
              </span>
            )}
          </div>

          {/* Star row */}
          <div className="flex items-center gap-1">
            <Stars rating={product.ratings?.average || product.rating || 0} />
            <span className="font-dm text-[#6B6055] text-[10px] sm:text-[11px]">
              ({(product.ratings?.count || product.reviews || 0).toLocaleString()})
            </span>
          </div>

          {/* Buy Now */}
          <button
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
            className={`w-full border-none rounded-sm font-dm font-medium uppercase transition-all duration-200 mt-1.5 sm:mt-2 py-[7px] sm:py-[9px] min-h-[32px] sm:min-h-[36px] text-[9px] sm:text-[10px] tracking-[0.06em] sm:tracking-[0.08em] ${product.stock <= 0 ? 'bg-[#3D3D34] text-[#fff] opacity-40 cursor-not-allowed' : 'bg-[#C9A96E] text-[#fff] cursor-pointer hover:bg-[#A07840]'}`}
          >
            {product.stock <= 0 ? 'Out of Stock' : 'Buy Now'}
          </button>
        </div>
      </motion.div>
    </Link>
  );
}
