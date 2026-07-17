import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, Menu, X, ChevronDown, User, Package } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import { getCategories } from '../services/api';
import { optimizeImage } from '../utils/cloudinary';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Products', path: '/products' },
  { label: 'Journal', path: '/blogs' },
  { label: 'Track Order', path: '/track-order' },
  { label: 'About', path: '/about' },
];

function UserMenu({ user, logout }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="w-10 h-10 rounded-sm border border-[#2C2C26] bg-[#1C1C17] flex items-center justify-center cursor-pointer transition-all duration-200 text-[#F5F0E8] font-dm font-semibold text-sm hover:border-[#C9A96E] hover:bg-[#C9A96E] hover:text-[#0D0D0B]">
        {user?.name?.[0]?.toUpperCase() || 'U'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full w-48 pt-2 z-50"
          >
            <div className="bg-[#141410] border border-[#2C2C26] rounded-sm overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
              <Link to="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 text-[13px] text-[#A89880] no-underline font-dm transition-all duration-200 hover:text-[#F5F0E8] hover:bg-[#1C1C17]">
                <User size={14} /> My Profile
              </Link>
              <Link to="/orders" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 text-[13px] text-[#A89880] no-underline font-dm transition-all duration-200 hover:text-[#F5F0E8] hover:bg-[#1C1C17]">
                <Package size={14} /> My Orders
              </Link>
              <hr className="border-[#2C2C26] m-0" />
              <button onClick={() => { logout(); setOpen(false); }} className="w-full flex items-center gap-2 px-4 py-3 text-[13px] text-[#A89880] bg-transparent border-none cursor-pointer font-dm transition-all duration-200 text-left hover:text-[#F5F0E8] hover:bg-[#1C1C17]">
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

  useEffect(() => {
    getCategories()
      .then(data => {
        const items = Array.isArray(data) ? data : [];
        if (items.length > 0) {
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
      .catch(() => setCategories([]));
  }, []);

  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recentSearches')) || []; } catch { return []; }
  });

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults({ products: [], categories: [] }); return; }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      import('../services/api').then(({ getSearchSuggestions }) => {
        if (getSearchSuggestions) {
          getSearchSuggestions(searchQuery, { signal: controller.signal })
            .then(data => setSearchResults(data || { products: [], categories: [] }))
            .catch(err => { if (err.name !== 'CanceledError' && err.name !== 'AbortError') setSearchResults({ products: [], categories: [] }); });
        }
      });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
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
        className={`fixed top-0 left-0 right-0 z-50 bg-transparent transition-all duration-300 ${scrolled ? 'shadow-[0_1px_3px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3)] bg-[#0D0D0B]/90 backdrop-blur-md' : 'shadow-none'}`}
      >
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-[72px]">
            <Link to="/" className="no-underline flex-shrink-0 flex items-center gap-3">
              {settings?.logo && (
                <img src={optimizeImage(settings.logo, 300)} alt={settings.siteName || 'Store Logo'} className="max-h-[58px] max-w-[220px] w-auto h-auto object-contain" />
              )}
              <span className="font-cormorant text-[clamp(18px,4vw,28px)] font-semibold text-[#F5F0E8] tracking-[0.02em] uppercase leading-none whitespace-nowrap">
                {settings?.siteName || 'LUXE STORE'}
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`font-dm text-[13px] font-normal tracking-[0.04em] uppercase no-underline px-3.5 py-1.5 border-b transition-all duration-200 ${isActive ? 'text-[#F5F0E8] border-[#C9A96E]' : 'text-[#A89880] border-transparent hover:text-[#F5F0E8]'}`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="relative" onMouseEnter={() => setMegaMenu(true)} onMouseLeave={() => setMegaMenu(false)}>
                <button className="flex items-center gap-1 font-dm text-[13px] font-normal text-[#A89880] tracking-[0.04em] uppercase bg-transparent border-none border-b border-transparent cursor-pointer px-3.5 py-1.5 transition-all duration-200 hover:text-[#F5F0E8]">
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
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] max-w-[calc(100vw-48px)] bg-[#141410] border border-[#2C2C26] rounded-sm p-6 shadow-[0_8px_40px_rgba(0,0,0,0.5)] z-50"
                    >
                      <div className="grid grid-cols-2 gap-6">
                        {categories.map((cat) => (
                          <div key={cat.name}>
                            <Link
                              to={`/products?category=${encodeURIComponent(cat.name)}`}
                              onClick={() => setMegaMenu(false)}
                              className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-2 text-[#C9A96E] font-dm no-underline block transition-colors duration-200 hover:text-[#F5F0E8]"
                            >
                              {cat.name}
                            </Link>
                            {cat.sub.length > 0 && (
                              <ul className="list-none p-0 m-0 flex flex-col gap-1">
                                {cat.sub.map((s) => (
                                  <li key={typeof s === 'string' ? s : s.name || 'cat'}>
                                    <Link
                                      to={`/products?category=${encodeURIComponent(typeof s === 'string' ? s : s.name)}`}
                                      onClick={() => setMegaMenu(false)}
                                      className="text-[13px] text-[#A89880] no-underline font-dm transition-colors duration-200 hover:text-[#F5F0E8]"
                                    >
                                      {typeof s === 'string' ? s : s.name}
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

            <div className="flex items-center gap-1.5">
              <div className="relative flex items-center">
                <AnimatePresence>
                  {searchOpen && (
                    <motion.input
                      ref={searchRef}
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: typeof window !== 'undefined' && window.innerWidth < 640 ? 160 : 200, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="absolute right-11 bg-[#1C1C17] text-[#F5F0E8] text-[13px] rounded-sm px-3 py-1.5 outline-none border border-[#2C2C26] font-dm"
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

                {searchOpen && (searchQuery.trim() || recentSearches.length > 0) && (
                  <div className="absolute top-full right-0 mt-2 w-full max-w-[320px] bg-[#141410] border border-[#2C2C26] rounded-sm p-2 shadow-[0_8px_40px_rgba(0,0,0,0.5)] z-50">
                    {!searchQuery.trim() ? (
                      <div className="p-2">
                        <p className="text-[10px] font-semibold text-[#9E9E9E] mb-2 uppercase tracking-[0.08em] font-dm">Recent Searches</p>
                        {recentSearches.map((rs, i) => (
                          <Link key={i} to={`/products?search=${encodeURIComponent(rs)}`}
                            onClick={() => { setSearchOpen(false); saveRecentSearch(rs); }}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-sm text-[#A89880] text-[13px] no-underline font-dm transition-all duration-200 hover:bg-[#1C1C17] hover:text-[#F5F0E8]"
                          >
                            <Search size={14} className="text-[#6B6055]" />
                            {rs}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <>
                        {searchResults.categories?.length > 0 && (
                          <div className="mb-2">
                            <p className="text-[10px] font-semibold text-[#9E9E9E] px-2 mb-1 uppercase tracking-[0.08em] font-dm">Categories</p>
                            {(searchResults.categories || []).map(c => (
                              <Link key={c._id} to={`/products?category=${encodeURIComponent(c.name)}`}
                                onClick={() => { setSearchOpen(false); setSearchQuery(''); saveRecentSearch(searchQuery); }}
                                className="block px-3 py-1.5 text-[13px] text-[#A89880] no-underline rounded-sm font-dm transition-all duration-200 hover:bg-[#1C1C17] hover:text-[#F5F0E8]"
                              >
                                {c.name}
                              </Link>
                            ))}
                          </div>
                        )}
                        {searchResults.products?.length > 0 ? (
                          <div>
                            <p className="text-[10px] font-semibold text-[#9E9E9E] px-2 mb-1 uppercase tracking-[0.08em] font-dm">Products</p>
                            {(searchResults.products || []).map(p => (
                              <Link key={p._id} to={`/products/${p.slug || p._id}`}
                                onClick={() => { setSearchOpen(false); setSearchQuery(''); saveRecentSearch(searchQuery); }}
                                className="flex items-center gap-3 px-3 py-2 rounded-sm no-underline transition-all duration-200 hover:bg-[#1C1C17]"
                              >
                                <div className="w-8 h-8 rounded-sm flex-shrink-0 bg-[#1C1C17] border border-[#2C2C26] flex items-center justify-center overflow-hidden">
                                  {p.images?.[0]?.url
                                    ? <img src={optimizeImage(p.images[0].url, 150)} loading="lazy" className="w-full h-full object-cover" alt={p.name} />
                                    : <Package size={16} className="text-[#6B6055]" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[#F5F0E8] text-[12px] font-medium overflow-hidden text-ellipsis whitespace-nowrap font-dm m-0">{p.name}</p>
                                  <p className="text-[#6B6055] text-[10px] font-dm m-0">${p.price}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-[#6B6055] text-[13px] font-dm">No results found</div>
                        )}
                      </>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="hidden sm:flex w-11 h-11 items-center justify-center border border-[#2C2C26] rounded-sm text-[#A89880] bg-transparent cursor-pointer transition-all duration-200 relative flex-shrink-0 hover:border-[#C9A96E] hover:text-[#F5F0E8]"
                  aria-label="Toggle Search"
                >
                  <Search size={18} />
                </button>
              </div>

              <button
                className="navbar-cart-icon flex w-11 h-11 items-center justify-center border border-[#2C2C26] rounded-sm text-[#A89880] bg-transparent cursor-pointer transition-all duration-200 relative flex-shrink-0 hover:border-[#C9A96E] hover:text-[#F5F0E8]"
                onClick={openCart}
                aria-label="View Cart"
              >
                <ShoppingCart size={18} />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      key={itemCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-0 right-0 w-4 h-4 bg-[#C9A96E] text-[#0D0D0B] text-[10px] font-bold rounded-full flex items-center justify-center font-dm"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {token ? (
                <span className="hidden lg:block">
                  <UserMenu user={user} logout={logout} />
                </span>
              ) : (
                <Link
                  to="/login"
                  className="hidden lg:flex items-center gap-1.5 px-4 py-2 border border-[#3D3D34] rounded-sm text-[#F5F0E8] text-[12px] font-medium uppercase tracking-[0.06em] no-underline font-dm transition-all duration-200 bg-transparent hover:bg-[#F5F0E8] hover:text-[#0D0D0B]"
                >
                  <User size={15} />
                  Login
                </Link>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Open Menu"
                className="flex lg:hidden w-11 h-11 items-center justify-center border border-[#2C2C26] rounded-sm text-[#A89880] bg-transparent cursor-pointer transition-all duration-200 relative flex-shrink-0 hover:border-[#C9A96E] hover:text-[#F5F0E8]"
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
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-[72px] left-0 right-0 bottom-0 bg-[#0D0D0B] z-[9999] flex flex-col items-center justify-start gap-2 px-8 pt-12 pb-8 overflow-y-auto"
          >
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`font-cormorant text-[clamp(24px,6vw,36px)] font-semibold text-[#F5F0E8] no-underline tracking-[0.04em] py-2 border-b transition-all duration-200 hover:text-[#A89880] ${location.pathname === link.path ? 'border-[#C9A96E]' : 'border-transparent'}`}
                >
                  {link.label}
                </Link>
              ))}

              {categories.length > 0 && (
                <div className="w-full max-w-[320px]">
                  <button
                    onClick={() => setMobileCatOpen(!mobileCatOpen)}
                    className="w-full flex items-center justify-center gap-2 font-cormorant text-[clamp(24px,6vw,36px)] font-semibold text-[#F5F0E8] bg-transparent border-none cursor-pointer py-2 tracking-[0.04em] transition-colors duration-200 hover:text-[#A89880]"
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
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-1.5 pt-2 pb-3">
                          {categories.map(cat => (
                            <Link
                              key={cat.name}
                              to={`/products?category=${encodeURIComponent(cat.name)}`}
                              onClick={() => { setMobileCatOpen(false); setMobileOpen(false); }}
                              className="font-dm text-[15px] text-[#C9A96E] no-underline py-1.5 text-center transition-colors duration-200 hover:text-[#F5F0E8]"
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
                  className="mt-6 block px-8 py-3 border border-[#3D3D34] rounded-sm text-center font-dm text-[13px] font-medium uppercase tracking-[0.08em] text-[#F5F0E8] no-underline transition-all duration-200 bg-transparent hover:bg-[#F5F0E8] hover:text-[#0D0D0B]"
                >
                  Login / Register
                </Link>
              ) : (
                <div className="mt-6 flex flex-col items-center gap-3 w-full">
                  <Link
                    to="/account"
                    onClick={() => setMobileOpen(false)}
                    className="block px-8 py-3 border border-[#F5F0E8] rounded-sm text-center font-dm text-[13px] font-medium uppercase tracking-[0.08em] text-[#0D0D0B] no-underline bg-[#F5F0E8] min-w-[180px]"
                  >
                    <User size={14} className="inline mr-1.5 align-middle" />
                    My Account
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="px-8 py-2.5 border border-[#2C2C26] rounded-sm font-dm text-[13px] font-medium uppercase tracking-[0.08em] text-[#C0392B] bg-transparent cursor-pointer min-w-[180px]"
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
