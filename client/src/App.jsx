import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import StartupLanding from "./user/pages/StartupLanding";
import ProtectedRoute from "./user/routes/ProtectedRoute";
import AdminRoute from "./admin/routes/AdminRoute";
import AdminRoutes from "./admin/routes/AdminRoutes";
import { clearAdminPortalAccess } from "./lib/adminPortalAccess";

const Account = lazy(() => import("./user/pages/Account"));
const AdminLogin = lazy(() => import("./admin/pages/AdminLogin"));
const CartPage = lazy(() => import("./user/pages/CartScreen"));
const CheckoutPage = lazy(() => import("./user/pages/CheckoutScreen"));
const ContactPage = lazy(() => import("./pages/Contact"));
const ForgotPassword = lazy(() => import("./user/pages/ForgotPassword"));
const Login = lazy(() => import("./user/pages/Login"));
const Register = lazy(() => import("./user/pages/Register"));
const ProductDetailPage = lazy(() => import("./user/pages/ProductDetailPage"));
const ProductsPage = lazy(() => import("./user/pages/ProductsPage"));

function RouteLoader() {
  return <div className="auth-route-loading">Loading...</div>;
}

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!location.pathname.startsWith("/admin")) {
      clearAdminPortalAccess();
    }
  }, [location.pathname]);

  return (
    <Routes location={location} key={`${location.pathname}${location.hash}`}>
      {/* CUSTOMER WEBSITE ROUTES */}
      <Route path="/" element={<StartupLanding />} />

      <Route
        path="/products"
        element={
          <Suspense fallback={<RouteLoader />}>
            <ProductsPage />
          </Suspense>
        }
      />

      <Route
        path="/products/:productId"
        element={
          <Suspense fallback={<RouteLoader />}>
            <ProductDetailPage />
          </Suspense>
        }
      />

      <Route
        path="/cart"
        element={
          <Suspense fallback={<RouteLoader />}>
            <ProtectedRoute allowAdmins={false}>
              <CartPage />
            </ProtectedRoute>
          </Suspense>
        }
      />

      <Route
        path="/checkout"
        element={
          <Suspense fallback={<RouteLoader />}>
            <ProtectedRoute allowAdmins={false}>
              <CheckoutPage />
            </ProtectedRoute>
          </Suspense>
        }
      />

      <Route
        path="/contact"
        element={
          <Suspense fallback={<RouteLoader />}>
            <ContactPage />
          </Suspense>
        }
      />

      <Route
        path="/login"
        element={
          <Suspense fallback={<RouteLoader />}>
            <Login />
          </Suspense>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <Suspense fallback={<RouteLoader />}>
            <ForgotPassword />
          </Suspense>
        }
      />

      <Route
        path="/register"
        element={
          <Suspense fallback={<RouteLoader />}>
            <Register />
          </Suspense>
        }
      />

      <Route path="/get-started" element={<Navigate to="/register" replace />} />

      <Route
        path="/admin/login"
        element={
          <Suspense fallback={<RouteLoader />}>
            <AdminLogin />
          </Suspense>
        }
      />

      <Route
        path="/account"
        element={
          <Suspense fallback={<RouteLoader />}>
            <ProtectedRoute allowAdmins={false}>
              <Account />
            </ProtectedRoute>
          </Suspense>
        }
      />

      {/* FULL ADMIN PANEL ROUTES */}
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<RouteLoader />}>
            <AdminRoute>
              <AdminRoutes />
            </AdminRoute>
          </Suspense>
        }
      />

      {/* DEFAULT FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
