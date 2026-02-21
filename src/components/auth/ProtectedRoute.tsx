import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/shared/LoadingScreen';

interface ProtectedRouteProps {
  allowedRoles: AppRole[];
  redirectTo?: string;
  children?: React.ReactNode;
}

export function ProtectedRoute({ 
  allowedRoles, 
  redirectTo = '/auth',
  children 
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check if user has the required role
  if (!role || !allowedRoles.includes(role)) {
    // Redirect to appropriate page based on user's actual role
    if (role === 'buyer') {
      return <Navigate to="/buyer" replace />;
    } else if (role === 'courier') {
      return <Navigate to="/courier" replace />;
    } else if (role && ['super_admin', 'admin_gudang', 'admin_keuangan'].includes(role)) {
      return <Navigate to="/admin" replace />;
    }
    // No role assigned, redirect to auth
    return <Navigate to="/auth" replace />;
  }

  // User is authenticated and has the required role
  return children ? <>{children}</> : <Outlet />;
}

// Convenience components for specific role groups
export function AdminRoute({ children }: { children?: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['super_admin', 'admin_gudang', 'admin_keuangan']}>
      {children}
    </ProtectedRoute>
  );
}

export function BuyerRoute({ children }: { children?: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['buyer']}>
      {children}
    </ProtectedRoute>
  );
}

export function CourierRoute({ children }: { children?: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['courier']}>
      {children}
    </ProtectedRoute>
  );
}
