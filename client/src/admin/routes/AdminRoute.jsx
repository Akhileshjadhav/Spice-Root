import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { hasAdminPortalAccess } from "../../lib/adminPortalAccess";
import "../../styles/auth-pages.css";

function AdminRoute({ children }) {
  const { loading, isAdmin, isAuthenticated } = useAuth();
  const location = useLocation();
  const redirectPath = `${location.pathname}${location.search}${location.hash}`;

  if (loading) {
    return <div className="auth-route-loading">Checking your session...</div>;
  }

  if (!hasAdminPortalAccess()) {
    return <Navigate to="/" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: redirectPath }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
