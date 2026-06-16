import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import useSettingsStore from './store/settingsStore';

// ─── Customer pages ─────────────────────────────────────────────────────────
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Account from './pages/Account';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import About from './pages/About';
import TrackOrder from './pages/TrackOrder';
import ProtectedRoute from './components/ProtectedRoute';

// ─── Admin pages ────────────────────────────────────────────────────────────
import AdminLayout from './admin/AdminLayout';
import AdminProtectedRoute from './admin/components/AdminProtectedRoute';
import AdminLogin from './admin/pages/AdminLogin';
import Dashboard from './admin/pages/Dashboard';
import AdminProducts from './admin/pages/Products';
import AdminOrders from './admin/pages/Orders';
import AdminCustomers from './admin/pages/Customers';
import AdminCategories from './admin/pages/Categories';
import AdminCoupons from './admin/pages/Coupons';
import AdminBanners from './admin/pages/Banners';
import AdminSettings from './admin/pages/Settings';
import AdminReviews from './admin/pages/Reviews';

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
          <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#111111', fontFamily: "'DM Sans', sans-serif" }}>
            <Navbar />
            <CartDrawer />
            <CustomerRoutes />
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
