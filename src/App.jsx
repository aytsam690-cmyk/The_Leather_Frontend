import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import useSettingsStore from './store/settingsStore';

// ─── Always-loaded components (above the fold) ────────────────────────────────
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import WhatsAppButton from './components/WhatsAppButton';
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

// ─── Loading spinner ─────────────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 32, height: 32, border: '3px solid #E8E8E4', borderTopColor: '#111111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

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
          <Route path="/account"      element={<ProtectedRoute><Account defaultTab="profile" /></ProtectedRoute>} />
          <Route path="/profile"      element={<ProtectedRoute><Account defaultTab="profile" /></ProtectedRoute>} />
          <Route path="/orders"       element={<ProtectedRoute><Account defaultTab="orders" /></ProtectedRoute>} />

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

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminProtectedRoute />}>
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
            </Route>
          </Route>
          <Route path="/*" element={
            <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#111111', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden', width: '100%' }}>
              <Navbar />
              <CartDrawer />
              <WhatsAppButton />
              <CustomerRoutes />
            </div>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
