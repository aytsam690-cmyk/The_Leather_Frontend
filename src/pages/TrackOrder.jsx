import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Phone, Package, Truck, CheckCircle, Clock, XCircle, MapPin, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { trackOrdersByPhone } from '../services/api';
import { useCurrency } from '../utils/currency';
import useSettingsStore from '../store/settingsStore';

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    icon: Clock,       color: '#C9A96E' },
  processing: { label: 'Processing', icon: Package,     color: '#2563eb' },
  shipped:    { label: 'Shipped',    icon: Truck,       color: '#7c3aed' },
  delivered:  { label: 'Delivered',  icon: CheckCircle, color: '#16a34a' },
  cancelled:  { label: 'Cancelled',  icon: XCircle,     color: '#9B2226' },
};

function OrderCard({ order, formatPrice, isExpanded, onToggle }) {
  const currentStepIndex = STATUS_STEPS.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: '#141410', border: '1px solid #2C2C26', borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}
    >
      {/* Order Header - Always visible */}
      <div
        onClick={onToggle}
        style={{
          padding: '20px 24px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: isExpanded ? '1px solid #2C2C26' : 'none',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#1C1C17'}
        onMouseLeave={e => e.currentTarget.style.background = '#141410'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6055', margin: 0 }}>Order</p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 500, color: '#F5F0E8', margin: '2px 0 0' }}>{order.orderNumber}</p>
          </div>
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6055', margin: 0 }}>Date</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#A89880', margin: '2px 0 0' }}>
              {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6055', margin: 0 }}>Total</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#F5F0E8', margin: '2px 0 0' }}>{formatPrice(order.total)}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            display: 'inline-block',
            padding: '5px 14px',
            borderRadius: 2,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: STATUS_CONFIG[order.orderStatus]?.color || '#111111',
            background: (STATUS_CONFIG[order.orderStatus]?.color || '#111111') + '14',
          }}>
            {STATUS_CONFIG[order.orderStatus]?.label || order.orderStatus}
          </span>
          {isExpanded ? <ChevronUp size={18} style={{ color: '#6B6055' }} /> : <ChevronDown size={18} style={{ color: '#6B6055' }} />}
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '24px' }}>

              {/* Progress Bar */}
              {!isCancelled && (
                <div style={{ marginBottom: 28 }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6055', marginBottom: 20 }}>Progress</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 14, left: 28, right: 28, height: 2, background: '#2C2C26', zIndex: 0 }} />
                    <div style={{ position: 'absolute', top: 14, left: 28, height: 2, background: '#C9A96E', zIndex: 1, width: `${Math.max(0, currentStepIndex) / (STATUS_STEPS.length - 1) * (100 - 10)}%`, transition: 'width 0.5s ease' }} />
                    {STATUS_STEPS.map((step, i) => {
                      const config = STATUS_CONFIG[step];
                      const Icon = config.icon;
                      const isCompleted = i <= currentStepIndex;
                      return (
                        <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 2 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isCompleted ? '#F5F0E8' : '#1C1C17', border: isCompleted ? '2px solid #F5F0E8' : '2px solid #2C2C26', transition: 'all 0.3s ease',
                          }}>
                            <Icon size={12} style={{ color: isCompleted ? '#0D0D0B' : '#6B6055' }} />
                          </div>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: isCompleted ? 600 : 400, color: isCompleted ? '#F5F0E8' : '#6B6055', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {config.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tracking Info */}
              {order.trackingId && (
                <div style={{ background: '#1C1C17', border: '1px solid #2C2C26', borderRadius: 2, padding: 16, marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6055', margin: 0 }}>Tracking ID</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#F5F0E8', margin: '4px 0 0' }}>{order.trackingId}</p>
                  </div>
                  {order.courierName && (
                    <div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6055', margin: 0 }}>Courier</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#F5F0E8', margin: '4px 0 0' }}>{order.courierName}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Info Row */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CreditCard size={13} style={{ color: '#6B6055' }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#A89880' }}>{order.paymentMethod}</span>
                </div>
                {order.shippingAddress?.city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={13} style={{ color: '#6B6055' }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#A89880' }}>{order.shippingAddress.city}, {order.shippingAddress.country}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6055', marginBottom: 12 }}>Items</p>
                {order.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', paddingBottom: 12, marginBottom: i < order.items.length - 1 ? 12 : 0, borderBottom: i < order.items.length - 1 ? '1px solid #2C2C26' : 'none' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 2, border: '1px solid #2C2C26' }} />
                    ) : (
                      <div style={{ width: 48, height: 48, background: '#1C1C17', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={18} style={{ color: '#6B6055' }} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: '#F5F0E8', margin: 0 }}>{item.name}</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#6B6055', margin: '2px 0 0' }}>
                        Qty: {item.quantity}{item.size ? ` · ${item.size}` : ''}{item.color ? ` · ${item.color}` : ''}
                      </p>
                    </div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#F5F0E8', margin: 0 }}>{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ borderTop: '1px solid #2C2C26', paddingTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#A89880' }}>Subtotal</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#F5F0E8' }}>{formatPrice(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#2D6A4F' }}>Discount</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#2D6A4F' }}>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#A89880' }}>Shipping</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: order.shippingCost === 0 ? '#2D6A4F' : '#F5F0E8' }}>
                    {order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #2C2C26' }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 500, color: '#F5F0E8' }}>Total</span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 500, color: '#F5F0E8' }}>{formatPrice(order.total)}</span>
                </div>
              </div>

              {/* Status History */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6055', marginBottom: 12 }}>Status History</p>
                  {[...order.statusHistory].reverse().map((entry, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 12, position: 'relative' }}>
                      {i < order.statusHistory.length - 1 && (
                        <div style={{ position: 'absolute', left: 5, top: 12, bottom: 0, width: 2, background: '#2C2C26' }} />
                      )}
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? '#C9A96E' : '#2C2C26', flexShrink: 0, marginTop: 3, zIndex: 1 }} />
                      <div>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: '#F5F0E8', margin: 0, textTransform: 'capitalize' }}>{entry.status}</p>
                        {entry.note && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#6B6055', margin: '2px 0 0' }}>{entry.note}</p>}
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#3D3D34', margin: '2px 0 0' }}>
                          {new Date(entry.timestamp || entry.date || entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function TrackOrder() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const { formatPrice } = useCurrency();
  const { settings } = useSettingsStore();

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError('');
    setOrders([]);
    setExpandedOrder(null);
    try {
      const data = await trackOrdersByPhone(phone.trim());
      setOrders(data);
      if (data.length === 1) setExpandedOrder(data[0].orderNumber);
    } catch (err) {
      setError(err.response?.data?.message || 'No orders found for this phone number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#0D0D0B', minHeight: '100vh', paddingTop: 96, paddingBottom: 64 }}>
      <Helmet>
        <title>Track Order — {settings?.siteName || 'Store'}</title>
        <meta name="description" content="Track your orders by entering your phone number." />
        <link rel="canonical" href={`https://www.crafthid.com${window.location.pathname}`} />
        <meta property="og:title" content={`Track Order — ${settings?.siteName || 'Store'}`} />
        <meta property="og:description" content="Track your orders by entering your phone number." />
        <meta property="og:url" content={window.location.origin + '/track-order'} />
        <meta property="og:image" content={settings?.logo || ''} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`Track Order — ${settings?.siteName || 'Store'}`} />
        <meta name="twitter:description" content="Track your orders by entering your phone number." />
      </Helmet>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C9A96E', marginBottom: 8 }}>
            Order Tracking
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 500, color: '#F5F0E8', margin: 0, lineHeight: 1.2 }}>
            Track Your Orders
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6B6055', marginTop: 8 }}>
            Enter your mobile number to view all your orders
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleTrack} style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Phone size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6B6055' }} />
            <input
              type="tel"
              placeholder="Enter your mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 14px 14px 44px',
                border: '1px solid #2C2C26',
                borderRadius: 2,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: '#F5F0E8',
                background: '#1C1C17',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px 28px',
              background: '#F5F0E8',
              color: '#0D0D0B',
              border: 'none',
              borderRadius: 2,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              flexShrink: 0,
            }}
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                background: '#1C1C17',
                border: '1px solid #C0392B',
                borderRadius: 2,
                padding: '14px 20px',
                marginBottom: 24,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: '#9B2226',
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {orders.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#A89880', margin: 0 }}>
                  <strong style={{ color: '#F5F0E8' }}>{orders.length}</strong> order{orders.length > 1 ? 's' : ''} found for <strong style={{ color: '#F5F0E8' }}>{orders[0].shippingAddress?.fullName}</strong>
                </p>
              </div>

              {/* Order Cards */}
              {orders.map(order => (
                <OrderCard
                  key={order.orderNumber}
                  order={order}
                  formatPrice={formatPrice}
                  isExpanded={expandedOrder === order.orderNumber}
                  onToggle={() => setExpandedOrder(expandedOrder === order.orderNumber ? null : order.orderNumber)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
