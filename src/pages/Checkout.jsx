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
import { optimizeImage } from '../utils/cloudinary';

// ─── Confetti (CSS-based) ────────────────────────────────────
// Rendered globally so it doesn't cause reflows on every confetti piece
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
      <style>{`
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
      `}</style>
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
      <label className="block mb-1.5 font-dm text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6055]">
        {label}{required && ' *'}
      </label>
      <Tag
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className={`w-full box-border bg-[#1C1C17] rounded-sm px-4 py-3 font-dm text-[14px] text-[#F5F0E8] outline-none transition-all duration-200 focus:border-[#C9A96E] focus:shadow-[0_0_0_3px_rgba(201,169,110,0.12)] ${error ? 'border border-[#C0392B]' : 'border border-[#2C2C26]'} ${Tag === 'textarea' ? 'resize-none h-24' : ''}`}
        placeholder={label}
      />
      {error && <p className="font-dm text-[11px] text-[#C0392B] mt-1">{error}</p>}
    </div>
  );
}

function DSSelect({ label, name, value, onChange, error, required, options = [] }) {
  return (
    <div>
      <label className="block mb-1.5 font-dm text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6055]">
        {label}{required && ' *'}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full box-border bg-[#1C1C17] rounded-sm px-4 py-3 font-dm text-[14px] outline-none cursor-pointer appearance-none transition-colors duration-200 focus:border-[#C9A96E] ${value ? 'text-[#F5F0E8]' : 'text-[#6B6055]'} ${error ? 'border border-[#C0392B]' : 'border border-[#2C2C26]'}`}
      >
        <option value="">Select {label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <p className="font-dm text-[11px] text-[#C0392B] mt-1">{error}</p>}
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = ['Shipping', 'Review', 'Confirm'];
  return (
    <div className="flex items-center max-w-[320px] mx-auto mb-12">
      {steps.map((label, i) => {
        const idx = i + 1;
        const isComplete = idx < step;
        const isActive = idx === step;
        return (
          <div key={label} className={`flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex flex-col items-center relative">
              <div className={`w-8 h-8 rounded-sm flex items-center justify-center font-dm text-[12px] font-medium transition-all duration-300 ${isComplete ? 'border border-[#C9A96E] bg-[#C9A96E] text-[#0D0D0B]' : isActive ? 'border border-[#C9A96E] bg-transparent text-[#F5F0E8]' : 'border border-[#2C2C26] bg-transparent text-[#6B6055]'}`}>
                {isComplete ? <Check size={14} /> : idx}
              </div>
              <span className={`absolute top-9 font-dm text-[10px] uppercase tracking-[0.08em] whitespace-nowrap ${isActive ? 'text-[#F5F0E8]' : 'text-[#6B6055]'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-[1px] mx-2 transition-colors duration-400 ease-out ${isComplete ? 'bg-[#C9A96E]' : 'bg-[#2C2C26]'}`} />
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
    <div className="bg-[#141410] border border-[#2C2C26] rounded-sm p-6 sticky top-24">
      <h3 className="font-cormorant text-[20px] font-medium text-[#F5F0E8] m-0 mb-5">
        Order Summary
      </h3>

      {/* Items */}
      <div className="border-t border-[#2C2C26]">
        {items.map(item => (
          <div key={item.key} className="flex items-center gap-3 py-3.5 border-b border-[#2C2C26]">
            <div className="w-14 h-14 shrink-0 border border-[#2C2C26] rounded-sm overflow-hidden bg-[#1C1C17]">
              {item.images?.[0]?.url ? (
                <img src={optimizeImage(item.images[0].url, 150)} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: item.bg || '#1C1C17' }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-dm text-[12px] text-[#F5F0E8] m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {item.name}
              </p>
              <p className="font-dm text-[11px] text-[#6B6055] m-0 mt-0.5">
                Qty: {item.qty}{item.variant?.size && ` · ${item.variant.size}`}
              </p>
            </div>
            <p className="font-dm text-[13px] font-medium text-[#F5F0E8] shrink-0 ml-auto m-0">
              {formatPrice(item.price * item.qty)}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-[#2C2C26] my-4" />

      {/* Summary rows */}
      <div className="flex flex-col gap-2">
        {[
          { label: 'Subtotal', value: formatPrice(subtotal), color: 'text-[#F5F0E8]' },
          ...(discount > 0 ? [{ label: `Discount (${appliedCoupon.code})`, value: `−${formatPrice(discount)}`, color: 'text-[#C9A96E]' }] : []),
          { label: 'Shipping', value: 'Free', color: 'text-[#C9A96E]' },
        ].map(row => (
          <div key={row.label} className="flex justify-between">
            <span className="font-dm text-[12px] text-[#6B6055] uppercase tracking-[0.04em]">{row.label}</span>
            <span className={`font-dm text-[12px] font-medium ${row.color}`}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center border-t border-[#2C2C26] mt-4 pt-4">
        <span className="font-cormorant text-[22px] font-medium text-[#A89880]">Total</span>
        <span className="font-cormorant text-[22px] font-medium text-[#F5F0E8]">{formatPrice(total)}</span>
      </div>

      {/* COD badge */}
      <div className="mt-5 bg-[#1C1C17] border border-[#2C2C26] rounded-sm p-4 flex items-center gap-3">
        <ShieldCheck size={20} className="text-[#C9A96E] shrink-0" />
        <div>
          <p className="font-dm text-[13px] font-medium text-[#F5F0E8] m-0">Cash on Delivery</p>
          <p className="font-dm text-[11px] text-[#6B6055] m-0 mt-0.5">Pay when delivered</p>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Shipping Form ────────────────────────────────────────────────────
function ShippingForm({ data, setData, onNext }) {
  const [errors, setErrors] = useState({});
  const [saveAddress, setSaveAddress] = useState(false);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const { user } = useAuthStore();
  const [savedAddresses, setSavedAddresses] = useState([]);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('user-addresses')) || [];
      setSavedAddresses(raw);
    } catch { setSavedAddresses([]); }
  }, []);

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
    setData(d => ({ ...d, address1: '', address2: '', city: '', state: '', zip: '', country: '' }));
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
    <div className="bg-[#141410] border border-[#2C2C26] rounded-sm p-8 mb-4">
      <h2 className="font-cormorant text-[24px] font-medium text-[#F5F0E8] m-0 mb-6">
        Shipping Information
      </h2>

      {savedAddresses.length > 0 && (
        <div className="mb-6">
          <p className="font-dm text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6055] mb-3">
            Saved Addresses
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
            {savedAddresses.map(addr => (
              <div
                key={addr.id}
                onClick={() => handleSelectAddress(addr)}
                className={`rounded-sm p-3.5 cursor-pointer transition-all duration-200 ${selectedAddr === addr.id ? 'bg-[#1C1C17] border border-[#C9A96E]' : 'bg-transparent border border-[#2C2C26]'}`}
              >
                <p className={`font-dm text-[12px] font-medium m-0 ${selectedAddr === addr.id ? 'text-[#C9A96E]' : 'text-[#F5F0E8]'}`}>
                  {addr.label || 'Address'} {addr.isDefault && '· Default'}
                </p>
                <p className="font-dm text-[11px] text-[#6B6055] m-0 mt-1 leading-[1.5]">
                  {addr.street}, {addr.city}
                </p>
              </div>
            ))}
            <div
              onClick={handleNewAddress}
              className={`rounded-sm p-3.5 cursor-pointer flex items-center justify-center transition-all duration-200 ${selectedAddr === 'new' ? 'bg-[#1C1C17] border border-[#C9A96E]' : 'bg-transparent border border-dashed border-[#3D3D34]'}`}
            >
              <p className={`font-dm text-[12px] font-medium m-0 ${selectedAddr === 'new' ? 'text-[#C9A96E]' : 'text-[#6B6055]'}`}>
                + New Address
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <DSInput label="Full Name" name="fullName" value={data.fullName || ''} onChange={handleChange} error={errors.fullName} required />
          <DSInput label="Email (Optional)" name="email" type="email" value={data.email || ''} onChange={handleChange} error={errors.email} />
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <DSInput label="Phone" name="phone" value={data.phone || ''} onChange={handleChange} error={errors.phone} required />
          <DSInput label="Address Line 1" name="address1" value={data.address1 || ''} onChange={handleChange} error={errors.address1} required />
        </div>

        <DSInput label="Address Line 2 (optional)" name="address2" value={data.address2 || ''} onChange={handleChange} />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <DSInput label="City" name="city" value={data.city || ''} onChange={handleChange} error={errors.city} required />
          <DSSelect label="Province" name="state" value={data.state || ''} onChange={handleChange} error={errors.state} required options={PROVINCES} />
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <DSInput label="ZIP / Postal Code" name="zip" value={data.zip || ''} onChange={handleChange} error={errors.zip} required />
          <DSInput label="Country" name="country" value={data.country || ''} onChange={handleChange} error={errors.country} required />
        </div>

        <DSInput label="Order Notes (optional)" name="notes" value={data.notes || ''} onChange={handleChange} as="textarea" rows={4} />

        <label className="flex items-center gap-2.5 cursor-pointer">
          <div
            onClick={() => setSaveAddress(v => !v)}
            className={`w-4 h-4 shrink-0 rounded-sm flex items-center justify-center transition-all duration-150 cursor-pointer ${saveAddress ? 'bg-[#C9A96E] border border-[#C9A96E]' : 'bg-transparent border border-[#2C2C26]'}`}
          >
            {saveAddress && <span className="text-[#0D0D0B] text-[10px] leading-none">✓</span>}
          </div>
          <span className="font-dm text-[13px] text-[#A89880]">
            Save this address for future orders
          </span>
        </label>
      </div>

      <button
        onClick={handleNext}
        className="mt-6 w-full py-4 bg-[#F5F0E8] border-none rounded-sm text-[#0D0D0B] font-dm text-[13px] font-medium uppercase tracking-[0.04em] cursor-pointer flex items-center justify-center gap-2 transition-colors duration-200 hover:bg-[#C9A96E]"
      >
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ─── Step 2: Review ───────────────────────────────────────────────────────────
function ReviewOrder({ shipping, onBack, onNext }) {
  const { items, appliedCoupon } = useCartStore();
  const { formatPrice } = useCurrency();

  return (
    <div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-4">
        <div className="bg-[#1C1C17] border border-[#2C2C26] rounded-sm p-5">
          <MapPin size={18} className="text-[#C9A96E] mb-3" />
          <label className="block mb-1.5 font-dm text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6055]">
            Shipping To
          </label>
          <p className="font-dm text-[14px] text-[#F5F0E8] leading-[1.6] m-0">
            {shipping.fullName}<br />
            {shipping.address1}{shipping.address2 ? `, ${shipping.address2}` : ''}<br />
            {shipping.city}, {shipping.state} {shipping.zip}<br />
            {shipping.country}
          </p>
          <button
            onClick={onBack}
            className="font-dm text-[11px] uppercase tracking-[0.06em] text-[#C9A96E] bg-transparent border-none cursor-pointer mt-3 p-0 block transition-colors duration-150 hover:text-[#A07840]"
          >
            Edit
          </button>
        </div>

        <div className="bg-[#1C1C17] border border-[#2C2C26] rounded-sm p-5">
          <ShieldCheck size={18} className="text-[#C9A96E] mb-3" />
          <label className="block mb-1.5 font-dm text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6055]">
            Payment Method
          </label>
          <p className="font-dm text-[14px] text-[#F5F0E8] leading-[1.6] m-0">
            Cash on Delivery<br />
            <span className="text-[12px] text-[#6B6055]">Pay when your order arrives</span>
          </p>
        </div>
      </div>

      <div className="bg-[#141410] border border-[#2C2C26] rounded-sm p-6 mb-4">
        <h3 className="font-cormorant text-[20px] font-medium text-[#F5F0E8] m-0 mb-4">
          Items
        </h3>
        <div className="border-t border-[#2C2C26]">
          {items.map(item => (
            <div key={item.key} className="flex gap-4 py-4 border-b border-[#2C2C26] items-center">
              <div className="w-16 h-16 shrink-0 border border-[#2C2C26] rounded-sm overflow-hidden bg-[#1C1C17]">
                {item.images?.[0]?.url ? (
                  <img src={optimizeImage(item.images[0].url, 150)} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{ background: item.bg || '#1C1C17' }} />
                )}
              </div>
              <div className="flex-1">
                <p className="font-dm text-[13px] text-[#F5F0E8] m-0">{item.name}</p>
                {item.variant && (
                  <p className="font-dm text-[11px] text-[#6B6055] m-0 mt-0.5">
                    {item.variant.size && `Size: ${item.variant.size}`}
                    {item.variant.color && ` · Color: ${item.variant.color}`}
                  </p>
                )}
                <p className="font-dm text-[12px] text-[#6B6055] m-0 mt-1">
                  Qty: {item.qty}
                </p>
              </div>
              <p className="font-dm text-[14px] font-medium text-[#F5F0E8] shrink-0 ml-auto">
                {formatPrice(item.price * item.qty)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3.5 rounded-sm border border-[#2C2C26] bg-transparent font-dm text-[13px] font-medium text-[#A89880] cursor-pointer transition-all duration-200 hover:bg-[#1C1C17] hover:text-[#F5F0E8]"
        >
          <ArrowLeft size={15} /> Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-sm bg-[#C9A96E] border-none font-dm text-[13px] font-medium text-[#0D0D0B] cursor-pointer uppercase tracking-[0.04em] transition-colors duration-200 hover:bg-[#A07840]"
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
    <div className="bg-[#141410] border border-[#2C2C26] rounded-sm p-8">
      <h2 className="font-cormorant text-[24px] font-medium text-[#F5F0E8] m-0 mb-6">
        Payment &amp; Confirmation
      </h2>

      <div className="bg-[#1C1C17] border border-[#2C2C26] rounded-sm p-6 mb-5 flex flex-col items-center text-center">
        <ShieldCheck size={40} className="text-[#C9A96E] mb-3" />
        <p className="font-cormorant text-[24px] font-medium text-[#F5F0E8] m-0 mb-2">
          Cash on Delivery
        </p>
        <p className="font-dm text-[13px] text-[#A89880] leading-[1.6] m-0 mb-4 max-w-[300px]">
          Safe &amp; trusted. Pay with cash when your order arrives at your doorstep.
        </p>
        <div className="flex gap-3 flex-wrap">
          {['🔒 Secure', '✓ Verified', '🏠 Pay at Door'].map(t => (
            <span key={t} className="font-dm text-[11px] uppercase tracking-[0.06em] text-[#A89880] px-3 py-1 border border-[#2C2C26] rounded-sm">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-[#1C1C17] border border-[#2C2C26] rounded-sm px-5 py-4 mb-5 flex justify-between items-center">
        <span className="font-dm text-[12px] uppercase tracking-[0.08em] text-[#6B6055]">
          Order Total
        </span>
        <span className="font-cormorant text-[24px] font-medium text-[#F5F0E8]">
          {formatPrice(total)}
        </span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3.5 rounded-sm border border-[#2C2C26] bg-transparent font-dm text-[13px] font-medium text-[#A89880] cursor-pointer transition-all duration-200 hover:bg-[#1C1C17] hover:text-[#F5F0E8] hover:border-[#3D3D34]"
        >
          <ArrowLeft size={15} /> Back
        </button>
        <button
          onClick={onPlace}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-sm border-none font-dm text-[13px] font-medium text-[#0D0D0B] uppercase tracking-[0.04em] transition-colors duration-200 ${loading ? 'bg-[#3D3D34] cursor-not-allowed' : 'bg-[#C9A96E] hover:bg-[#A07840] cursor-pointer'}`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Placing Order…
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
      className="min-h-screen bg-[#0D0D0B] flex items-center justify-center py-12 px-6 relative"
    >
      <Confetti />

      <div className="flex flex-col items-center text-center max-w-[480px] w-full relative z-10">
        <div className="w-20 h-20 rounded-sm bg-[#1C1C17] border border-[#2C2C26] flex items-center justify-center">
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

        <h1 className="font-cormorant text-[44px] font-medium text-[#F5F0E8] mt-8 mb-0">
          Order Confirmed
        </h1>
        <p className="font-dm text-[16px] text-[#A89880] font-light mt-2 mb-0">
          Thank you{shipping?.fullName ? `, ${shipping.fullName.split(' ')[0]}` : ''}!
        </p>

        <div className="mt-6">
          <p className="font-dm text-[13px] uppercase tracking-[0.1em] text-[#6B6055] m-0 mb-2">
            Order Number
          </p>
          <div className="inline-block font-cormorant text-[28px] font-medium text-[#F5F0E8] bg-[#141410] border border-[#2C2C26] rounded-sm px-8 py-3">
            {orderNumber}
          </div>
          <p className="font-dm text-[12px] text-[#6B6055] m-0 mt-3">
            Save this to track your order
          </p>
        </div>

        <div className="flex gap-4 mt-10 justify-center flex-wrap">
          <button
            onClick={() => navigate(`/track-order?orderNumber=${orderNumber}`)}
            className="px-7 py-3 rounded-sm bg-[#F5F0E8] border-none text-[#0D0D0B] font-dm text-[13px] font-medium uppercase tracking-[0.04em] cursor-pointer transition-colors duration-200 hover:bg-[#C9A96E]"
          >
            Track My Order →
          </button>
          <Link
            to="/products"
            className="px-7 py-3 rounded-sm bg-transparent border border-[#3D3D34] text-[#A89880] font-dm text-[13px] font-medium uppercase tracking-[0.04em] cursor-pointer no-underline transition-all duration-200 inline-block hover:bg-[#F5F0E8] hover:text-[#0D0D0B] hover:border-[#F5F0E8]"
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

  if (items.length === 0 && !orderNumber) {
    return (
      <div className="min-h-screen bg-[#0D0D0B] flex items-center justify-center flex-col gap-4">
        <Package size={48} className="text-[#2C2C26]" strokeWidth={1} />
        <p className="font-dm text-[14px] text-[#6B6055]">Your cart is empty.</p>
        <Link to="/products" className="px-7 py-3 rounded-sm bg-[#F5F0E8] border-none text-[#0D0D0B] font-dm text-[13px] font-medium uppercase tracking-[0.04em] no-underline">
          Browse Products
        </Link>
      </div>
    );
  }

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

  if (orderNumber) return <SuccessState orderNumber={orderNumber} shipping={shipping} />;

  return (
    <>
      <Helmet>
        <title>{`Checkout | ${siteName}`}</title>
        <meta name="description" content={`Complete your order securely at ${siteName}.`} />
        <link rel="canonical" href={"https://www.crafthid.com/checkout"} />
      </Helmet>
      <div className="min-h-screen bg-[#0D0D0B] pt-24 pb-16">
        <div className="max-w-[1024px] mx-auto px-6">
          <StepIndicator step={step} />
          
          <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-8 items-start">
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
            
            <OrderSidebar items={items} appliedCoupon={appliedCoupon} />
          </div>
        </div>
      </div>
    </>
  );
}
