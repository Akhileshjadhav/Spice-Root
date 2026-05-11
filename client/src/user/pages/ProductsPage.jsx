import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../../components/Footer";
import TiltCard from "../components/TiltCard";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import { subscribeToReviews } from "../../lib/adminStore";
import { fallbackCatalog, formatPrice, subscribeToCatalog } from "../../lib/catalog";
import UserNotificationBell from "../components/UserNotificationBell";
import "../../styles/products-listing.css";

const MotionArticle = motion.article;

const revealCard = (index) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.68, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] },
});

function ProductsPage() {
  const navigate = useNavigate();
  const { currentUser, isAdmin, isAuthenticated, loading: authLoading, logoutUser, userProfile } = useAuth();
  const { itemCount } = useCart();
  const showCustomerSession = isAuthenticated && !isAdmin;
  const [products, setProducts] = useState(fallbackCatalog);
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState("loading");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const deferredQuery = useDeferredValue(query);
  const firstName =
    userProfile?.firstName ||
    userProfile?.name?.trim().split(/\s+/)[0] ||
    currentUser?.displayName?.trim().split(/\s+/)[0] ||
    "";

  useEffect(() => {
    const unsubscribe = subscribeToCatalog(
      (catalog) => {
        setProducts(catalog);
        setStatus("ready");
      },
      () => {
        setProducts(fallbackCatalog);
        setStatus("ready");
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToReviews(
      setReviews,
      (error) => console.error("Failed to load product listing reviews:", error)
    );

    return () => unsubscribe();
  }, []);
  const categories = useMemo(
    () => ["All", ...new Set(products.map((item) => item.category))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return products.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesSearch =
        !normalizedQuery ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [category, deferredQuery, products]);
  const approvedReviewLookup = useMemo(
    () =>
      reviews
        .filter((item) => item.type === "product" && item.status === "Approved" && item.productId)
        .reduce((lookup, item) => {
          const current = lookup.get(item.productId) || { total: 0, count: 0 };
          current.total += item.rating;
          current.count += 1;
          lookup.set(item.productId, current);
          return lookup;
        }, new Map()),
    [reviews]
  );

  const handleLogout = async () => {
    await logoutUser();
    navigate("/", { replace: true });
  };

  return (
    <div className="catalog-shell">
      <div className="catalog-noise" aria-hidden="true" />

      <header className="catalog-header">
        <Link to="/" className="catalog-brand">
          <span>Spice Root</span>
          <small>Premium Masalas</small>
        </Link>
        <div className="catalog-actions">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          {authLoading ? null : showCustomerSession ? (
            <>
              <span className="catalog-user-greeting">{`Hello, ${firstName || "User"}`}</span>
              <UserNotificationBell />
              <Link
                to="/cart"
                className="catalog-icon-button"
                aria-label={`View cart (${itemCount} item${itemCount === 1 ? "" : "s"})`}
              >
                <span aria-hidden="true">&#128722;</span>
              </Link>
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
          <p>Product List</p>
          <h1>Premium spices and pantry essentials, now synced with the live catalog.</h1>
          <span>
            Browse the original Spice Root collection plus any new products added by the admin team.
          </span>
        </section>

        <section className="catalog-controls ember-surface">
          <label>
            <span>Search products</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products..."
            />
          </label>

          <label>
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <div className="catalog-count">
            <strong>{filteredProducts.length}</strong>
            <span>products visible</span>
          </div>
        </section>

        {status === "loading" ? (
          <div className="catalog-empty">Loading products...</div>
        ) : null}

        {status === "ready" ? (
          <section className="catalog-grid">
            {filteredProducts.map((product, index) => (
              <MotionArticle key={product.id} {...revealCard(index)}>
                <TiltCard className="catalog-card ember-surface" maxTilt={12} scale={1.03}>
                  <div className="catalog-card-inner">
                    <div className="catalog-card-image">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading={index < 6 ? "eager" : "lazy"}
                        fetchPriority={index < 2 ? "high" : "auto"}
                        decoding="async"
                      />
                    </div>
                    <div className="catalog-card-copy">
                      <h2>{product.name}</h2>
                      <p style={styles.ratingLine}>
                        {approvedReviewLookup.has(product.id)
                          ? `${(approvedReviewLookup.get(product.id).total / approvedReviewLookup.get(product.id).count).toFixed(1)} / 5`
                          : `${product.rating.toFixed(1)} / 5`}{" "}
                        <span>
                          ({approvedReviewLookup.get(product.id)?.count || product.ratingCount || 0} reviews)
                        </span>
                      </p>
                      <p>
                        From {formatPrice(product.price)} <span>({product.unit})</span>
                      </p>
                    </div>
                    <Link className="catalog-button" to={`/products/${product.id}`}>
                      View Details
                    </Link>
                  </div>
                </TiltCard>
              </MotionArticle>
            ))}
          </section>
        ) : null}

        {status === "ready" && filteredProducts.length === 0 ? (
          <div className="catalog-empty">No products match that search yet.</div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

const styles = {
  ratingLine: {
    margin: "0 0 6px",
    color: "rgba(249, 234, 204, 0.74)",
    fontSize: "0.9rem",
  },
};

export default ProductsPage;
