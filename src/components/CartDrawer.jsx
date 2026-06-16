import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Shield, Truck, Banknote } from 'lucide-react';
import useCartStore from '../store/cartStore';
import { validateCoupon } from '../services/api';
import { useCurrency } from '../utils/currency';

// ─── Cart Item ────────────────────────────────────────────────────────────────
function CartItem({ item }) {
  const { updateQty, removeItem } = useCartStore();
  const { formatPrice } = useCurrency();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      style={{
        borderBottom: '1px solid #E8E8E4',
        padding: '20px 24px',
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
      }}
    >
      {/* Image */}
      <div style={{
        width: 80, height: 80, flexShrink: 0,
        border: '1px solid #E8E8E4', borderRadius: 2,
        overflow: 'hidden', background: '#F8F8F6',
      }}>
        {item.images?.[0]?.url ? (
          <img src={item.images[0].url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : item.bg?.startsWith('url') ? (
          <div style={{ width: '100%', height: '100%', background: item.bg, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: item.bg || '#E8E8E4' }} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          color: '#111111', lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.name}
        </p>
        {item.variant && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>
            {item.variant.color && `Color: ${item.variant.color}`}
            {item.variant.color && item.variant.size && ' · '}
            {item.variant.size && `Size: ${item.variant.size}`}
          </p>
        )}
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#111111', marginTop: 8 }}>
          {formatPrice(item.price * item.qty)}
        </p>
      </div>

      {/* Controls */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #E8E8E4', borderRadius: 2, padding: '6px 12px' }}>
          <button
            onClick={() => updateQty(item.key, item.qty - 1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 18, lineHeight: 1, color: '#9E9E9E', padding: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#111111'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9E9E9E'; }}
          >
            −
          </button>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: '#111111', width: 16, textAlign: 'center' }}>
            {item.qty}
          </span>
          <button
            onClick={() => updateQty(item.key, item.qty + 1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 18, lineHeight: 1, color: '#9E9E9E', padding: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#111111'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9E9E9E'; }}
          >
            +
          </button>
        </div>

        {/* Remove */}
        <button
          onClick={() => removeItem(item.key)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9E9E9E', padding: 0, transition: 'color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#9B2226'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#9E9E9E'; }}
        >
          Remove
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main CartDrawer ──────────────────────────────────────────────────────────
export default function CartDrawer() {
  const { items, isOpen, closeCart, appliedCoupon, applyCoupon, removeCoupon } = useCartStore();
  const { formatPrice, symbol } = useCurrency();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState({ type: '', text: '' });
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = appliedCoupon?.discountAmount || 0;
  const shippingCost = (subtotal - discount) >= 50 ? 0 : 8.99;
  const total = subtotal - discount + shippingCost;
  const count = items.reduce((s, i) => s + i.qty, 0);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMsg({ type: '', text: '' });
    try {
      const res = await validateCoupon({ code: couponCode.trim(), subtotal });
      applyCoupon({ code: couponCode.trim(), discountAmount: res.discountAmount });
      setCouponMsg({ type: 'success', text: `✓ Coupon applied — ${symbol}${res.discountAmount} off` });
      setCouponCode('');
    } catch (err) {
      setCouponMsg({ type: 'error', text: err.response?.data?.message || 'Invalid or expired code' });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(17,17,17,0.4)',
              backdropFilter: 'blur(2px)',
              zIndex: 40,
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="cart-drawer"
            style={{
              position: 'fixed', right: 0, top: 0,
              height: '100%', width: '100%', maxWidth: 420,
              background: '#FFFFFF', zIndex: 50,
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
          >
            {/* ── Header ── */}
            <div style={{
              height: 72, borderBottom: '1px solid #E8E8E4',
              padding: '0 24px', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, color: '#111111', margin: 0 }}>
                  Cart
                </h2>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9E9E9E' }}>
                  ({count} {count === 1 ? 'item' : 'items'})
                </span>
              </div>
              <button
                onClick={closeCart}
                style={{
                  width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid #E8E8E4', borderRadius: 2,
                  background: 'transparent', color: '#6B6B6B', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#111111'; e.currentTarget.style.color = '#111111'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E4'; e.currentTarget.style.color = '#6B6B6B'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Items / Empty ── */}
            {items.length === 0 ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '0 24px',
              }}>
                <ShoppingBag size={64} style={{ color: '#E8E8E4' }} strokeWidth={1} />
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 500, color: '#111111', marginTop: 24, marginBottom: 0 }}>
                  Your cart is empty
                </h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9E9E9E', marginTop: 8, textAlign: 'center' }}>
                  Looks like you haven't added anything yet
                </p>
                <button
                  onClick={() => { closeCart(); navigate('/products'); }}
                  style={{
                    marginTop: 32,
                    background: '#111111', border: '1px solid #111111',
                    borderRadius: 2, color: '#FFFFFF',
                    padding: '12px 32px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    cursor: 'pointer', transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#333333'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#111111'; }}
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                {/* Items list */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <AnimatePresence>
                    {items.map(item => (
                      <CartItem key={item.key} item={item} />
                    ))}
                  </AnimatePresence>
                </div>

                {/* ── Coupon ── */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid #E8E8E4', flexShrink: 0 }}>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6B6B', display: 'block' }}>
                    Promo Code
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <input
                      value={appliedCoupon ? appliedCoupon.code : couponCode}
                      onChange={e => { if (!appliedCoupon) setCouponCode(e.target.value); }}
                      disabled={!!appliedCoupon}
                      placeholder="Enter code"
                      onKeyDown={e => { if (e.key === 'Enter') handleApplyCoupon(); }}
                      style={{
                        flex: 1,
                        background: '#F8F8F6',
                        border: 'none', borderBottom: '1px solid #E8E8E4',
                        borderRadius: 0,
                        padding: '10px 0',
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                        color: '#111111', outline: 'none',
                        transition: 'border-color 0.2s',
                        opacity: appliedCoupon ? 0.6 : 1,
                      }}
                      onFocus={e => { if (!appliedCoupon) e.target.style.borderBottomColor = '#111111'; }}
                      onBlur={e => { e.target.style.borderBottomColor = '#E8E8E4'; }}
                    />
                    {appliedCoupon ? (
                      <button
                        onClick={() => { removeCoupon(); setCouponMsg({ type: '', text: '' }); }}
                        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9B2226', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '0 4px', transition: 'color 0.15s' }}
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#111111', fontWeight: 500, background: 'none', border: 'none', cursor: couponLoading ? 'not-allowed' : 'pointer', flexShrink: 0, padding: '0 4px', transition: 'color 0.15s' }}
                        onMouseEnter={e => { if (!couponLoading) e.currentTarget.style.color = '#C9A96E'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#111111'; }}
                      >
                        {couponLoading ? '…' : 'Apply'}
                      </button>
                    )}
                  </div>
                  {couponMsg.text && (
                    <p style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      color: couponMsg.type === 'success' ? '#2D6A4F' : '#9B2226',
                      marginTop: 8,
                    }}>
                      {couponMsg.text}
                    </p>
                  )}
                </div>

                {/* ── Summary ── */}
                <div style={{ padding: '24px', borderTop: '1px solid #E8E8E4', background: '#F8F8F6', flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9E9E9E' }}>Subtotal</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: '#111111' }}>{formatPrice(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9E9E9E' }}>
                          Discount ({appliedCoupon.code})
                        </span>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: '#2D6A4F' }}>−{formatPrice(discount)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9E9E9E' }}>Shipping</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: shippingCost === 0 ? '#2D6A4F' : '#111111' }}>
                        {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid #E8E8E4', margin: '16px 0' }} />

                  {/* Total */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#111111', fontWeight: 500 }}>Total</span>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, color: '#111111' }}>{formatPrice(total)}</span>
                  </div>

                  {/* Checkout button */}
                  <button
                    onClick={handleCheckout}
                    style={{
                      marginTop: 20, width: '100%', padding: '16px 0',
                      borderRadius: 2, background: '#111111', border: 'none',
                      color: '#FFFFFF', fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13, fontWeight: 500,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      cursor: 'pointer', transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#333333'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#111111'; }}
                  >
                    Checkout →
                  </button>

                  {/* Trust row */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
                    {[
                      { icon: <Shield size={12} />, label: 'Secure' },
                      { icon: <Truck size={12} />, label: 'Fast Delivery' },
                      { icon: <Banknote size={12} />, label: 'Cash on Delivery' },
                    ].map(({ icon, label }) => (
                      <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9E9E9E' }}>
                        {icon} {label}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
