import { Navigate, Outlet } from 'react-router-dom';
import useAdminAuthStore from '../store/adminAuthStore';

export default function AdminProtectedRoute() {
  const { user, token } = useAdminAuthStore();

  // No token at all — go to admin login
  if (!token) {
    return <Navigate to="/aytsam-abdullah/login" replace />;
  }

  // Token exists but user is not loaded or not admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/aytsam-abdullah/login" replace />;
  }

  return <Outlet />;
}
