import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { grantAdminPortalAccess } from "../../lib/adminPortalAccess";
import { getAuthErrorMessage } from "../../lib/authErrors";
import { getPostAuthRedirectPath } from "../../lib/authRedirects";
import "../../styles/auth-pages.css";

function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading: authLoading, isAdmin, isAuthenticated, loginAdmin, resetPassword } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const requestedPath = location.state?.from;
  const redirectTarget = getPostAuthRedirectPath(requestedPath, "/admin/dashboard");

  if (authLoading) {
    return <div className="auth-route-loading">Checking your admin session...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? redirectTarget : "/"} replace />;
  }

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.email || !form.password) {
      setError("Please enter your admin email and password.");
      return;
    }

    try {
      setLoading(true);
      await loginAdmin(form);
      grantAdminPortalAccess();
      navigate(redirectTarget, { replace: true });
    } catch (authError) {
      setError(getAuthErrorMessage(authError, "Unable to sign in to the admin portal right now."));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setMessage("");

    if (!form.email) {
      setError("Enter your admin email first to receive a password reset link.");
      return;
    }

    try {
      setResetLoading(true);
      await resetPassword(form.email);
      setMessage("Password reset email sent. Check your inbox.");
    } catch (authError) {
      setError(getAuthErrorMessage(authError, "Unable to send reset email."));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-route-shell">
      <div className="auth-route-card">
        <div className="auth-route-topbar">
          <span className="auth-route-kicker">Admin Access</span>
          <Link to="/" className="auth-route-utility-link">
            Preview Website
          </Link>
        </div>

        <div className="auth-route-head">
          <span>Admin Portal</span>
          <h1>Admin Login</h1>
          <p>Sign in with an approved admin account to open the dashboard and manage live website data.</p>
        </div>

        <form className="auth-route-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="admin-email">Admin Email</label>
            <input
              id="admin-email"
              type="email"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={form.password}
              onChange={(event) => handleChange("password", event.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {error ? <div className="auth-route-error">{error}</div> : null}
          {message ? <div className="auth-route-message">{message}</div> : null}

          <div className="auth-route-actions">
            <button type="submit" className="auth-primary-button" disabled={loading}>
              {loading ? "Signing in..." : "Open Dashboard"}
            </button>

            <div className="auth-route-inline">
              <span className="auth-inline-status">Forgot your password?</span>
              <button
                type="button"
                className="auth-text-button"
                onClick={handleResetPassword}
                disabled={resetLoading}
              >
                {resetLoading ? "Sending..." : "Reset password"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
