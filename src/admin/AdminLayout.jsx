import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, FolderTree,
  Tag, Image, Settings, ChevronLeft, ChevronRight, Bell,
  Search, LogOut, User, Menu, X, Home, Star, FileText, Tags
} from 'lucide-react';
import useAdminAuthStore from './store/adminAuthStore';
import useAdminStore from './store/adminStore';

const CORAL = '#111111';

// Hook to detect desktop (lg breakpoint = 1024px)
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isDesktop;
}

const NAV_LINKS = [
  { path: '/aytsam-abdullah',          label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { path: '/aytsam-abdullah/products', label: 'Products',   icon: Package },
  { path: '/aytsam-abdullah/orders',   label: 'Orders',     icon: ShoppingCart },
  { path: '/aytsam-abdullah/customers',label: 'Customers',  icon: Users },
  { path: '/aytsam-abdullah/categories',label:'Categories', icon: FolderTree },
  { path: '/aytsam-abdullah/coupons',  label: 'Coupons',    icon: Tag },
  { path: '/aytsam-abdullah/reviews',  label: 'Reviews',    icon: Star },
  { path: '/aytsam-abdullah/blogs',    label: 'Blog',       icon: FileText },
  { path: '/aytsam-abdullah/blog-taxonomy', label: 'Blog Taxonomy', icon: Tags },
  { path: '/aytsam-abdullah/banners',  label: 'Banners',    icon: Image },
  { path: '/aytsam-abdullah/settings', label: 'Settings',   icon: Settings },
];

// ─── Notification Bell ────────────────────────────────────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, markRead, fetchNotifications, refreshNotifications } = useAdminStore();
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch real notifications on first open
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => { refreshNotifications(); fetchNotifications(); }, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-sm hover:bg-[#F8F8F6] transition-all text-[#6B6B6B]">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
            style={{ background: '#ef4444' }}>
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-sm shadow-2xl border border-[#E8E8E4] overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E8E4]">
            <p className="font-bold text-[#111111] text-sm">Notifications</p>
            <div className="flex items-center gap-3">
              <button onClick={() => { refreshNotifications(); fetchNotifications(); }} className="text-xs font-medium text-[#9E9E9E] hover:text-[#111111]" title="Refresh">↻</button>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs font-medium hover:underline" style={{ color: CORAL }}>
                  Mark all read
                </button>
              )}
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="text-sm text-[#9E9E9E] text-center py-6">Loading...</p>
            )}
            {notifications.map((n) => (
              <button key={n.id} onClick={() => markRead(n.id)}
                className={`w-full text-left px-4 py-3 border-b border-[#E8E8E4] hover:bg-[#F8F8F6] transition-colors ${!n.read ? 'bg-[#F8F8F6]/60' : ''}`}>
                <div className="flex items-start gap-3">
                  {!n.read && <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: CORAL }} />}
                  {n.read && <div className="w-2 h-2 mt-1.5 shrink-0" />}
                  <div>
                    <p className="text-sm text-[#111111]">{n.text}</p>
                    <p className="text-xs text-[#9E9E9E] mt-0.5">{n.time}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user, logout } = useAdminAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/aytsam-abdullah/login'); };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onMobileClose} />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen bg-white flex flex-col z-40 transition-all duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{
          width: collapsed ? 72 : 260,
          boxShadow: '2px 0 20px rgba(0,0,0,0.06)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-[#E8E8E4] shrink-0">
          {!collapsed && (
            <Link to="/aytsam-abdullah" className="text-lg font-black text-[#111111]">
              Admin<span style={{ color: CORAL }}>.</span>Panel
            </Link>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-sm flex items-center justify-center mx-auto" style={{ background: CORAL }}>
              <LayoutDashboard size={16} className="text-white" />
            </div>
          )}
          <button onClick={onToggle}
            className="hidden lg:flex w-7 h-7 rounded-sm items-center justify-center hover:bg-[#F8F8F6] transition-all text-[#6B6B6B] shrink-0">
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          {NAV_LINKS.map(({ path, label, icon: Icon, end }) => (
            <NavLink key={path} to={path} end={end}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-sm mb-0.5 text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'text-white'
                    : 'text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F8F8F6]'
                }`
              }
              style={({ isActive }) => isActive ? { background: CORAL } : {}}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
              {/* Tooltip on collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1A1A1A] text-white text-xs rounded-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {label}
                  <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 border-4 border-transparent border-r-slate-800" />
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: user */}
        <div className="border-t border-[#E8E8E4] p-3 shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-3 p-2 rounded-sm hover:bg-[#F8F8F6] transition-all">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: CORAL }}>
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#111111] truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-[#9E9E9E]">Administrator</p>
              </div>
              <button onClick={handleLogout} title="Logout"
                className="text-[#9E9E9E] hover:text-[#9B2226] transition-colors p-1">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} title="Logout"
              className="w-full flex items-center justify-center py-2 text-[#9E9E9E] hover:text-[#9B2226] transition-colors">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ collapsed, onMobileOpen }) {
  const isDesktop = useIsDesktop();
  const { user, logout } = useAdminAuthStore();
  const { breadcrumbs } = useAdminStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const navigate = useNavigate();
  const userRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (userRef.current && !userRef.current.contains(e.target)) setUserMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <header
      className="fixed top-0 right-0 bg-white border-b border-[#E8E8E4] flex items-center px-4 h-16 z-20 transition-all duration-300"
      style={{ left: isDesktop ? (collapsed ? 72 : 260) : 0 }}
    >
      {/* Mobile hamburger */}
      <button onClick={onMobileOpen} className="lg:hidden p-2 rounded-sm hover:bg-[#F8F8F6] transition-all text-[#6B6B6B] mr-3">
        <Menu size={20} />
      </button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        <Home size={14} className="text-[#9E9E9E] shrink-0" />
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="text-[#9E9E9E]">/</span>
            {i === breadcrumbs.length - 1 ? (
              <span className="font-semibold text-[#111111] truncate">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="text-[#9E9E9E] hover:text-[#6B6B6B] transition-colors truncate">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search */}
        <div className="relative flex items-center">
          <div className={`flex items-center gap-2 border border-[#D0D0CA] rounded-sm px-3 py-2 transition-all duration-300 ${searchOpen ? 'w-52' : 'w-9'} overflow-hidden`}>
            <Search size={16} className="text-[#9E9E9E] shrink-0 cursor-pointer" onClick={() => setSearchOpen(!searchOpen)} />
            {searchOpen && (
              <input autoFocus placeholder="Search…" onBlur={() => setSearchOpen(false)}
                className="text-sm outline-none text-[#111111] w-full bg-transparent" />
            )}
          </div>
        </div>

        <NotificationBell />

        {/* User dropdown */}
        <div className="relative" ref={userRef}>
          <button onClick={() => setUserMenu(!userMenu)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-[#F8F8F6] transition-all">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: CORAL }}>
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className="text-sm font-semibold text-[#111111] hidden sm:block">{user?.name || 'Admin'}</span>
          </button>
          {userMenu && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-sm shadow-2xl border border-[#E8E8E4] overflow-hidden z-50">
              <Link to="/aytsam-abdullah/settings" onClick={() => setUserMenu(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-[#6B6B6B] hover:bg-[#F8F8F6] transition-colors">
                <User size={14} /> Profile
              </Link>
              <hr className="border-[#E8E8E4]" />
              <button onClick={() => { logout(); navigate('/aytsam-abdullah/login'); }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#9B2226] hover:bg-[#FEF2F2] transition-colors">
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const { sidebarCollapsed, toggleSidebar } = useAdminStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useIsDesktop();

  return (
    <div className="min-h-screen bg-[#F8F8F6]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Header collapsed={sidebarCollapsed} onMobileOpen={() => setMobileOpen(true)} />
      <main
        className="transition-all duration-300 pt-16"
        style={{ marginLeft: isDesktop ? (sidebarCollapsed ? 72 : 260) : 0 }}
      >
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
