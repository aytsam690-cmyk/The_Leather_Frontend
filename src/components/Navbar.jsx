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
import { optimizeImage } from '../utils/cloudinary';



const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Products', path: '/products' },
  { label: 'Track Order', path: '/track-order' },
  { label: 'About', path: '/about' },
];

/* ─── Inline styles ──────────────────────────────────────────────────────── */
const iconBtnStyle = {
  width: 44,
  height: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #2C2C26',
  borderRadius: 2,
  color: '#A89880',
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
          border: '1px solid #2C2C26',
          background: '#1C1C17',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          color: '#F5F0E8',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600,
          fontSize: 14,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#C9A96E';
          e.currentTarget.style.background = '#C9A96E';
          e.currentTarget.style.color = '#0D0D0B';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#2C2C26';
          e.currentTarget.style.background = '#1C1C17';
          e.currentTarget.style.color = '#F5F0E8';
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
                background: '#141410',
                border: '1px solid #2C2C26',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
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
                  color: '#A89880',
                  textDecoration: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#F5F0E8'; e.currentTarget.style.background = '#1C1C17'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#A89880'; e.currentTarget.style.background = 'transparent'; }}
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
                  color: '#A89880',
                  textDecoration: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#F5F0E8'; e.currentTarget.style.background = '#1C1C17'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#A89880'; e.currentTarget.style.background = 'transparent'; }}
              >
                <Package size={14} /> My Orders
              </Link>
              <hr style={{ borderColor: '#2C2C26', margin: 0 }} />
              <button
                onClick={() => { logout(); setOpen(false); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  fontSize: 13,
                  color: '#A89880',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#F5F0E8'; e.currentTarget.style.background = '#1C1C17'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#A89880'; e.currentTarget.style.background = 'transparent'; }}
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
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ products: [], categories: [] });
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
          // Build parent-child tree
          const parents = items.filter(c => !c.parentCategory);
          const children = items.filter(c => c.parentCategory);
          setCategories(parents.map(c => ({
            name: c.name,
            slug: c.slug,
            sub: children
              .filter(ch => ch.parentCategory === c._id || ch.parentCategory?.toString() === c._id?.toString())
              .map(ch => ({ name: ch.name, slug: ch.slug })),
          })));
        } else {
          setCategories([]);
        }
      })
      .catch(() => {
        setCategories([]);
      });
  }, []);

  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recentSearches')) || []; } catch { return []; }
  });

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults({ products: [], categories: [] }); return; }
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
          background: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          borderBottom: 'none',
          transition: 'box-shadow 0.3s ease, background 0.3s ease',
          boxShadow: scrolled ? '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }} className="navbar-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>

            {/* Logo */}
            <Link to="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
              {settings?.logo && (
                <img src={optimizeImage(settings.logo, 300)} alt={settings.siteName || 'Store Logo'} style={{ maxHeight: '58px', maxWidth: '220px', width: 'auto', height: 'auto', objectFit: 'contain' }} />
              )}
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(18px, 4vw, 28px)',
                fontWeight: 600,
                color: '#F5F0E8',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                lineHeight: 1,
                whiteSpace: 'nowrap',
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
                      color: isActive ? '#F5F0E8' : '#A89880',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      padding: '6px 14px',
                      borderBottom: isActive ? '1px solid #C9A96E' : '1px solid transparent',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#F5F0E8'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#A89880'; }}
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
                    color: '#A89880',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid transparent',
                    cursor: 'pointer',
                    padding: '6px 14px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#F5F0E8'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#A89880'; }}
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
                        background: '#141410',
                        border: '1px solid #2C2C26',
                        borderRadius: 2,
                        padding: 24,
                        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
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
                              onMouseEnter={e => { e.currentTarget.style.color = '#F5F0E8'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#C9A96E'; }}
                              onClick={() => setMegaMenu(false)}
                            >
                              {cat.name}
                            </Link>
                            {cat.sub.length > 0 && (
                              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {cat.sub.map((s) => (
                                  <li key={s.name || s}>
                                    <Link
                                      to={`/products?category=${encodeURIComponent(s.name || s)}`}
                                      onClick={() => setMegaMenu(false)}
                                      style={{
                                        fontSize: 13,
                                        color: '#A89880',
                                        textDecoration: 'none',
                                        fontFamily: "'DM Sans', sans-serif",
                                        transition: 'color 0.2s ease',
                                      }}
                                      onMouseEnter={e => { e.currentTarget.style.color = '#F5F0E8'; }}
                                      onMouseLeave={e => { e.currentTarget.style.color = '#A89880'; }}
                                    >
                                      {s.name || s}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

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
                        background: '#1C1C17',
                        color: '#F5F0E8',
                        fontSize: 13,
                        borderRadius: 2,
                        padding: '6px 12px',
                        outline: 'none',
                        border: '1px solid #2C2C26',
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
                    background: '#141410',
                    border: '1px solid #2C2C26',
                    borderRadius: 2,
                    padding: 8,
                    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
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
                              color: '#A89880',
                              fontSize: 13,
                              textDecoration: 'none',
                              fontFamily: "'DM Sans', sans-serif",
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#1C1C17'; e.currentTarget.style.color = '#F5F0E8'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A89880'; }}
                          >
                            <Search size={14} style={{ color: '#6B6055' }} />
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
                            {(searchResults.categories || []).map(c => (
                              <Link key={c._id} to={`/products?category=${encodeURIComponent(c.name)}`}
                                onClick={() => { setSearchOpen(false); setSearchQuery(''); saveRecentSearch(searchQuery); }}
                                style={{
                                  display: 'block',
                                  padding: '6px 12px',
                                  fontSize: 13,
                                  color: '#A89880',
                                  textDecoration: 'none',
                                  borderRadius: 2,
                                  fontFamily: "'DM Sans', sans-serif",
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#1C1C17'; e.currentTarget.style.color = '#F5F0E8'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A89880'; }}
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
                            {(searchResults.products || []).map(p => (
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
                                onMouseEnter={e => { e.currentTarget.style.background = '#1C1C17'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                              >
                                <div style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 2,
                                  flexShrink: 0,
                                  background: '#1C1C17',
                                  border: '1px solid #2C2C26',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  overflow: 'hidden',
                                }}>
                                  {p.images?.[0]?.url
                                    ? <img src={optimizeImage(p.images[0].url, 150)} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.name} />
                                    : <Package size={16} style={{ color: '#6B6055' }} />}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ color: '#F5F0E8', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>{p.name}</p>
                                  <p style={{ color: '#6B6055', fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>${p.price}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: 16, textAlign: 'center', color: '#6B6055', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>No results found</div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Search icon button */}
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  style={iconBtnStyle}
                  className="navbar-search-toggle"
                  aria-label="Toggle Search"
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.color = '#F5F0E8'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2C2C26'; e.currentTarget.style.color = '#A89880'; }}
                >
                  <Search size={18} />
                </button>
              </div>


              {/* Cart */}
              <button
                onClick={openCart}
                style={iconBtnStyle}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.color = '#F5F0E8'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2C2C26'; e.currentTarget.style.color = '#A89880'; }}
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
                        background: '#C9A96E',
                        color: '#0D0D0B',
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

              {/* User — hidden on mobile, shown in mobile menu */}
              {token ? (
                <span className="navbar-user-menu">
                  <UserMenu user={user} logout={logout} />
                </span>
              ) : (
                <Link
                  to="/login"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    border: '1px solid #3D3D34',
                    borderRadius: 2,
                    color: '#F5F0E8',
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
                  onMouseEnter={e => { e.currentTarget.style.background = '#F5F0E8'; e.currentTarget.style.color = '#0D0D0B'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#F5F0E8'; }}
                >
                  <User size={15} />
                  Login
                </Link>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                style={iconBtnStyle}
                className="navbar-hamburger"
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.color = '#F5F0E8'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2C2C26'; e.currentTarget.style.color = '#A89880'; }}
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

        {/* Responsive styles */}
        <style>{`
          .navbar-container {
            padding: 0 16px;
          }
          @media (min-width: 768px) {
            .navbar-container {
              padding: 0 24px;
            }
          }
          @media (min-width: 1024px) {
            .navbar-desktop-links { display: flex !important; }
            .navbar-hamburger { display: none !important; }
            .navbar-login-btn { display: flex !important; }
            .navbar-user-menu { display: block !important; }
          }
          @media (max-width: 1023px) {
            .navbar-desktop-links { display: none !important; }
            .navbar-hamburger { display: flex !important; }
            .navbar-login-btn { display: none !important; }
            .navbar-user-menu { display: none !important; }
          }
          @media (max-width: 639px) {
            .navbar-search-toggle { display: none !important; }
          }
        `}</style>
      </motion.nav>

      {/* Mobile Menu — full-screen dark overlay (OUTSIDE motion.nav for proper z-index) */}
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
              background: '#0D0D0B',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 8,
              padding: '48px 32px 32px',
              overflowY: 'auto',
            }}
          >
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 'clamp(24px, 6vw, 36px)',
                    fontWeight: 600,
                    color: '#F5F0E8',
                    textDecoration: 'none',
                    letterSpacing: '0.04em',
                    padding: '8px 0',
                    borderBottom: location.pathname === link.path ? '1px solid #C9A96E' : '1px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#A89880'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#F5F0E8'; }}
                >
                  {link.label}
                </Link>
              ))}

              {/* ── Mobile Categories Accordion ── */}
              {categories.length > 0 && (
                <div style={{ width: '100%', maxWidth: 320 }}>
                  <button
                    onClick={() => setMobileCatOpen(!mobileCatOpen)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 'clamp(24px, 6vw, 36px)',
                      fontWeight: 600,
                      color: '#F5F0E8',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px 0',
                      letterSpacing: '0.04em',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#A89880'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#F5F0E8'; }}
                  >
                    Categories
                    <motion.div animate={{ rotate: mobileCatOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={20} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {mobileCatOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8, paddingBottom: 12 }}>
                          {categories.map(cat => (
                            <Link
                              key={cat.name}
                              to={`/products?category=${encodeURIComponent(cat.name)}`}
                              onClick={() => { setMobileCatOpen(false); setMobileOpen(false); }}
                              style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: 15,
                                color: '#C9A96E',
                                textDecoration: 'none',
                                padding: '6px 0',
                                textAlign: 'center',
                                transition: 'color 0.2s ease',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#F5F0E8'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#C9A96E'; }}
                            >
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {!token ? (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    marginTop: 24,
                    display: 'block',
                    padding: '12px 32px',
                    border: '1px solid #3D3D34',
                    borderRadius: 2,
                    textAlign: 'center',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#F5F0E8',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F5F0E8'; e.currentTarget.style.color = '#0D0D0B'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#F5F0E8'; }}
                >
                  Login / Register
                </Link>
              ) : (
                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
                  <Link
                    to="/account"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: 'block',
                      padding: '12px 32px',
                      border: '1px solid #F5F0E8',
                      borderRadius: 2,
                      textAlign: 'center',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#0D0D0B',
                      textDecoration: 'none',
                      background: '#F5F0E8',
                      minWidth: 180,
                    }}
                  >
                    <User size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                    My Account
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    style={{
                      padding: '10px 32px',
                      border: '1px solid #2C2C26',
                      borderRadius: 2,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#C0392B',
                      background: 'transparent',
                      cursor: 'pointer',
                      minWidth: 180,
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
    </>
  );
}
