import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import UserNotificationBell from "./UserNotificationBell";

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "products", label: "Products" },
  { id: "features", label: "Features" },
  { id: "about", label: "About" },
  { id: "testimonials", label: "Testimonials" },
  { id: "contact", label: "Contact" },
];

function Navbar({ activeSection = "home", onNavigate, onLogout }) {
  const { currentUser, isAdmin, isAuthenticated, loading, logoutUser, userProfile } = useAuth();
  const { itemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const showCustomerSession = isAuthenticated && !isAdmin;
  const firstName =
    userProfile?.firstName ||
    userProfile?.name?.trim().split(/\s+/)[0] ||
    currentUser?.displayName?.trim().split(/\s+/)[0] ||
    "User";

  const handleNavClick = (id) => {
    setIsMenuOpen(false);

    if (onNavigate) {
      onNavigate(id);
    }
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logoutUser();

    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="ember-navbar">
      <div className="ember-navbar-inner">
        <div className="ember-navbar-media" aria-hidden="true" />

        <Link to="/" className="ember-brand" onClick={() => handleNavClick("home")}>
          <div>
            <strong>Spice Root</strong>
            <small>Premium Masalas</small>
          </div>
        </Link>

        <nav className="ember-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            item.id === "products" ? (
              <Link
                key={item.id}
                to="/products"
                className={activeSection === item.id ? "active" : ""}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.id}
                type="button"
                className={activeSection === item.id ? "active" : ""}
                onClick={() => handleNavClick(item.id)}
              >
                {item.label}
              </button>
            )
          ))}
        </nav>

        <div className="ember-nav-actions">
          {loading ? null : showCustomerSession ? (
            <>
              <span className="ember-user-greeting">{`Hello, ${firstName}`}</span>
              <UserNotificationBell variant="ember" />
              <Link
                to="/cart"
                className="ember-icon-button"
                aria-label={`View cart (${itemCount} item${itemCount === 1 ? "" : "s"})`}
              >
                <span aria-hidden="true">&#128722;</span>
              </Link>
              <button type="button" className="ember-button ember-button-primary ember-small-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="ember-button ember-button-ghost ember-small-button">
                Login
              </Link>
              <Link to="/register" className="ember-button ember-button-primary ember-small-button">
                Register
              </Link>
            </>
          )}

          <button
            type="button"
            className={`ember-menu-toggle${isMenuOpen ? " open" : ""}`}
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className={`ember-mobile-nav${isMenuOpen ? " open" : ""}`}>
        {loading ? null : showCustomerSession ? (
          <div className="ember-mobile-user-line">{`Hello, ${firstName}`}</div>
        ) : null}

        {NAV_ITEMS.map((item) => (
          item.id === "products" ? (
            <Link key={item.id} to="/products" onClick={() => setIsMenuOpen(false)}>
              {item.label}
            </Link>
          ) : (
            <button key={item.id} type="button" onClick={() => handleNavClick(item.id)}>
              {item.label}
            </button>
          )
        ))}

        {loading ? null : showCustomerSession ? (
          <>
            <Link
              to="/cart"
              className="ember-mobile-icon-button"
              aria-label={`View cart (${itemCount} item${itemCount === 1 ? "" : "s"})`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span aria-hidden="true">&#128722;</span>
              <span>Cart</span>
            </Link>
            <UserNotificationBell variant="ember" />
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setIsMenuOpen(false)}>
              Login
            </Link>
            <Link to="/register" onClick={() => setIsMenuOpen(false)}>
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
