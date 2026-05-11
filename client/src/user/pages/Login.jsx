import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { getAuthErrorMessage } from "../../lib/authErrors";
import { getPostAuthRedirectPath } from "../../lib/authRedirects";
import "../../styles/auth-pages.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading: authLoading, isAdmin, isAuthenticated, loginUser } = useAuth();
  const hasCustomerSession = isAuthenticated && !isAdmin;
  const [form, setForm] = useState({
    email: location.state?.email || "",
    password: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);
  const requestedPath = location.state?.from;
  const redirectTarget = getPostAuthRedirectPath(requestedPath);

  if (authLoading) {
    return <div className="auth-route-loading">Checking your session...</div>;
  }

  if (hasCustomerSession) {
    return <Navigate to={redirectTarget} replace />;
  }

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const { user } = await loginUser(form);
      if (!user.emailVerified) {
        setMessage("Logged in successfully. Your email is not verified yet, so please check your inbox.");
      }
      navigate(getPostAuthRedirectPath(requestedPath), { replace: true });
    } catch (authError) {
      setError(getAuthErrorMessage(authError, "Unable to sign in right now."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-route-shell">
      <div className="auth-route-card">
        <div className="auth-route-tabs" role="tablist" aria-label="Authentication tabs">
          <Link to="/register" className="auth-route-tab">Register</Link>
          <Link to="/login" className="auth-route-tab active" aria-current="page">Login</Link>
        </div>

        <div className="auth-route-head">
          <span>Login</span>
          <h1>Welcome back</h1>
          <p>Sign in with your email and password to continue to your account.</p>
        </div>

        <form className="auth-route-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
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
              {loading ? "Signing in..." : "Login"}
            </button>

            <div className="auth-route-inline">
              <span className="auth-inline-status">Need help signing in?</span>
              <Link
                to="/forgot-password"
                state={{ email: form.email }}
                className="auth-inline-link"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
        </form>

        <p className="auth-route-footer">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
