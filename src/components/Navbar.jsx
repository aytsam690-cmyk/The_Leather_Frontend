import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Search, Menu, X, ChevronDown, User, Package
} from 'lucide-react';
import useCartStore from '../store/cartStore';

import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import { getCategories, searchProducts } from '../services/api';

const FALLBACK_CATEGORIES = [
  { name: 'Electronics', sub: ['Phones', 'Laptops', 'Cameras', 'Audio'] },
  { name: 'Fashion', sub: ['Men', 'Women', 'Kids', 'Accessories'] },
  { name: 'Home & Living', sub: ['Furniture', 'Decor', 'Kitchen', 'Bedding'] },
  { name: 'Sports', sub: ['Fitness', 'Outdoor', 'Team Sports', 'Water Sports'] },
];

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Products', path: '/products' },
  { label: 'Track Order', path: '/track-order' },
  { label: 'About', path: '/about' },
];

/* ─── Inline styles ──────────────────────────────────────────────────────── */
const iconBtnStyle = {
  width: 40,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #E8E8E4',
  borderRadius: 2,
  color: '#6B6B6B',
  background: 'transparent',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  position: 'relative',
  flexShrink: 0,
};

/* ─── UserMenu ───────────────────────────────────────────────────────────── */
function UserMenu({ user, logout }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Avatar button */}
      <button
        style={{
          width: 40,
          height: 40,
          borderRadius: 2,
          border: '1px solid #E8E8E4',
          background: '#F8F8F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          color: '#111111',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600,
          fontSize: 14,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#111111';
          e.currentTarget.style.background = '#111111';
          e.currentTarget.style.color = '#FFFFFF';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#E8E8E4';
          e.currentTarget.style.background = '#F8F8F6';
          e.currentTarget.style.color = '#111111';
        }}
      >
        {user?.name?.[0]?.toUpperCase() || 'U'}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              width: 192,
              paddingTop: 8,
              zIndex: 100,
            }}
          >
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E8E8E4',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.06)',
              }}
            >
              <Link
                to="/account"
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  fontSize: 13,
                  color: '#6B6B6B',
                  textDecoration: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#111111'; e.currentTarget.style.background = '#F8F8F6'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6B6B6B'; e.currentTarget.style.background = 'transparent'; }}
              >
                <User size={14} /> My Profile
              </Link>
              <Link
                to="/orders"
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  fontSize: 13,
                  color: '#6B6B6B',
                  textDecoration: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#111111'; e.currentTarget.style.background = '#F8F8F6'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6B6B6B'; e.currentTarget.style.background = 'transparent'; }}
              >
                <Package size={14} /> My Orders
              </Link>
              <hr style={{ borderColor: '#E8E8E4', margin: 0 }} />
              <button
                onClick={() => { logout(); setOpen(false); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  fontSize: 13,
                  color: '#9E9E9E',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#111111'; e.currentTarget.style.background = '#F8F8F6'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#9E9E9E'; e.currentTarget.style.background = 'transparent'; }}
              >
                <X size={14} /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [megaMenu, setMegaMenu] = useState(false);
  const [categories, setCategories] = useState([]);
  const searchRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { items: cartItems, openCart } = useCartStore();

  const { user, logout, token } = useAuthStore();
  const { settings } = useSettingsStore();

  // Fetch real categories
  useEffect(() => {
    getCategories()
      .then(data => {
        const items = Array.isArray(data) ? data : [];
        if (items.length > 0) {
          setCategories(items.map(c => ({
            name: c.name,
            slug: c.slug,
            sub: c.children?.map(ch => ch.name) || [],
          })));
        } else {
          setCategories(FALLBACK_CATEGORIES);
        }
      })
      .catch(() => {
        setCategories(FALLBACK_CATEGORIES);
      });
  }, []);

  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recentSearches')) || []; } catch { return []; }
  });

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      import('../services/api').then(({ getSearchSuggestions }) => {
        getSearchSuggestions(searchQuery)
          .then(data => setSearchResults(data || { products: [], categories: [] }))
          .catch(() => setSearchResults({ products: [], categories: [] }));
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const saveRecentSearch = (query) => {
    if (!query.trim()) return;
    const newRecent = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
  };

  const itemCount = cartItems.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: '#FFFFFF',
          borderBottom: '1px solid #E8E8E4',
          transition: 'box-shadow 0.3s ease',
          boxShadow: scrolled ? '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' : 'none',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>

            {/* Logo */}
            <Link to="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
              {settings?.logo && (
                <img src={settings.logo} alt={settings.siteName || 'Store Logo'} style={{ maxHeight: '32px', maxWidth: '140px', width: 'auto', height: 'auto', objectFit: 'contain' }} />
              )}
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 28,
                fontWeight: 600,
                color: '#111111',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}>
                {settings?.siteName || 'LUXE STORE'}
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="navbar-desktop-links">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: 400,
                      color: isActive ? '#111111' : '#6B6B6B',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      padding: '6px 14px',
                      borderBottom: isActive ? '1px solid #C9A96E' : '1px solid transparent',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#111111'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#6B6B6B'; }}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Categories Mega Menu */}
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setMegaMenu(true)}
                onMouseLeave={() => setMegaMenu(false)}
              >
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 400,
                    color: '#6B6B6B',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid transparent',
                    cursor: 'pointer',
                    padding: '6px 14px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#111111'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#6B6B6B'; }}
                >
                  Categories
                  <motion.div animate={{ rotate: megaMenu ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {megaMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginTop: 8,
                        width: Math.min(480, window.innerWidth - 48),
                        background: '#FFFFFF',
                        border: '1px solid #E8E8E4',
                        borderRadius: 2,
                        padding: 24,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.06)',
                        zIndex: 100,
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        {categories.map((cat) => (
                          <div key={cat.name}>
                            <Link
                              to={`/products?category=${encodeURIComponent(cat.name)}`}
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.12em',
                                marginBottom: 8,
                                color: '#C9A96E',
                                fontFamily: "'DM Sans', sans-serif",
                                textDecoration: 'none',
                                display: 'block',
                                transition: 'color 0.2s ease',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#111111'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#C9A96E'; }}
                              onClick={() => setMegaMenu(false)}
                            >
                              {cat.name}
                            </Link>
                            {cat.sub.length > 0 && (
                              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {cat.sub.map((s) => (
                                  <li key={s}>
                                    <Link
                                      to={`/products?category=${encodeURIComponent(s)}`}
                                      onClick={() => setMegaMenu(false)}
                                      style={{
                                        fontSize: 13,
                                        color: '#6B6B6B',
                                        textDecoration: 'none',
                                        fontFamily: "'DM Sans', sans-serif",
                                        transition: 'color 0.2s ease',
                                      }}
                                      onMouseEnter={e => { e.currentTarget.style.color = '#111111'; }}
                                      onMouseLeave={e => { e.currentTarget.style.color = '#6B6B6B'; }}
                                    >
                                      {s}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

              {/* Animated Search */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <AnimatePresence>
                  {searchOpen && (
                    <motion.input
                      ref={searchRef}
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: window.innerWidth < 640 ? 160 : 200, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      style={{
                        position: 'absolute',
                        right: 44,
                        background: '#F8F8F6',
                        color: '#111111',
                        fontSize: 13,
                        borderRadius: 2,
                        padding: '6px 12px',
                        outline: 'none',
                        border: '1px solid #E8E8E4',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setSearchOpen(false);
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          saveRecentSearch(searchQuery);
                          navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
                          setSearchOpen(false);
                          setSearchQuery('');
                          setSearchResults({ products: [], categories: [] });
                        }
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Search results dropdown */}
                {searchOpen && (searchQuery.trim() || recentSearches.length > 0) && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 8,
                    width: '100%', maxWidth: 320, right: 0,
                    background: '#FFFFFF',
                    border: '1px solid #E8E8E4',
                    borderRadius: 2,
                    padding: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.06)',
                    zIndex: 50,
                  }}>
                    {!searchQuery.trim() ? (
                      <div style={{ padding: 8 }}>
                        <p style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: '#9E9E9E',
                          marginBottom: 8,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontFamily: "'DM Sans', sans-serif",
                        }}>Recent Searches</p>
                        {recentSearches.map((rs, i) => (
                          <Link key={i} to={`/products?search=${encodeURIComponent(rs)}`}
                            onClick={() => { setSearchOpen(false); saveRecentSearch(rs); }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '6px 8px',
                              borderRadius: 2,
                              color: '#6B6B6B',
                              fontSize: 13,
                              textDecoration: 'none',
                              fontFamily: "'DM Sans', sans-serif",
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F8F8F6'; e.currentTarget.style.color = '#111111'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B6B6B'; }}
                          >
                            <Search size={14} style={{ color: '#9E9E9E' }} />
                            {rs}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <>
                        {searchResults.categories?.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <p style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: '#9E9E9E',
                              padding: '0 8px',
                              marginBottom: 4,
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              fontFamily: "'DM Sans', sans-serif",
                            }}>Categories</p>
                            {searchResults.categories.map(c => (
                              <Link key={c._id} to={`/products?category=${encodeURIComponent(c.name)}`}
                                onClick={() => { setSearchOpen(false); setSearchQuery(''); saveRecentSearch(searchQuery); }}
                                style={{
                                  display: 'block',
                                  padding: '6px 12px',
                                  fontSize: 13,
                                  color: '#6B6B6B',
                                  textDecoration: 'none',
                                  borderRadius: 2,
                                  fontFamily: "'DM Sans', sans-serif",
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#F8F8F6'; e.currentTarget.style.color = '#111111'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B6B6B'; }}
                              >
                                {c.name}
                              </Link>
                            ))}
                          </div>
                        )}
                        {searchResults.products?.length > 0 ? (
                          <div>
                            <p style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: '#9E9E9E',
                              padding: '0 8px',
                              marginBottom: 4,
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              fontFamily: "'DM Sans', sans-serif",
                            }}>Products</p>
                            {searchResults.products.map(p => (
                              <Link key={p._id} to={`/products/${p.slug || p._id}`}
                                onClick={() => { setSearchOpen(false); setSearchQuery(''); saveRecentSearch(searchQuery); }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  padding: '8px 12px',
                                  borderRadius: 2,
                                  textDecoration: 'none',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#F8F8F6'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                              >
                                <div style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 2,
                                  flexShrink: 0,
                                  background: '#F8F8F6',
                                  border: '1px solid #E8E8E4',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  overflow: 'hidden',
                                }}>
                                  {p.images?.[0]?.url
                                    ? <img src={p.images[0].url} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.name} />
                                    : <Package size={16} style={{ color: '#9E9E9E' }} />}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ color: '#111111', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>{p.name}</p>
                                  <p style={{ color: '#9E9E9E', fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>${p.price}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: 16, textAlign: 'center', color: '#9E9E9E', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>No results found</div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Search icon button */}
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  style={iconBtnStyle}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#111111'; e.currentTarget.style.color = '#111111'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E4'; e.currentTarget.style.color = '#6B6B6B'; }}
                >
                  <Search size={18} />
                </button>
              </div>


              {/* Cart */}
              <button
                onClick={openCart}
                style={iconBtnStyle}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#111111'; e.currentTarget.style.color = '#111111'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E4'; e.currentTarget.style.color = '#6B6B6B'; }}
              >
                <ShoppingCart size={18} />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      key={itemCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 16,
                        height: 16,
                        background: '#111111',
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* User */}
              {token ? (
                <UserMenu user={user} logout={logout} />
              ) : (
                <Link
                  to="/login"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    border: '1px solid #111111',
                    borderRadius: 2,
                    color: '#111111',
                    fontSize: 12,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    textDecoration: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'all 0.2s ease',
                    background: 'transparent',
                  }}
                  className="navbar-login-btn"
                  onMouseEnter={e => { e.currentTarget.style.background = '#111111'; e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#111111'; }}
                >
                  <User size={15} />
                  Login
                </Link>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{
                  ...iconBtnStyle,
                  display: 'none',
                }}
                className="navbar-hamburger"
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#111111'; e.currentTarget.style.color = '#111111'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E4'; e.currentTarget.style.color = '#6B6B6B'; }}
              >
                <AnimatePresence mode="wait">
                  {mobileOpen ? (
                    <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <X size={20} />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Menu size={20} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu — full-screen white overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{
                position: 'fixed',
                top: 72,
                left: 0,
                right: 0,
                bottom: 0,
                background: '#FFFFFF',
                zIndex: 40,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: 32,
              }}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 'clamp(24px, 6vw, 36px)',
                    fontWeight: 600,
                    color: '#111111',
                    textDecoration: 'none',
                    letterSpacing: '0.04em',
                    padding: '8px 0',
                    borderBottom: location.pathname === link.path ? '1px solid #C9A96E' : '1px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#6B6B6B'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#111111'; }}
                >
                  {link.label}
                </Link>
              ))}
              {!token && (
                <Link
                  to="/login"
                  style={{
                    marginTop: 24,
                    display: 'block',
                    padding: '12px 32px',
                    border: '1px solid #111111',
                    borderRadius: 2,
                    textAlign: 'center',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#111111',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#111111'; e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#111111'; }}
                >
                  Login / Register
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Responsive styles */}
        <style>{`
          @media (min-width: 1024px) {
            .navbar-desktop-links { display: flex !important; }
            .navbar-hamburger { display: none !important; }
            .navbar-login-btn { display: flex !important; }
          }
          @media (max-width: 1023px) {
            .navbar-desktop-links { display: none !important; }
            .navbar-hamburger { display: flex !important; }
          }
          @media (min-width: 640px) {
            .navbar-login-btn { display: flex !important; }
          }
        `}</style>
      </motion.nav>
    </>
  );
}
