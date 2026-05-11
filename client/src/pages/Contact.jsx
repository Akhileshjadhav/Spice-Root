import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { useAuth } from "../context/useAuth";
import { db, serverTimestamp } from "../firebase";
import UserNotificationBell from "../user/components/UserNotificationBell";
import "../styles/products-listing.css";

function Contact() {
  const navigate = useNavigate();
  const { currentUser, isAdmin, isAuthenticated, loading, logoutUser, userProfile } = useAuth();
  const showCustomerSession = isAuthenticated && !isAdmin;
  const defaultName =
    userProfile?.name || userProfile?.firstName || currentUser?.displayName || "";
  const defaultEmail = userProfile?.email || currentUser?.email || "";
  const [form, setForm] = useState({
    name: defaultName,
    email: defaultEmail,
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitState, setSubmitState] = useState({ loading: false, error: "", success: "" });
  const firstName =
    userProfile?.firstName ||
    userProfile?.name?.trim().split(/\s+/)[0] ||
    currentUser?.displayName?.trim().split(/\s+/)[0] ||
    "User";

  const handleLogout = async () => {
    await logoutUser();
    navigate("/", { replace: true });
  };

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setSubmitState((current) => ({ ...current, error: "", success: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Please enter your name.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!form.message.trim()) {
      nextErrors.message = "Please share your message with us.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSubmitState({ loading: true, error: "", success: "" });

      await addDoc(collection(db, "contactSubmissions"), {
        userId: currentUser?.uid || null,
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        status: "new",
        adminSeen: false,
        adminReply: "",
        adminReplyAt: null,
        userReplySeen: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setForm((current) => ({
        ...current,
        message: "",
      }));
      setSubmitState({
        loading: false,
        error: "",
        success: "Your message has been saved. We will get back to you soon.",
      });
    } catch (error) {
      console.error("Failed to save contact submission:", error);
      setSubmitState({
        loading: false,
        error: "We could not save your message right now. Please try again.",
        success: "",
      });
    }
  };

  return (
    <div className="catalog-shell contact-shell">
      <div className="catalog-noise" aria-hidden="true" />

      <header className="catalog-header">
        <Link to="/" className="catalog-brand">
          <span>Spice Root</span>
          <small>Premium Masalas</small>
        </Link>
        <div className="catalog-actions">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          {loading ? null : showCustomerSession ? (
            <>
              <span className="catalog-user-greeting">{`Hello, ${firstName}`}</span>
              <UserNotificationBell />
              <button type="button" className="catalog-text-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </header>

      <main className="catalog-page">
        <section className="catalog-hero">
          <div className="catalog-title-line" />
          <p>Contact Us</p>
          <h1>Send your message directly to the Spice Root team.</h1>
          <span>Your email is prefilled from your account when available, and you can still edit it before sending.</span>
        </section>

        <form className="checkout-form-panel ember-surface" onSubmit={handleSubmit}>
          <div className="cart-panel-head">
            <div>
              <span className="checkout-section-kicker">We are listening</span>
              <h2>Tell us how we can help</h2>
            </div>
          </div>

          <div className="checkout-form-grid">
            <label>
              <span>Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => handleChange("name", event.target.value)}
                placeholder="Your name"
              />
              {errors.name ? <small>{errors.name}</small> : null}
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => handleChange("email", event.target.value)}
                placeholder="your@email.com"
              />
              {errors.email ? <small>{errors.email}</small> : null}
            </label>

            <label className="checkout-field-full">
              <span>Your message for us</span>
              <textarea
                rows="6"
                value={form.message}
                onChange={(event) => handleChange("message", event.target.value)}
                placeholder="How can we help you today?"
              />
              {errors.message ? <small>{errors.message}</small> : null}
            </label>
          </div>

          {submitState.error ? <div className="auth-route-error">{submitState.error}</div> : null}
          {submitState.success ? <div className="auth-route-message">{submitState.success}</div> : null}

          <button type="submit" className="catalog-button cart-checkout-button" disabled={submitState.loading}>
            {submitState.loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}

export default Contact;
