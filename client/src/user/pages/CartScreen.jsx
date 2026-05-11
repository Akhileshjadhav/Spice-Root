import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import Footer from "../../components/Footer";
import { formatPrice, formatProductMeta } from "../../lib/catalog";
import { subscribeToUserOrders } from "../../lib/userOrders";
import OrderHistoryPanel from "../components/OrderHistoryPanel";
import UserNotificationBell from "../components/UserNotificationBell";
import "../../styles/products-listing.css";

function CartScreen() {
  const navigate = useNavigate();
  const { currentUser, userProfile, logoutUser } = useAuth();
  const { items, itemCount, subtotal, increaseQuantity, decreaseQuantity, removeItem } = useCart();
  const [orders, setOrders] = useState([]);
  const firstName =
    userProfile?.firstName ||
    userProfile?.name?.trim().split(/\s+/)[0] ||
    currentUser?.displayName?.trim().split(/\s+/)[0] ||
    "User";
  const deliveryCharge = 0;
  const total = subtotal + deliveryCharge;

  useEffect(() => {
    const unsubscribe = subscribeToUserOrders(
      currentUser?.uid,
      setOrders,
      (error) => console.error("Failed to load cart order history:", error)
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/", { replace: true });
  };

  return (
    <div className="catalog-shell cart-shell">
      <div className="catalog-noise" aria-hidden="true" />

      <header className="catalog-header">
        <Link to="/" className="catalog-brand">
          <span>Spice Root</span>
          <small>Premium Masalas</small>
        </Link>
        <div className="catalog-actions">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <span className="catalog-user-greeting">Hello, {firstName}</span>
          <UserNotificationBell />
          <Link to="/cart" className="catalog-cart-link" aria-label={`Cart (${itemCount})`}>
            <span aria-hidden="true">&#128722;</span>
            <span>{itemCount}</span>
          </Link>
          <Link to="/account">Account</Link>
          <button type="button" className="catalog-text-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="catalog-page cart-page">
        <section className="catalog-hero cart-hero">
          <div className="catalog-title-line" />
          <p>Your cart</p>
          <h1>Review the spices you picked.</h1>
          <span>Update quantities, remove items, and continue when your order looks right.</span>
        </section>

        {items.length === 0 ? (
          <div style={styles.emptyLayout}>
            <section className="catalog-empty cart-empty ember-surface">
              <h2>Your cart is empty right now.</h2>
              <p>Add products from the catalog to see them here instantly.</p>
              <div style={styles.emptyActions}>
                <Link to="/products" className="catalog-button">
                  Add More Products
                </Link>
                <Link to="/" className="catalog-button catalog-button-secondary-alt">
                  Back to Home
                </Link>
              </div>
            </section>

            <OrderHistoryPanel
              orders={orders}
              title="Recent Orders"
              subtitle="Since your cart is empty, here are the orders already saved to your account."
              emptyTitle="No saved orders yet."
              emptyBody="Place an order and it will appear here automatically."
            />
          </div>
        ) : (
          <section className="cart-layout">
            <div className="cart-items-panel ember-surface">
              <div className="cart-panel-head">
                <div>
                  <span className="checkout-section-kicker">Cart Items</span>
                  <h2>Added products</h2>
                </div>
                <span className="checkout-status-pill">{itemCount} items</span>
              </div>

              <div className="cart-item-list">
                {items.map((item) => {
                  const itemTotal = item.price * item.quantity;

                  return (
                    <article key={item.key} className="cart-item-card">
                      <div className="cart-item-media">
                        <img src={item.image} alt={item.name} loading="lazy" decoding="async" />
                      </div>

                      <div className="cart-item-copy">
                        <div className="cart-item-top">
                          <div>
                            <h3>{item.name}</h3>
                            <p>{formatProductMeta(item) || "Standard pack"}</p>
                          </div>
                          <strong>{formatPrice(itemTotal)}</strong>
                        </div>

                        <div className="cart-item-actions">
                          <div className="detail-quantity">
                            <button type="button" onClick={() => decreaseQuantity(item.key)}>
                              -
                            </button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={() => increaseQuantity(item.key)}>
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            className="catalog-text-button cart-remove-button"
                            onClick={() => removeItem(item.key)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <aside className="cart-summary-panel ember-surface">
              <div className="cart-panel-head">
                <div>
                  <span className="checkout-section-kicker">Order Summary</span>
                  <h2>Ready for checkout</h2>
                </div>
              </div>

              <div className="cart-summary-lines">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>
                <div>
                  <span>Delivery Charges</span>
                  <strong>{deliveryCharge === 0 ? "Free" : formatPrice(deliveryCharge)}</strong>
                </div>
                <div className="cart-total-line">
                  <span>Total Amount</span>
                  <strong>{formatPrice(total)}</strong>
                </div>
              </div>

              <p className="checkout-side-note">
                Checkout saves your products and delivery details in Firestore.
              </p>

              <button
                type="button"
                className="catalog-button cart-checkout-button"
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout
              </button>

              <button
                type="button"
                className="catalog-button catalog-button-secondary-alt"
                onClick={() => navigate("/products")}
              >
                Add More Products
              </button>
            </aside>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

const styles = {
  emptyLayout: {
    display: "grid",
    gap: "24px",
  },
  emptyActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
};

export default CartScreen;
