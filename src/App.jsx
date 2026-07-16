import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import useSettingsStore from './store/settingsStore';

// ─── Always-loaded components (above the fold) ────────────────────────────────
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import WhatsAppButton from './components/WhatsAppButton';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';

// ─── Lazy-loaded customer pages ──────────────────────────────────────────────
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Account = lazy(() => import('./pages/Account'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const About = lazy(() => import('./pages/About'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));
const ReturnPolicy = lazy(() => import('./pages/ReturnPolicy'));
const Contact = lazy(() => import('./pages/Contact'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));

// ─── Lazy-loaded admin pages (never loaded for regular visitors) ─────────────
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminProtectedRoute = lazy(() => import('./admin/components/AdminProtectedRoute'));
const AdminLogin = lazy(() => import('./admin/pages/AdminLogin'));
const Dashboard = lazy(() => import('./admin/pages/Dashboard'));
const AdminProducts = lazy(() => import('./admin/pages/Products'));
const AdminOrders = lazy(() => import('./admin/pages/Orders'));
const AdminCustomers = lazy(() => import('./admin/pages/Customers'));
const AdminCategories = lazy(() => import('./admin/pages/Categories'));
const AdminCoupons = lazy(() => import('./admin/pages/Coupons'));
const AdminBanners = lazy(() => import('./admin/pages/Banners'));
const AdminSettings = lazy(() => import('./admin/pages/Settings'));
const AdminReviews = lazy(() => import('./admin/pages/Reviews'));
const AdminBlogList = lazy(() => import('./admin/pages/AdminBlogList'));
const AdminBlogForm = lazy(() => import('./admin/pages/AdminBlogForm'));
const AdminBlogCategories = lazy(() => import('./admin/pages/AdminBlogCategories'));
const AdminBlogSubscribers = lazy(() => import('./admin/pages/AdminBlogSubscribers'));

// ─── Loading spinner ─────────────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 32, height: 32, border: '3px solid #E8E8E4', borderTopColor: '#111111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── Error Boundary — silently retries once, shows error only on 2nd crash ───
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught:', error, info?.componentStack);
    // Silent auto-retry on first crash
    if (this.state.retryCount === 0) {
      this.setState({ hasError: false, retryCount: 1 });
    }
  }
  render() {
    if (this.state.hasError && this.state.retryCount > 0) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
          background: '#0D0D0B', color: '#F5F0E8',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <p style={{ fontSize: 18, fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>Something went wrong</p>
          <button
            onClick={() => { this.setState({ hasError: false, retryCount: 0 }); window.location.reload(); }}
            style={{
              padding: '12px 32px', background: '#C9A96E', color: '#0D0D0B',
              border: 'none', borderRadius: 2, fontSize: 13, fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
            }}
          >Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Page transition wrapper ───────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
};

function CustomerRoutes() {
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <Routes location={location}>
          <Route path="/"             element={<Home />} />
          <Route path="/products"     element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/about"        element={<About />} />
          <Route path="/track-order"  element={<TrackOrder />} />
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/checkout"     element={<Checkout />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/contact"      element={<Contact />} />
          <Route path="/account"      element={<ProtectedRoute><Account defaultTab="profile" /></ProtectedRoute>} />
          <Route path="/profile"      element={<ProtectedRoute><Account defaultTab="profile" /></ProtectedRoute>} />
          <Route path="/orders"       element={<ProtectedRoute><Account defaultTab="orders" /></ProtectedRoute>} />
          <Route path="/blog"         element={<Blog />} />
          <Route path="/blog/:slug"   element={<BlogPost />} />

          <Route path="*" element={
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#FFFFFF' }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 120, fontWeight: 500, color: '#E8E8E4', margin: 0, lineHeight: 1 }}>404</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 500, color: '#111111', margin: 0 }}>Page not found</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#9E9E9E', margin: 0 }}>The page you're looking for doesn't exist.</p>
              <a href="/" style={{ marginTop: 8, display: 'inline-block', padding: '12px 28px', background: '#111111', color: '#FFFFFF', borderRadius: 2, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Go Home
              </a>
            </div>
          } />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const fetchSettings = useSettingsStore(s => s.fetchSettings);
  const settings = useSettingsStore(s => s.settings);
  const siteName = settings?.siteName || 'Store';

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update document title as soon as settings load
  useEffect(() => {
    if (settings?.metaTags?.title) {
      document.title = settings.metaTags.title;
    } else if (settings?.siteName) {
      document.title = settings.siteName;
    }
  }, [settings?.siteName, settings?.metaTags?.title]);

  const pageTitle = settings?.metaTags?.title || siteName;
  const pageDescription = settings?.metaTags?.description || `Shop premium products at ${siteName}. Quality guaranteed with free delivery.`;

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        {settings?.metaTags?.keywords && <meta name="keywords" content={settings.metaTags.keywords} />}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.origin} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={settings?.metaTags?.ogImage || `${window.location.origin}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={settings?.metaTags?.ogImage || `${window.location.origin}/og-image.png`} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: siteName,
          url: window.location.origin,
          logo: settings?.logo || `${window.location.origin}/og-image.png`,
          description: pageDescription,
          contactPoint: settings?.contactInfo?.phone ? {
            '@type': 'ContactPoint',
            telephone: settings.contactInfo.phone,
            contactType: 'customer service',
            availableLanguage: ['English', 'Urdu']
          } : undefined,
          sameAs: (settings?.socialLinks || []).map(s => s.url).filter(Boolean)
        })}</script>
      </Helmet>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/aytsam-abdullah/login" element={<AdminLogin />} />
          <Route path="/aytsam-abdullah" element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"  element={<Dashboard />} />
              <Route path="products"   element={<AdminProducts />} />
              <Route path="orders"     element={<AdminOrders />} />
              <Route path="customers"  element={<AdminCustomers />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="coupons"    element={<AdminCoupons />} />
              <Route path="banners"    element={<AdminBanners />} />
              <Route path="settings"   element={<AdminSettings />} />
              <Route path="reviews"    element={<AdminReviews />} />
              <Route path="blog"       element={<AdminBlogList />} />
              <Route path="blog/create" element={<AdminBlogForm />} />
              <Route path="blog/edit/:id" element={<AdminBlogForm />} />
              <Route path="blog/categories" element={<AdminBlogCategories />} />
              <Route path="blog/subscribers" element={<AdminBlogSubscribers />} />
            </Route>
          </Route>
          <Route path="/*" element={
            <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#111111', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden', width: '100%', display: 'flex', flexDirection: 'column' }}>
              <Navbar />
              <CartDrawer />
              <WhatsAppButton />
              <div style={{ flex: 1 }}>
                <CustomerRoutes />
              </div>
              <Footer />
            </div>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
