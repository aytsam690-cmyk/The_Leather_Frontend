import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import useSettingsStore from '../store/settingsStore';
import { createOrder } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, MapPin, ArrowRight, ArrowLeft, Check, Package } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { useCurrency } from '../utils/currency';

// ─── Confetti (CSS-based, unchanged logic) ────────────────────────────────────
const confettiCSS = `
@keyframes confetti-fall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
}
.confetti-piece {
  position: fixed;
  animation: confetti-fall linear forwards;
  pointer-events: none;
  z-index: 9999;
  border-radius: 2px;
}
`;

const CONFETTI_COLORS = ['#111111', '#C9A96E', '#E8D5B0', '#333333', '#D0D0CA', '#A07840'];

function Confetti() {
  const pieces = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: `${Math.random() * 3}s`,
    duration: `${2 + Math.random() * 3}s`,
    size: `${6 + Math.random() * 10}px`,
  }));
  return (
    <>
      <style>{confettiCSS}</style>
      {pieces.map((p) => (
        <div key={p.id} className="confetti-piece"
          style={{ left: p.left, top: '-20px', background: p.color, width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.duration }} />
      ))}
    </>
  );
}

// ─── Design-system input with label ──────────────────────────────────────────
function DSInput({ label, name, value, onChange, error, type = 'text', required, as: Tag = 'input', rows }) {
  return (
    <div>
      <label style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500,
        textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6055',
        display: 'block', marginBottom: 6,
      }}>
        {label}{required && ' *'}
      </label>
      <Tag
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: '#1C1C17', border: error ? '1px solid #C0392B' : '1px solid #2C2C26',
          borderRadius: 2, padding: '12px 16px',
          fontFamily: "'DM Sans', sans-serif", fontSize: 14,
          color: '#F5F0E8', outline: 'none',
          transition: 'all 0.2s ease',
          resize: Tag === 'textarea' ? 'none' : undefined,
          height: Tag === 'textarea' ? 96 : undefined,
        }}
        onFocus={e => { e.target.style.borderColor = '#C9A96E'; e.target.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.12)'; }}
        onBlur={e => { e.target.style.borderColor = error ? '#C0392B' : '#2C2C26'; e.target.style.boxShadow = 'none'; }}
        placeholder={label}
      />
      {error && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#C0392B', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function DSSelect({ label, name, value, onChange, error, required, options = [] }) {
  return (
    <div>
      <label style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500,
        textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6055',
        display: 'block', marginBottom: 6,
      }}>
        {label}{required && ' *'}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: '#1C1C17', border: error ? '1px solid #C0392B' : '1px solid #2C2C26',
          borderRadius: 2, padding: '12px 16px',
          fontFamily: "'DM Sans', sans-serif", fontSize: 14,
          color: value ? '#F5F0E8' : '#6B6055',
          outline: 'none', cursor: 'pointer',
          appearance: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => { e.target.style.borderColor = '#C9A96E'; }}
        onBlur={e => { e.target.style.borderColor = error ? '#C0392B' : '#2C2C26'; }}
      >
        <option value="">Select {label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#C0392B', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = ['Shipping', 'Review', 'Confirm'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', maxWidth: 320, margin: '0 auto 48px' }}>
      {steps.map((label, i) => {
        const idx = i + 1;
        const isComplete = idx < step;
        const isActive = idx === step;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? undefined : undefined }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500,
                border: isComplete ? '1px solid #C9A96E' : isActive ? '1px solid #C9A96E' : '1px solid #2C2C26',
                background: isComplete ? '#C9A96E' : isActive ? 'transparent' : 'transparent',
                color: isComplete ? '#0D0D0B' : isActive ? '#F5F0E8' : '#6B6055',
                transition: 'all 0.3s ease',
              }}>
                {isComplete ? <Check size={14} /> : idx}
              </div>
              <span style={{
                position: 'absolute', top: 36,
                fontFamily: "'DM Sans', sans-serif", fontSize: 10,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: isActive ? '#F5F0E8' : '#6B6055',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 1, margin: '0 8px', marginBottom: 0,
                background: isComplete ? '#C9A96E' : '#2C2C26',
                width: 60, transition: 'background 0.4s ease',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Order Summary Sidebar ────────────────────────────────────────────────────
function OrderSidebar({ items, appliedCoupon }) {
  const { formatPrice } = useCurrency();
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = (() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') {
      let d = (subtotal * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscount && d > appliedCoupon.maxDiscount) d = appliedCoupon.maxDiscount;
      return Math.min(d, subtotal);
    }
    return Math.min(appliedCoupon.value || 0, subtotal);
  })();
  const total = subtotal - discount;

  return (
    <div style={{
      background: '#141410', border: '1px solid #2C2C26',
      borderRadius: 2, padding: 24,
      position: 'sticky', top: 96,
    }}>
      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 500, color: '#F5F0E8', margin: '0 0 20px' }}>
        Order Summary
      </h3>

      {/* Items */}
      <div style={{ borderTop: '1px solid #2C2C26' }}>
        {items.map(item => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid #2C2C26' }}>
            <div style={{ width: 56, height: 56, flexShrink: 0, border: '1px solid #2C2C26', borderRadius: 2, overflow: 'hidden', background: '#1C1C17' }}>
              {item.images?.[0]?.url ? (
                <img src={item.images[0].url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: item.bg || '#1C1C17' }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#F5F0E8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#6B6055', margin: '2px 0 0' }}>
                Qty: {item.qty}{item.variant?.size && ` · ${item.variant.size}`}
              </p>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: '#F5F0E8', flexShrink: 0, marginLeft: 'auto' }}>
              {formatPrice(item.price * item.qty)}
            </p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #2C2C26', margin: '16px 0' }} />

      {/* Summary rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: 'Subtotal', value: formatPrice(subtotal), color: '#F5F0E8' },
          ...(discount > 0 ? [{ label: `Discount (${appliedCoupon.code})`, value: `−${formatPrice(discount)}`, color: '#C9A96E' }] : []),
          { label: 'Shipping', value: 'Free', color: '#C9A96E' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6B6055', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{row.label}</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: row.color }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #2C2C26', marginTop: 16, paddingTop: 16 }}>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, color: '#A89880' }}>Total</span>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, color: '#F5F0E8' }}>{formatPrice(total)}</span>
      </div>

      {/* COD badge */}
      <div style={{
        marginTop: 20, background: '#1C1C17', border: '1px solid #2C2C26',
        borderRadius: 2, padding: 16, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <ShieldCheck size={20} style={{ color: '#C9A96E', flexShrink: 0 }} />
        <div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: '#F5F0E8', margin: 0 }}>Cash on Delivery</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#6B6055', margin: '2px 0 0' }}>Pay when delivered</p>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Shipping Form ────────────────────────────────────────────────────
function ShippingForm({ data, setData, onNext }) {
  const [errors, setErrors] = useState({});
  const [saveAddress, setSaveAddress] = useState(false);
  const [selectedAddr, setSelectedAddr] = useState(null); // null = none, 'new' = manual, addr.id = saved
  const { user } = useAuthStore();

  // Load saved addresses from localStorage
  const [savedAddresses, setSavedAddresses] = useState([]);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('user-addresses')) || [];
      setSavedAddresses(raw);
    } catch { setSavedAddresses([]); }
  }, []);

  // Auto-fill logged-in user's name/email on mount if fields are empty
  useEffect(() => {
    if (user && !data.fullName && !data.email) {
      setData(d => ({ ...d, fullName: user.name || '', email: user.email || '' }));
    }
  }, [user]);

  const handleSelectAddress = (addr) => {
    setSelectedAddr(addr.id);
    setData(d => ({
      ...d,
      fullName: addr.name || d.fullName,
      address1: addr.street || '',
      address2: '',
      city: addr.city || '',
      state: addr.state || '',
      zip: addr.zip || '',
      country: addr.country || '',
    }));
    setErrors({});
  };

  const handleNewAddress = () => {
    setSelectedAddr('new');
    setData(d => ({
      ...d,
      address1: '', address2: '', city: '', state: '', zip: '', country: '',
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(d => ({ ...d, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (selectedAddr && selectedAddr !== 'new') setSelectedAddr(null);
  };

  const validate = () => {
    const required = ['fullName', 'phone', 'address1', 'city', 'state', 'zip', 'country'];
    const newErrors = {};
    required.forEach(k => { if (!data[k]?.trim()) newErrors[k] = 'This field is required'; });
    if (data.email && !/\S+@\S+\.\S+/.test(data.email)) newErrors.email = 'Enter a valid email';
    return newErrors;
  };

  const handleNext = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    // Save address to localStorage if checked
    if (saveAddress && data.address1) {
      try {
        const existing = JSON.parse(localStorage.getItem('user-addresses')) || [];
        const newAddr = {
          id: Date.now().toString(),
          label: 'Shipping',
          name: data.fullName,
          street: data.address1 + (data.address2 ? `, ${data.address2}` : ''),
          city: data.city,
          state: data.state,
          zip: data.zip,
          country: data.country,
          isDefault: existing.length === 0,
        };
        localStorage.setItem('user-addresses', JSON.stringify([...existing, newAddr]));
      } catch {}
    }
    onNext();
  };

  const PROVINCES = ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK', 'ICT'];

  return (
    <div style={{ background: '#141410', border: '1px solid #2C2C26', borderRadius: 2, padding: 32, marginBottom: 16 }}>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 500, color: '#F5F0E8', margin: '0 0 24px' }}>
        Shipping Information
      </h2>

      {/* Saved Addresses Selector */}
      {savedAddresses.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6055', marginBottom: 12 }}>
            Saved Addresses
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {savedAddresses.map(addr => (
              <div
                key={addr.id}
                onClick={() => handleSelectAddress(addr)}
                style={{
                  background: selectedAddr === addr.id ? '#1C1C17' : 'transparent',
                  border: selectedAddr === addr.id ? '1px solid #C9A96E' : '1px solid #2C2C26',
                  borderRadius: 2, padding: '14px 16px', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: selectedAddr === addr.id ? '#C9A96E' : '#F5F0E8', margin: 0 }}>
                  {addr.label || 'Address'} {addr.isDefault && '· Default'}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#6B6055', margin: '4px 0 0', lineHeight: 1.5 }}>
                  {addr.street}, {addr.city}
                </p>
              </div>
            ))}
            <div
              onClick={handleNewAddress}
              style={{
                background: selectedAddr === 'new' ? '#1C1C17' : 'transparent',
                border: selectedAddr === 'new' ? '1px solid #C9A96E' : '1px dashed #3D3D34',
                borderRadius: 2, padding: '14px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: selectedAddr === 'new' ? '#C9A96E' : '#6B6055', margin: 0 }}>
                + New Address
              </p>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Row 1: Name + Email */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <DSInput label="Full Name" name="fullName" value={data.fullName || ''} onChange={handleChange} error={errors.fullName} required />
          <DSInput label="Email (Optional)" name="email" type="email" value={data.email || ''} onChange={handleChange} error={errors.email} />
        </div>

        {/* Row 2: Phone + Address */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <DSInput label="Phone" name="phone" value={data.phone || ''} onChange={handleChange} error={errors.phone} required />
          <DSInput label="Address Line 1" name="address1" value={data.address1 || ''} onChange={handleChange} error={errors.address1} required />
        </div>

        {/* Row 3: Address 2 */}
        <DSInput label="Address Line 2 (optional)" name="address2" value={data.address2 || ''} onChange={handleChange} />

        {/* Row 4: City + Province */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <DSInput label="City" name="city" value={data.city || ''} onChange={handleChange} error={errors.city} required />
          <DSSelect label="Province" name="state" value={data.state || ''} onChange={handleChange} error={errors.state} required options={PROVINCES} />
        </div>

        {/* Row 5: ZIP + Country */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <DSInput label="ZIP / Postal Code" name="zip" value={data.zip || ''} onChange={handleChange} error={errors.zip} required />
          <DSInput label="Country" name="country" value={data.country || ''} onChange={handleChange} error={errors.country} required />
        </div>

        {/* Order notes */}
        <DSInput label="Order Notes (optional)" name="notes" value={data.notes || ''} onChange={handleChange} as="textarea" rows={4} />

        {/* Save address checkbox */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div
            onClick={() => setSaveAddress(v => !v)}
            style={{
              width: 16, height: 16, flexShrink: 0, borderRadius: 2,
              border: saveAddress ? '1px solid #C9A96E' : '1px solid #2C2C26',
              background: saveAddress ? '#C9A96E' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s ease', cursor: 'pointer',
            }}
          >
            {saveAddress && <span style={{ color: '#0D0D0B', fontSize: 10, lineHeight: 1 }}>✓</span>}
          </div>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#A89880' }}>
            Save this address for future orders
          </span>
        </label>
      </div>

      <button
        onClick={handleNext}
        style={{
          marginTop: 24, width: '100%', padding: '16px 0',
          background: '#F5F0E8', border: 'none', borderRadius: 2,
          color: '#0D0D0B', fontFamily: "'DM Sans', sans-serif",
          fontSize: 13, fontWeight: 500, textTransform: 'uppercase',
          letterSpacing: '0.04em', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#C9A96E'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#F5F0E8'; }}
      >
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ─── Step 2: Review ───────────────────────────────────────────────────────────
function ReviewOrder({ shipping, onBack, onNext }) {
  const { items, updateQty, appliedCoupon } = useCartStore();
  const { formatPrice } = useCurrency();
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = (() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') {
      let d = (subtotal * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscount && d > appliedCoupon.maxDiscount) d = appliedCoupon.maxDiscount;
      return Math.min(d, subtotal);
    }
    return Math.min(appliedCoupon.value || 0, subtotal);
  })();
  const total = subtotal - discount;

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Shipping card */}
        <div style={{ background: '#1C1C17', border: '1px solid #2C2C26', borderRadius: 2, padding: 20 }}>
          <MapPin size={18} style={{ color: '#C9A96E', marginBottom: 12 }} />
          <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6055', display: 'block', marginBottom: 6 }}>
            Shipping To
          </label>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#F5F0E8', lineHeight: 1.6, margin: 0 }}>
            {shipping.fullName}<br />
            {shipping.address1}{shipping.address2 ? `, ${shipping.address2}` : ''}<br />
            {shipping.city}, {shipping.state} {shipping.zip}<br />
            {shipping.country}
          </p>
          <button
            onClick={onBack}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#C9A96E', background: 'none', border: 'none', cursor: 'pointer', marginTop: 12, padding: 0, display: 'block', transition: 'color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#A07840'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#C9A96E'; }}
          >
            Edit
          </button>
        </div>

        {/* Payment card */}
        <div style={{ background: '#1C1C17', border: '1px solid #2C2C26', borderRadius: 2, padding: 20 }}>
          <ShieldCheck size={18} style={{ color: '#C9A96E', marginBottom: 12 }} />
          <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6055', display: 'block', marginBottom: 6 }}>
            Payment Method
          </label>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#F5F0E8', lineHeight: 1.6, margin: 0 }}>
            Cash on Delivery<br />
            <span style={{ fontSize: 12, color: '#6B6055' }}>Pay when your order arrives</span>
          </p>
        </div>
      </div>

      {/* Items */}
      <div style={{ background: '#141410', border: '1px solid #2C2C26', borderRadius: 2, padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 500, color: '#F5F0E8', margin: '0 0 16px' }}>
          Items
        </h3>
        <div style={{ borderTop: '1px solid #2C2C26' }}>
          {items.map(item => (
            <div key={item.key} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid #2C2C26', alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, flexShrink: 0, border: '1px solid #2C2C26', borderRadius: 2, overflow: 'hidden', background: '#1C1C17' }}>
                {item.images?.[0]?.url ? (
                  <img src={item.images[0].url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: item.bg || '#1C1C17' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#F5F0E8', margin: 0 }}>{item.name}</p>
                {item.variant && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#6B6055', margin: '2px 0 0' }}>
                    {item.variant.size && `Size: ${item.variant.size}`}
                    {item.variant.color && ` · Color: ${item.variant.color}`}
                  </p>
                )}
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6B6055', margin: '4px 0 0' }}>
                  Qty: {item.qty}
                </p>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#F5F0E8', flexShrink: 0, marginLeft: 'auto' }}>
                {formatPrice(item.price * item.qty)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 24px', borderRadius: 2,
            border: '1px solid #2C2C26', background: 'transparent',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
            color: '#A89880', cursor: 'pointer', transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1C1C17'; e.currentTarget.style.color = '#F5F0E8'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A89880'; }}
        >
          <ArrowLeft size={15} /> Back
        </button>
        <button
          onClick={onNext}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px 0', borderRadius: 2,
            background: '#C9A96E', border: 'none',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
            color: '#0D0D0B', cursor: 'pointer', transition: 'background 0.2s ease',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#A07840'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#C9A96E'; }}
        >
          Proceed to Confirm <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Confirm ──────────────────────────────────────────────────────────
function ConfirmOrder({ onBack, onPlace, loading }) {
  const { items, appliedCoupon } = useCartStore();
  const { formatPrice } = useCurrency();
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = (() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') {
      let d = (subtotal * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscount && d > appliedCoupon.maxDiscount) d = appliedCoupon.maxDiscount;
      return Math.min(d, subtotal);
    }
    return Math.min(appliedCoupon.value || 0, subtotal);
  })();
  const total = subtotal - discount;

  return (
    <div style={{ background: '#141410', border: '1px solid #2C2C26', borderRadius: 2, padding: 32 }}>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 500, color: '#F5F0E8', margin: '0 0 24px' }}>
        Payment &amp; Confirmation
      </h2>

      {/* COD card */}
      <div style={{
        background: '#1C1C17', border: '1px solid #2C2C26',
        borderRadius: 2, padding: 24, marginBottom: 20,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
      }}>
        <ShieldCheck size={40} style={{ color: '#C9A96E', marginBottom: 12 }} />
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 500, color: '#F5F0E8', margin: '0 0 8px' }}>
          Cash on Delivery
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#A89880', lineHeight: 1.6, margin: '0 0 16px', maxWidth: 300 }}>
          Safe &amp; trusted. Pay with cash when your order arrives at your doorstep.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {['🔒 Secure', '✓ Verified', '🏠 Pay at Door'].map(t => (
            <span key={t} style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: '#A89880', padding: '4px 12px',
              border: '1px solid #2C2C26', borderRadius: 2,
            }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Total */}
      <div style={{
        background: '#1C1C17', border: '1px solid #2C2C26', borderRadius: 2,
        padding: '16px 20px', marginBottom: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6055' }}>
          Order Total
        </span>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 500, color: '#F5F0E8' }}>
          {formatPrice(total)}
        </span>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 24px', borderRadius: 2,
            border: '1px solid #2C2C26', background: 'transparent',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
            color: '#A89880', cursor: 'pointer', transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1C1C17'; e.currentTarget.style.color = '#F5F0E8'; e.currentTarget.style.borderColor = '#3D3D34'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A89880'; e.currentTarget.style.borderColor = '#2C2C26'; }}
        >
          <ArrowLeft size={15} /> Back
        </button>
        <button
          onClick={onPlace}
          disabled={loading}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px 0', borderRadius: 2,
            background: loading ? '#3D3D34' : '#C9A96E', border: 'none',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
            color: '#0D0D0B', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s ease',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#A07840'; }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#C9A96E'; }}
        >
          {loading ? (
            <>
              <div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Placing Order…
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </>
          ) : (
            <><Check size={15} /> Place Order</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Success State ────────────────────────────────────────────────────────────
function SuccessState({ orderNumber, shipping }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{ minHeight: '100vh', background: '#0D0D0B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', position: 'relative' }}
    >
      <Confetti />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 480, width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Animated checkmark */}
        <div style={{
          width: 80, height: 80, borderRadius: 2,
          background: '#1C1C17', border: '1px solid #2C2C26',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <motion.path
              d="M6 16 L13 23 L26 9"
              stroke="#C9A96E"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 500, color: '#F5F0E8', margin: '32px 0 0' }}>
          Order Confirmed
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#A89880', fontWeight: 300, margin: '8px 0 0' }}>
          Thank you{shipping?.fullName ? `, ${shipping.fullName.split(' ')[0]}` : ''}!
        </p>

        {/* Order number */}
        <div style={{ marginTop: 24 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6055', margin: '0 0 8px' }}>
            Order Number
          </p>
          <div style={{
            display: 'inline-block',
            fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 500, color: '#F5F0E8',
            background: '#141410', border: '1px solid #2C2C26', borderRadius: 2,
            padding: '12px 32px',
          }}>
            {orderNumber}
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6B6055', margin: '12px 0 0' }}>
            Save this to track your order
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 16, marginTop: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(`/track-order?orderNumber=${orderNumber}`)}
            style={{
              padding: '12px 28px', borderRadius: 2,
              background: '#F5F0E8', border: 'none', color: '#0D0D0B',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              cursor: 'pointer', transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#C9A96E'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F5F0E8'; }}
          >
            Track My Order →
          </button>
          <Link
            to="/products"
            style={{
              padding: '12px 28px', borderRadius: 2,
              background: 'transparent', border: '1px solid #3D3D34', color: '#A89880',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              cursor: 'pointer', textDecoration: 'none',
              transition: 'all 0.2s ease',
              display: 'inline-block',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F5F0E8'; e.currentTarget.style.color = '#0D0D0B'; e.currentTarget.style.borderColor = '#F5F0E8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A89880'; e.currentTarget.style.borderColor = '#3D3D34'; }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const INITIAL_SHIPPING = { fullName: '', email: '', phone: '', address1: '', address2: '', city: '', state: '', zip: '', country: '', notes: '' };

export default function Checkout() {
  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState(INITIAL_SHIPPING);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const { items, clearCart, appliedCoupon } = useCartStore();
  const navigate = useNavigate();
  const settings = useSettingsStore(s => s.settings);
  const siteName = settings?.siteName || 'Store';

  // ── Empty cart redirect ──
  if (items.length === 0 && !orderNumber) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D0D0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Package size={48} style={{ color: '#2C2C26' }} strokeWidth={1} />
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6B6055' }}>Your cart is empty.</p>
        <Link to="/products" style={{
          padding: '12px 28px', borderRadius: 2,
          background: '#F5F0E8', border: 'none', color: '#0D0D0B',
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: '0.04em',
          textDecoration: 'none',
        }}>
          Browse Products
        </Link>
      </div>
    );
  }

  // ── handlePlace logic unchanged ──
  const handlePlace = async () => {
    setLoading(true);
    try {
      const subtotal = items.reduce((sum, i) => sum + i.price * (i.qty || i.quantity || 1), 0);
      const discount = (() => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.type === 'percentage') {
          let d = (subtotal * appliedCoupon.value) / 100;
          if (appliedCoupon.maxDiscount && d > appliedCoupon.maxDiscount) d = appliedCoupon.maxDiscount;
          return Math.min(d, subtotal);
        }
        return Math.min(appliedCoupon.value || 0, subtotal);
      })();
      const orderData = {
        items: items.map(i => ({ product: i._id || i.id, quantity: i.qty || i.quantity || 1, price: i.price })),
        shippingAddress: shipping,
        paymentMethod: 'Cash on Delivery',
        subtotal,
        shippingCost: 0,
        discount,
        couponCode: appliedCoupon?.code || undefined,
        total: subtotal - discount,
      };
      const result = await createOrder(orderData);
      setOrderNumber(result.orderNumber || `#ORD-${Date.now()}`);
      clearCart();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──
  if (orderNumber) return <SuccessState orderNumber={orderNumber} shipping={shipping} />;

  return (
    <>
    <Helmet>
      <title>{`Checkout | ${siteName}`}</title>
      <meta name="description" content={`Complete your order securely at ${siteName}.`} />
      <link rel="canonical" href={window.location.origin + '/checkout'} />
      <meta property="og:title" content={`Checkout | ${siteName}`} />
      <meta property="og:description" content={`Complete your order securely at ${siteName}.`} />
      <meta property="og:url" content={window.location.origin + '/checkout'} />
    </Helmet>
    <div style={{ minHeight: '100vh', background: '#0D0D0B', paddingTop: 96, paddingBottom: 64 }}>
      <div style={{ maxWidth: 1024, margin: '0 auto', padding: '0 24px' }}>
        {/* Step progress */}
        <StepIndicator step={step} />

        {/* Grid: form + sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}
          className="checkout-grid">

          {/* Left: step forms */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                {step === 1 && <ShippingForm data={shipping} setData={setShipping} onNext={() => setStep(2)} />}
                {step === 2 && <ReviewOrder shipping={shipping} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
                {step === 3 && <ConfirmOrder onBack={() => setStep(2)} onPlace={handlePlace} loading={loading} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: sidebar */}
          <OrderSidebar items={items} appliedCoupon={appliedCoupon} />
        </div>
      </div>

      {/* Responsive grid */}
      <style>{`
        @media (max-width: 768px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  </>
  );
}
