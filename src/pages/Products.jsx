import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, X, FilterX, SlidersHorizontal } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories, getFilters, getBanners } from '../services/api';
import useSettingsStore from '../store/settingsStore';

// ─── Constants ────────────────────────────────────────────────────────────────
const INITIAL_FILTERS = { category: 'All', brands: [], sizes: [], colors: [], minRating: 0, inStock: false, search: '' };
const PAGE_SIZE = 9;

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  dm: "'DM Sans', sans-serif",
  cm: "'Cormorant Garamond', serif",
  black: '#111111',
  white: '#FFFFFF',
  surface: '#F8F8F6',
  muted: '#9E9E9E',
  secondary: '#6B6B6B',
  gold: '#C9A96E',
  border: '#E8E8E4',
  danger: '#9B2226',
};

const chipStyle = {
  background: S.white,
  border: `1px solid ${S.border}`,
  borderRadius: 2,
  padding: '4px 10px',
  fontFamily: S.dm,
  fontSize: 11,
  color: S.secondary,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  whiteSpace: 'nowrap',
};

// ─── Filter Section (stable component, NOT inlined) ──────────────────────────
function FilterSection({ label, isOpen, onToggle, children, noBorder }) {
  return (
    <div style={{
      borderBottom: noBorder ? 'none' : `1px solid ${S.border}`,
      paddingBottom: noBorder ? 0 : 20,
      marginBottom: noBorder ? 0 : 20,
    }}>
      <button onClick={onToggle} style={{
        fontFamily: S.dm, fontSize: 10, fontWeight: 500, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: S.muted, background: 'none', border: 'none',
        cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
        width: '100%', marginBottom: isOpen ? 16 : 0, alignItems: 'center',
      }}>
        {label}
        {isOpen ? <ChevronUp size={13} color={S.muted} /> : <ChevronDown size={13} color={S.muted} />}
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ filters, setFilters, onReset, availableFilters, onCategoryChange }) {
  const [open, setOpen] = useState({ category: true, brand: true, size: true, color: true, rating: true });
  const toggle = (k) => setOpen(p => ({ ...p, [k]: !p[k] }));

  return (
    <aside style={{ width: 256, flexShrink: 0 }} className="hidden lg:block">
      <div style={{
        background: S.white, border: `1px solid ${S.border}`, borderRadius: 2,
        padding: 24, position: 'sticky', top: 96,
        maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontFamily: S.cm, fontSize: 20, fontWeight: 500, color: S.black, margin: 0 }}>Filters</h3>
          <button onClick={onReset} style={{
            fontFamily: S.dm, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
            color: S.muted, background: 'none', border: 'none', cursor: 'pointer',
          }}>Reset All</button>
        </div>

        {/* Category */}
        <FilterSection label="Category" isOpen={open.category} onToggle={() => toggle('category')}>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {['All', ...(availableFilters.categories || [])].map((c) => (
              <button key={c} onClick={() => onCategoryChange(c)} style={{
                width: '100%', textAlign: 'left', fontFamily: S.dm, fontSize: 13,
                color: filters.category === c ? S.black : S.secondary, padding: '6px 0',
                paddingLeft: filters.category === c ? 12 : 0, background: 'transparent', border: 'none',
                borderLeft: filters.category === c ? `2px solid ${S.black}` : '2px solid transparent',
                cursor: 'pointer', fontWeight: filters.category === c ? 500 : 400,
                transition: 'all 0.15s',
              }}>{c}</button>
            ))}
          </div>
        </FilterSection>

        {/* Brand */}
        {availableFilters.brands?.length > 0 && (
          <FilterSection label="Brand" isOpen={open.brand} onToggle={() => toggle('brand')}>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {availableFilters.brands.map((b) => {
                const on = filters.brands.includes(b);
                return (
                  <div key={b} onClick={() => setFilters(f => ({
                    ...f, brands: on ? f.brands.filter(x => x !== b) : [...f.brands, b]
                  }))} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer' }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 2, flexShrink: 0,
                      border: `1px solid ${on ? S.black : S.border}`,
                      background: on ? S.black : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>{on && <span style={{ color: S.white, fontSize: 10, lineHeight: 1 }}>✓</span>}</div>
                    <span style={{ fontFamily: S.dm, fontSize: 13, color: S.secondary }}>{b}</span>
                  </div>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* Size */}
        {availableFilters.sizes?.length > 0 && (
          <FilterSection label="Size" isOpen={open.size} onToggle={() => toggle('size')}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {availableFilters.sizes.map((s) => {
                const on = filters.sizes.includes(s);
                return (
                  <button key={s} onClick={() => setFilters(f => ({
                    ...f, sizes: on ? f.sizes.filter(x => x !== s) : [...f.sizes, s]
                  }))} style={{
                    border: `1px solid ${on ? S.black : S.border}`,
                    background: on ? S.black : 'transparent', color: on ? S.white : S.black,
                    fontFamily: S.dm, fontSize: 13, padding: '6px 14px', borderRadius: 2,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>{s}</button>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* Color */}
        {availableFilters.colors?.length > 0 && (
          <FilterSection label="Color" isOpen={open.color} onToggle={() => toggle('color')}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {availableFilters.colors.map((c) => {
                const on = filters.colors.includes(c);
                return (
                  <button key={c} onClick={() => setFilters(f => ({
                    ...f, colors: on ? f.colors.filter(x => x !== c) : [...f.colors, c]
                  }))} style={{
                    border: `1px solid ${on ? S.black : S.border}`,
                    background: on ? S.black : 'transparent', color: on ? S.white : S.black,
                    fontFamily: S.dm, fontSize: 13, padding: '6px 14px', borderRadius: 2,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>{c}</button>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* Rating */}
        <FilterSection label="Min Rating" isOpen={open.rating} onToggle={() => toggle('rating')}>
          {[4, 3, 2].map((r) => {
            const sel = filters.minRating === r;
            return (
              <div key={r} onClick={() => setFilters(f => ({ ...f, minRating: sel ? 0 : r }))}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer' }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                  background: sel ? S.black : 'transparent',
                  border: sel ? `2px solid ${S.black}` : `1.5px solid ${S.border}`,
                  transition: 'all 0.15s',
                }} />
                <span style={{ color: S.gold, fontSize: 13 }}>{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span>
                <span style={{ fontFamily: S.dm, fontSize: 13, color: S.secondary }}>& up</span>
              </div>
            );
          })}
        </FilterSection>

        {/* In Stock Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
          <span style={{ fontFamily: S.dm, fontSize: 13, color: S.secondary }}>In Stock Only</span>
          <button onClick={() => setFilters(f => ({ ...f, inStock: !f.inStock }))} style={{
            position: 'relative', width: 40, height: 22, borderRadius: 9999, padding: 0,
            background: filters.inStock ? S.black : S.surface,
            border: `1px solid ${filters.inStock ? S.black : S.border}`,
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <span style={{
              position: 'absolute', top: 3, left: filters.inStock ? 20 : 3,
              width: 14, height: 14, background: S.white, borderRadius: '50%',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
            }} />
          </button>
        </div>

        {/* Sidebar Banners — INSIDE sticky container */}
        {availableFilters.sidebarBanners?.length > 0 && (
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16, borderTop: `1px solid ${S.border}`, paddingTop: 20 }}>
            {availableFilters.sidebarBanners.map(b => (
              <div key={b._id || b.id} style={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${S.border}` }}>
                <a href={b.link || '#'} style={{
                  display: 'block', height: 180, background: S.surface,
                  backgroundImage: b.image ? `url(${b.image})` : b.bg,
                  backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative',
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,17,17,0.7), transparent)' }} />
                  <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                    <h4 style={{ color: S.white, fontFamily: S.dm, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{b.title}</h4>
                    {b.subtitle && <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, margin: '0 0 8px' }}>{b.subtitle}</p>}
                    {b.btn && (
                      <span style={{
                        display: 'inline-block', padding: '4px 10px', background: S.black, color: S.white,
                        fontSize: 10, fontFamily: S.dm, textTransform: 'uppercase', letterSpacing: '0.1em',
                        fontWeight: 600, borderRadius: 2,
                      }}>{b.btn}</span>
                    )}
                  </div>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function Chip({ label, onRemove }) {
  return (
    <span style={chipStyle}>
      {label}
      <X size={11} style={{ color: S.muted, cursor: 'pointer' }} onClick={onRemove}
        onMouseEnter={e => { e.currentTarget.style.color = S.danger; }}
        onMouseLeave={e => { e.currentTarget.style.color = S.muted; }} />
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = useSettingsStore();
  const [allProducts, setAllProducts] = useState([]);

  const [filters, setFilters] = useState(() => ({
    category: searchParams.get('category') || 'All',

    brands: searchParams.get('brands') ? searchParams.get('brands').split(',') : [],
    sizes: searchParams.get('sizes') ? searchParams.get('sizes').split(',') : [],
    colors: searchParams.get('colors') ? searchParams.get('colors').split(',') : [],
    minRating: Number(searchParams.get('minRating')) || 0,
    inStock: searchParams.get('inStock') === 'true',
    search: searchParams.get('search') || '',
  }));

  const [availableFilters, setAvailableFilters] = useState({ categories: [], brands: [], sizes: [], colors: [] });
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');

  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category !== 'All') params.set('category', filters.category);

    if (filters.brands.length) params.set('brands', filters.brands.join(','));
    if (filters.sizes.length) params.set('sizes', filters.sizes.join(','));
    if (filters.colors.length) params.set('colors', filters.colors.join(','));
    if (filters.minRating > 0) params.set('minRating', filters.minRating);
    if (filters.inStock) params.set('inStock', 'true');
    if (filters.search) params.set('search', filters.search);
    if (sort !== 'newest') params.set('sort', sort);
    if (page > 1) params.set('page', page);
    setSearchParams(params, { replace: true });
  }, [filters, sort, page, setSearchParams, availableFilters]);

  // Handle URL changes from external navigation (e.g., Navbar)
  useEffect(() => {
    const urlCategory = searchParams.get('category') || 'All';
    const urlSearch = searchParams.get('search') || '';
    setFilters(prev => {
      if (prev.category !== urlCategory || prev.search !== urlSearch) {
        return { 
          ...prev, 
          category: urlCategory, 
          search: urlSearch,
          brands: [], sizes: [], colors: [], minRating: 0, inStock: false // Reset other filters too
        };
      }
      return prev;
    });
  }, [searchParams]);

  // Fetch products + filters + banners
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getProducts({ pageSize: 100, search: filters.search }),
      getFilters(filters.category !== 'All' ? filters.category : undefined),
      getCategories().catch(() => []),
      getBanners().catch(() => []),
    ])
      .then(([productsData, filtersData, categoriesData, bannersData]) => {
        const items = productsData?.products || productsData || [];
        setAllProducts(items.map((p, i) => {
          const firstImage = p.images?.[0]?.url || p.images?.[0];
          return {
            ...p,
            rating: p.ratings?.average || p.rating || 0,
            reviews: p.ratings?.count || p.numReviews || 0,
            category: typeof p.category === 'object' ? p.category?.name : (p.category || ''),
            bg: firstImage ? `url(${firstImage}) center/cover no-repeat` : `linear-gradient(135deg,${['#667eea,#764ba2', '#f093fb,#f5576c', '#4facfe,#00f2fe', '#43e97b,#38f9d7', '#fa709a,#fee140', '#a18cd1,#fbc2eb'][i % 6]})`,
          };
        }));

        // Build available filter options
        const categoryNames = Array.isArray(categoriesData)
          ? categoriesData.map(c => (typeof c === 'object' ? c.name : c)).filter(Boolean)
          : [];

        const af = {
          categories: categoryNames,
          brands: filtersData?.brands || [],
          sizes: filtersData?.sizes || [],
          colors: filtersData?.colors || [],
        };

        const activeBanners = Array.isArray(bannersData) ? bannersData.filter(b => b.isActive !== false) : [];
        af.categoryBanners = activeBanners.filter(b => b.position === 'Category Banner');
        af.sidebarBanners = activeBanners.filter(b => b.position === 'Sidebar');
        setAvailableFilters(af);
      })
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false));
  }, [filters.category, filters.search]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [filters, sort]);

  // Derived data
  const filtered = allProducts.filter((p) => {
    if (filters.category !== 'All' && p.category && p.category.toLowerCase() !== filters.category.toLowerCase()) return false;

    if (filters.brands.length > 0 && !filters.brands.includes(p.brand)) return false;
    if (filters.sizes.length > 0 && !p.variants?.some(v => filters.sizes.includes(v.size))) return false;
    if (filters.colors.length > 0 && !p.variants?.some(v => filters.colors.includes(v.color))) return false;
    if (filters.minRating && p.rating < filters.minRating) return false;
    if (filters.inStock && p.stock === 0) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'price_asc') return a.price - b.price;
    if (sort === 'price_desc') return b.price - a.price;
    if (sort === 'popular') return (b.reviews || 0) - (a.reviews || 0);
    return (b._id || '').localeCompare(a._id || '');
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeFiltersCount =
    (filters.category !== 'All' ? 1 : 0) +
    (filters.search ? 1 : 0) +
    filters.brands.length +
    filters.sizes.length +
    filters.colors.length +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.inStock ? 1 : 0);

  const resetAll = useCallback(() => {
    setFilters({ ...INITIAL_FILTERS });
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [availableFilters, setSearchParams]);

  const removeFilter = (type, value) => {
    setFilters(f => {
      const nf = { ...f };
      if (type === 'category') nf.category = 'All';
      if (type === 'search') nf.search = '';
      if (type === 'brand') nf.brands = nf.brands.filter(b => b !== value);
      if (type === 'size') nf.sizes = nf.sizes.filter(s => s !== value);
      if (type === 'color') nf.colors = nf.colors.filter(c => c !== value);
      if (type === 'minRating') nf.minRating = 0;
      if (type === 'inStock') nf.inStock = false;

      return nf;
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ background: S.surface, minHeight: '100vh', paddingTop: 96, paddingBottom: 64 }}>
      <div className="products-container" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
        <Helmet>
          <title>{filters.search ? `Search: ${filters.search}` : filters.category !== 'All' ? `${filters.category} Products` : 'All Products'} — {settings?.siteName || 'Store'}</title>
          <meta name="description" content="Browse our extensive collection of products. Filter by category, brand, price, and more." />
        </Helmet>

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: S.dm, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: S.gold, marginBottom: 8 }}>
            Our Collection
          </p>
          <h1 style={{ fontFamily: S.cm, fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 500, color: S.black, lineHeight: 1.2, margin: 0 }}>
            {filters.search ? `Search: "${filters.search}"` : 'All Products'}
          </h1>
          <p style={{ fontFamily: S.dm, fontSize: 13, color: S.muted, marginTop: 4 }}>
            {filtered.length} products found
          </p>
        </div>

        {/* ── Category Banners ─────────────────────────────────────────────── */}
        {availableFilters.categoryBanners?.length > 0 && (
          <div style={{ marginBottom: 32, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            {availableFilters.categoryBanners.map(b => (
              <div key={b._id || b.id} style={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: `1px solid ${S.border}`, height: 160 }}>
                <a href={b.link || '#'} style={{
                  display: 'block', width: '100%', height: '100%',
                  backgroundImage: b.image ? `url(${b.image})` : b.bg,
                  backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative',
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(17,17,17,0.85), transparent)' }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '65%' }}>
                    <h3 style={{ color: S.white, fontFamily: S.cm, fontSize: 22, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{b.title}</h3>
                    {b.subtitle && <p style={{ color: 'rgba(255,255,255,0.8)', fontFamily: S.dm, fontSize: 13, margin: '0 0 12px' }}>{b.subtitle}</p>}
                    {b.btn && (
                      <span style={{
                        display: 'inline-block', padding: '6px 16px', background: S.white, color: S.black,
                        fontFamily: S.dm, fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '0.1em', borderRadius: 2, width: 'fit-content',
                      }}>{b.btn}</span>
                    )}
                  </div>
                </a>
              </div>
            ))}
          </div>
        )}

        {/* ── Layout ────────────────────────────────────────────────────────── */}
        <div className="products-layout" style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'stretch' }}>
          <Sidebar
            filters={filters}
            setFilters={setFilters}
            onReset={resetAll}
            availableFilters={availableFilters}
            onCategoryChange={(cat) => {
              setFilters(f => ({ ...f, category: cat, brands: [], sizes: [], colors: [], minRating: 0, inStock: false }));
              const params = new URLSearchParams();
              if (cat !== 'All') params.set('category', cat);
              setSearchParams(params, { replace: true });
            }}
          />


          {/* ── Main Content ─────────────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Active Filter Chips */}
            {activeFiltersCount > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <span style={{ fontFamily: S.dm, fontSize: 12, color: S.secondary, display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
                  <FilterX size={13} /> Active Filters:
                </span>

                {filters.search && <Chip label={`Search: ${filters.search}`} onRemove={() => removeFilter('search')} />}
                {filters.category !== 'All' && <Chip label={`Cat: ${filters.category}`} onRemove={() => removeFilter('category')} />}

                {filters.brands.map(b => <Chip key={`b-${b}`} label={`Brand: ${b}`} onRemove={() => removeFilter('brand', b)} />)}
                {filters.sizes.map(s => <Chip key={`s-${s}`} label={`Size: ${s}`} onRemove={() => removeFilter('size', s)} />)}
                {filters.colors.map(c => <Chip key={`c-${c}`} label={`Color: ${c}`} onRemove={() => removeFilter('color', c)} />)}
                {filters.minRating > 0 && <Chip label={`Rating: ${filters.minRating}★+`} onRemove={() => removeFilter('minRating')} />}
                {filters.inStock && <Chip label="In Stock" onRemove={() => removeFilter('inStock')} />}

                <button onClick={resetAll} style={{
                  fontFamily: S.dm, fontSize: 12, color: S.muted, background: 'none',
                  border: 'none', cursor: 'pointer', marginLeft: 4,
                }}>Clear All</button>
              </div>
            )}

            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              <p style={{ fontFamily: S.dm, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: S.muted, margin: 0 }}>
                Showing {filtered.length} Products
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

                <select value={sort} onChange={e => setSort(e.target.value)} style={{
                  background: S.white, border: `1px solid ${S.border}`, borderRadius: 2,
                  padding: '8px 12px', fontFamily: S.dm, fontSize: 13, color: S.black, outline: 'none', cursor: 'pointer', minHeight: 44,
                }}>
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse" style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: 2 }}>
                    <div style={{ aspectRatio: '3/4', background: S.surface }} />
                    <div style={{ padding: 16 }}>
                      <div style={{ height: 8, background: S.surface, borderRadius: 2, width: '33%', marginTop: 12 }} />
                      <div style={{ height: 8, background: S.surface, borderRadius: 2, width: '75%', marginTop: 8 }} />
                      <div style={{ height: 8, background: S.surface, borderRadius: 2, width: '50%', marginTop: 8 }} />
                      <div style={{ height: 8, background: S.surface, borderRadius: 2, width: '25%', marginTop: 8 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <h2 style={{ fontFamily: S.cm, fontSize: 32, fontWeight: 500, color: S.black, marginBottom: 12 }}>
                  Nothing Found
                </h2>
                <p style={{ fontFamily: S.dm, fontSize: 14, color: S.secondary, marginBottom: 24 }}>
                  Try adjusting your filters or search for something different
                </p>
                <button onClick={resetAll} style={{
                  background: 'transparent', border: `1px solid ${S.black}`, color: S.black,
                  fontFamily: S.dm, fontSize: 13, fontWeight: 500, textTransform: 'uppercase',
                  letterSpacing: '0.12em', padding: '10px 28px', borderRadius: 2, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = S.black; e.currentTarget.style.color = S.white; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = S.black; }}
                >Clear Filters</button>
              </div>
            ) : (
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {paginated.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && !loading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 48 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{
                    width: 44, height: 44, minWidth: 44, minHeight: 44, border: `1px solid ${S.border}`, borderRadius: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: S.white, color: S.secondary,
                    cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.35 : 1,
                  }}>
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setPage(n)} style={{
                    width: 44, height: 44, minWidth: 44, minHeight: 44,
                    border: `1px solid ${page === n ? S.black : S.border}`,
                    borderRadius: 2,
                    background: page === n ? S.black : S.white,
                    color: page === n ? S.white : S.secondary,
                    fontFamily: S.dm, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { if (page !== n) { e.currentTarget.style.borderColor = S.black; e.currentTarget.style.color = S.black; } }}
                    onMouseLeave={e => { if (page !== n) { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.color = S.secondary; } }}
                  >{n}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{
                    width: 44, height: 44, minWidth: 44, minHeight: 44, border: `1px solid ${S.border}`, borderRadius: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: S.white, color: S.secondary,
                    cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.35 : 1,
                  }}>
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60 }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70,
                background: '#FFFFFF', borderTop: '1px solid #E8E8E4',
                borderRadius: '4px 4px 0 0', maxHeight: '85vh', overflowY: 'auto',
              }}
            >
              <div style={{ width: 40, height: 4, background: '#E8E8E4', borderRadius: 9999, margin: '16px auto 8px' }} />
              <div style={{ padding: '0 20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 500, color: '#111111', margin: 0 }}>Filters</h3>
                  <button onClick={() => setMobileFiltersOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                    <X size={20} color="#6B6B6B" />
                  </button>
                </div>
                {/* Reuse same filter sections as Sidebar */}
                <FilterSection label="Category" isOpen={true} onToggle={() => {}}>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {['All', ...(availableFilters.categories || [])].map((c) => (
                      <button key={c} onClick={() => { setFilters(f => ({ ...f, category: c })); }} style={{
                        width: '100%', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                        color: filters.category === c ? '#111111' : '#6B6B6B', padding: '10px 0',
                        paddingLeft: filters.category === c ? 12 : 0, background: 'transparent', border: 'none',
                        borderLeft: filters.category === c ? '2px solid #111111' : '2px solid transparent',
                        cursor: 'pointer', fontWeight: filters.category === c ? 500 : 400, minHeight: 44,
                      }}>{c}</button>
                    ))}
                  </div>
                </FilterSection>
                {availableFilters.brands?.length > 0 && (
                  <FilterSection label="Brand" isOpen={true} onToggle={() => {}}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {availableFilters.brands.map((b) => {
                        const on = filters.brands.includes(b);
                        return (
                          <button key={b} onClick={() => setFilters(f => ({ ...f, brands: on ? f.brands.filter(x => x !== b) : [...f.brands, b] }))} style={{
                            border: `1px solid ${on ? '#111111' : '#E8E8E4'}`, background: on ? '#111111' : 'transparent',
                            color: on ? '#FFFFFF' : '#111111', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                            padding: '8px 14px', borderRadius: 2, cursor: 'pointer', minHeight: 44,
                          }}>{b}</button>
                        );
                      })}
                    </div>
                  </FilterSection>
                )}
                {availableFilters.sizes?.length > 0 && (
                  <FilterSection label="Size" isOpen={true} onToggle={() => {}}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {availableFilters.sizes.map((s) => {
                        const on = filters.sizes.includes(s);
                        return (
                          <button key={s} onClick={() => setFilters(f => ({ ...f, sizes: on ? f.sizes.filter(x => x !== s) : [...f.sizes, s] }))} style={{
                            border: `1px solid ${on ? '#111111' : '#E8E8E4'}`, background: on ? '#111111' : 'transparent',
                            color: on ? '#FFFFFF' : '#111111', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                            padding: '8px 14px', borderRadius: 2, cursor: 'pointer', minHeight: 44,
                          }}>{s}</button>
                        );
                      })}
                    </div>
                  </FilterSection>
                )}
              </div>
              <div style={{ position: 'sticky', bottom: 0, background: '#FFFFFF', borderTop: '1px solid #E8E8E4', padding: '16px 20px', display: 'flex', gap: 12 }}>
                <button onClick={resetAll} style={{
                  flex: 1, padding: '12px 0', border: '1px solid #E8E8E4', borderRadius: 2,
                  background: 'transparent', fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                  fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: '#6B6B6B', cursor: 'pointer', minHeight: 44,
                }}>Clear All</button>
                <button onClick={() => setMobileFiltersOpen(false)} style={{
                  flex: 1, padding: '12px 0', border: 'none', borderRadius: 2,
                  background: '#111111', fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                  fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: '#FFFFFF', cursor: 'pointer', minHeight: 44,
                }}>Show Results</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Scoped styles ────────────────────────────────────────────────────── */}
      <style>{`
        .price-range-input {
          position: absolute; top: -6px; left: 0; width: 100%; height: 16px;
          -webkit-appearance: none; appearance: none; background: transparent;
          pointer-events: none; margin: 0; padding: 0; outline: none; cursor: pointer;
        }
        .price-range-input::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 16px; height: 16px; border-radius: 50%;
          background: transparent; border: none; pointer-events: auto; cursor: pointer;
        }
        .price-range-input::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: transparent; border: none; pointer-events: auto; cursor: pointer;
        }
        .price-thumb {
          position: absolute; width: 16px; height: 16px;
          background: #111111; border: 2px solid white;
          border-radius: 50%; top: -6px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.18);
          pointer-events: none; z-index: 5;
        }
        .products-container { padding: 0 16px; }
        @media (min-width: 768px) { .products-container { padding: 0 24px; } }
        @media (min-width: 1024px) {
          .products-layout { flex-direction: row !important; gap: 32px !important; align-items: flex-start !important; }
        }
      `}</style>
    </div>
  );
}
