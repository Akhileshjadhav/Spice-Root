import { useEffect, useMemo, useState } from "react";
import { collection, doc, setDoc } from "firebase/firestore";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import Footer from "../../components/Footer";
import { db, serverTimestamp } from "../../firebase";
import { formatPrice, formatProductMeta } from "../../lib/catalog";
import {
  createOptimisticOrder,
  mergeOrdersWithCurrent,
  subscribeToUserOrders,
} from "../../lib/userOrders";
import OrderHistoryPanel from "../components/OrderHistoryPanel";
import UserNotificationBell from "../components/UserNotificationBell";
import "../../styles/products-listing.css";

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const RAZORPAY_TEST_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SnigLpzykUhs8o";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Payment server request failed.");
  }

  return payload;
}

function loadRazorpayCheckout() {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SRC}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

async function createRazorpayOrderOnServer({ amount, customer, orderDocumentId }) {
  return apiRequest("/razorpay/create-order", {
    method: "POST",
    body: JSON.stringify({
      amount,
      currency: "INR",
      orderDocumentId,
      customerEmail: customer.email,
    }),
  });
}

async function verifyRazorpayPaymentOnServer(paymentResult) {
  return apiRequest("/razorpay/verify-payment", {
    method: "POST",
    body: JSON.stringify(paymentResult),
  });
}

async function openRazorpayTestCheckout({ amount, customer, orderId, keyId, razorpayOrderId, mock }) {
  const checkoutKeyId = keyId || RAZORPAY_TEST_KEY_ID;
  const checkoutOrderId = mock ? "" : razorpayOrderId;

  if (!checkoutKeyId.startsWith("rzp_test_")) {
    throw new Error("Razorpay checkout is configured for test keys only in this app.");
  }

  if (!mock && !checkoutOrderId) {
    throw new Error("Razorpay test order could not be created. Please try again.");
  }

  await loadRazorpayCheckout();

  if (!window.Razorpay) {
    throw new Error("Razorpay checkout could not be loaded.");
  }

  return new Promise((resolve, reject) => {
    let lastPaymentFailure = "";
    const checkout = new window.Razorpay({
      key: checkoutKeyId,
      amount: Math.max(1, Math.round(Number(amount || 0) * 100)),
      currency: "INR",
      name: "Spice Root",
      description: mock ? "Razorpay demo test payment" : "Razorpay test payment",
      ...(checkoutOrderId ? { order_id: checkoutOrderId } : {}),
      prefill: {
        name: customer.fullName,
        email: customer.email,
        contact: customer.mobileNumber,
      },
      notes: {
        orderDocumentId: orderId,
        mode: "test",
      },
      theme: {
        color: "#b45309",
      },
      retry: {
        enabled: true,
        max_count: 3,
      },
      remember_customer: false,
      handler: (response) => {
        resolve({
          paymentId: response.razorpay_payment_id || `rzp_test_paid_${Date.now()}`,
          razorpayOrderId: response.razorpay_order_id || checkoutOrderId || "",
          razorpaySignature: response.razorpay_signature || "",
          mock,
        });
      },
      modal: {
        ondismiss: () => {
          reject(
            new Error(
              lastPaymentFailure ||
                "Payment was closed before completion. Use Razorpay test card or UPI success@razorpay."
            )
          );
        },
      },
    });

    checkout.on("payment.failed", (response) => {
      lastPaymentFailure =
        response?.error?.description ||
        "Razorpay test payment failed. Please retry with Razorpay test card or UPI success@razorpay.";
      console.warn("Razorpay test payment failed, waiting for retry:", response?.error || response);
    });

    checkout.open();
  });
}

function CheckoutScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, userProfile, logoutUser, saveUserProfileDetails } = useAuth();
  const { items, itemCount, subtotal, clearCart } = useCart();
  const [errors, setErrors] = useState({});
  const [placedOrderData, setPlacedOrderData] = useState(null);
  const [successNotice, setSuccessNotice] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [form, setForm] = useState(() => ({
    fullName: userProfile?.name || userProfile?.firstName || currentUser?.displayName || "",
    mobileNumber: userProfile?.phoneNumber || "",
    alternateMobileNumber: userProfile?.alternatePhoneNumber || "",
    addressLine1: userProfile?.addressLine1 || "",
    addressLine2: userProfile?.addressLine2 || "",
    city: userProfile?.city || "",
    state: userProfile?.state || "",
    pincode: userProfile?.pincode || "",
    deliveryInstructions: userProfile?.deliveryInstructions || "",
  }));
  const firstName =
    userProfile?.firstName ||
    userProfile?.name?.trim().split(/\s+/)[0] ||
    currentUser?.displayName?.trim().split(/\s+/)[0] ||
    "User";
  const deliveryCharge = 0;
  const total = subtotal + deliveryCharge;
  const summaryItems = useMemo(() => items, [items]);
  const requestedOrderId = searchParams.get("order") || "";
  const hasFreshPlacementFlag = searchParams.get("placed") === "1";

  useEffect(() => {
    const unsubscribe = subscribeToUserOrders(
      currentUser?.uid,
      setOrderHistory,
      (error) => console.error("Failed to load checkout order history:", error)
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  useEffect(() => {
    setForm((current) => ({
      fullName: current.fullName || userProfile?.name || userProfile?.firstName || currentUser?.displayName || "",
      mobileNumber: current.mobileNumber || userProfile?.phoneNumber || "",
      alternateMobileNumber: current.alternateMobileNumber || userProfile?.alternatePhoneNumber || "",
      addressLine1: current.addressLine1 || userProfile?.addressLine1 || "",
      addressLine2: current.addressLine2 || userProfile?.addressLine2 || "",
      city: current.city || userProfile?.city || "",
      state: current.state || userProfile?.state || "",
      pincode: current.pincode || userProfile?.pincode || "",
      deliveryInstructions: current.deliveryInstructions || userProfile?.deliveryInstructions || "",
    }));
  }, [currentUser?.displayName, userProfile]);

  useEffect(() => {
    if (!successNotice) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setSuccessNotice("");
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [successNotice]);

  useEffect(() => {
    if (!hasFreshPlacementFlag || !requestedOrderId) {
      return undefined;
    }

    setSuccessNotice("Order placed successfully.");

    const timer = window.setTimeout(() => {
      setSearchParams({ order: requestedOrderId }, { replace: true });
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [hasFreshPlacementFlag, requestedOrderId, setSearchParams]);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/", { replace: true });
  };

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setSubmitError("");
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!/^\d{10}$/.test(form.mobileNumber.trim())) {
      nextErrors.mobileNumber = "Enter a valid 10-digit mobile number.";
    }

    if (form.alternateMobileNumber.trim() && !/^\d{10}$/.test(form.alternateMobileNumber.trim())) {
      nextErrors.alternateMobileNumber = "Alternate number must be 10 digits.";
    }

    if (!form.addressLine1.trim()) {
      nextErrors.addressLine1 = "Delivery address line 1 is required.";
    }

    if (!form.city.trim()) {
      nextErrors.city = "City is required.";
    }

    if (!form.state.trim()) {
      nextErrors.state = "State is required.";
    }

    if (!/^\d{6}$/.test(form.pincode.trim())) {
      nextErrors.pincode = "Enter a valid 6-digit pincode.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!currentUser?.uid) {
      setSubmitError("Please log in again before placing your order.");
      return;
    }

    if (items.length === 0) {
      setSubmitError("Your cart is empty. Add products before placing an order.");
      return;
    }

    try {
      setPlacingOrder(true);
      setSubmitError("");

      let savedProfile = userProfile;

      try {
        savedProfile = await saveUserProfileDetails(form);
      } catch (profileError) {
        console.warn("Profile details could not be saved before placing order:", profileError);
      }

      const customer = {
        fullName: form.fullName.trim(),
        email: savedProfile?.email || currentUser.email || "",
        mobileNumber: form.mobileNumber.trim(),
        alternateMobileNumber: form.alternateMobileNumber.trim(),
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        deliveryInstructions: form.deliveryInstructions.trim(),
      };
      const orderedItems = items.map((item) => ({
        key: item.key,
        id: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        unit: item.unit,
        size: item.size,
        quantity: item.quantity,
      }));

      const orderRef = doc(collection(db, "users", currentUser.uid, "orders"));
      const serverOrder = await createRazorpayOrderOnServer({
        amount: total,
        customer,
        orderDocumentId: orderRef.id,
      });
      const paymentResult = await openRazorpayTestCheckout({
        amount: total,
        customer,
        orderId: orderRef.id,
        keyId: serverOrder.keyId,
        razorpayOrderId: serverOrder.razorpayOrderId,
        mock: serverOrder.mock,
      });
      const verifiedPayment = await verifyRazorpayPaymentOnServer({
        ...paymentResult,
        orderDocumentId: orderRef.id,
        mock: serverOrder.mock,
      });

      if (!verifiedPayment.verified) {
        throw new Error("Payment verification failed. Your order was not placed.");
      }

      const orderPayload = {
        userId: currentUser.uid,
        customer,
        items: orderedItems,
        itemCount,
        subtotal,
        deliveryCharge,
        total,
        paymentMethod: serverOrder.mock ? "Razorpay Mock Test" : "Razorpay Test",
        paymentStatus: "Paid",
        paymentProvider: "Razorpay",
        paymentMode: serverOrder.mock ? "mock-test" : "test",
        paymentId: verifiedPayment.paymentId || paymentResult.paymentId,
        razorpayOrderId: verifiedPayment.razorpayOrderId || paymentResult.razorpayOrderId,
        razorpaySignature: verifiedPayment.razorpaySignature || paymentResult.razorpaySignature,
        paidAt: serverTimestamp(),
        status: "pending",
        createdAt: serverTimestamp(),
      };

      await setDoc(orderRef, orderPayload);
      const optimisticOrder = createOptimisticOrder(orderRef.id, orderPayload);

      setPlacedOrderData(optimisticOrder);
      setSuccessNotice("Payment completed. Order placed successfully.");
      clearCart();
      setSearchParams({ order: orderRef.id, placed: "1" }, { replace: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Failed to place order:", error);
      setSubmitError(error.message || "We could not complete the payment right now. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const activeOrder = useMemo(() => {
    if (requestedOrderId) {
      return (
        orderHistory.find((item) => item.id === requestedOrderId || item.orderId === requestedOrderId) ||
        (placedOrderData?.id === requestedOrderId ? placedOrderData : null)
      );
    }

    return placedOrderData;
  }, [orderHistory, placedOrderData, requestedOrderId]);

  const visibleOrderHistory = useMemo(
    () => mergeOrdersWithCurrent(activeOrder, orderHistory),
    [activeOrder, orderHistory]
  );
  const shouldShowSuccessState = Boolean(activeOrder && items.length === 0 && (hasFreshPlacementFlag || placedOrderData));

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

      <main className="catalog-page checkout-page">
        {shouldShowSuccessState ? (
          <section style={styles.successLayout}>
            <section className="ember-surface" style={styles.confirmNotice}>
              <strong style={styles.confirmNoticeTitle}>Order confirmed.</strong>
              <p style={styles.confirmNoticeBody}>
                Your order was saved to your account and placed at the top of your order history.
              </p>
            </section>

            <section className="checkout-success-shell">
              <div className="checkout-success-left">
                <aside className="checkout-summary-panel ember-surface">
                  <div className="cart-panel-head">
                    <div>
                      <span className="checkout-section-kicker">Order Confirmed</span>
                      <h2>Summary</h2>
                    </div>
                    <span className="checkout-status-pill">Cart Cleared</span>
                  </div>

                  <div className="checkout-order-id">Order ID: {activeOrder.orderId}</div>

                  <div className="cart-summary-lines">
                    <div>
                      <span>Items</span>
                      <strong>{activeOrder.itemCount}</strong>
                    </div>
                    <div>
                      <span>Total</span>
                      <strong>{activeOrder.amountLabel}</strong>
                    </div>
                    <div>
                      <span>Payment</span>
                      <strong>{activeOrder.paymentMethod}</strong>
                    </div>
                    <div className="cart-total-line">
                      <span>Status</span>
                      <strong>{activeOrder.status}</strong>
                    </div>
                  </div>

                  <div className="checkout-combined-section">
                    <div className="cart-panel-head">
                      <div>
                        <span className="checkout-section-kicker">Products</span>
                        <h2>Items in this order</h2>
                      </div>
                    </div>

                  <div className="checkout-products-list">
                    {activeOrder.items.map((item) => (
                      <article key={item.key} className="checkout-product-card">
                        <div className="checkout-product-media">
                          <img src={item.image} alt={item.name} loading="eager" decoding="async" />
                        </div>
                        <div className="checkout-product-copy">
                          <strong>{item.name}</strong>
                          <span>{formatProductMeta(item) || "Standard pack"}</span>
                        </div>
                        <div className="checkout-product-total">
                          <span>Qty {item.quantity}</span>
                          <strong>{formatPrice(item.price * item.quantity)}</strong>
                        </div>
                      </article>
                    ))}
                  </div>
                  </div>

                  <p className="checkout-side-note">
                    Your order was saved to Firestore and linked to your account automatically.
                  </p>

                  <div className="checkout-success-actions">
                    <Link to="/" className="catalog-button">
                      Back to Home
                    </Link>
                    <Link to="/account" className="catalog-button catalog-button-secondary-alt">
                      Open Account
                    </Link>
                  </div>
                </aside>

                <OrderHistoryPanel
                  orders={visibleOrderHistory}
                  title="Previous Orders"
                  subtitle="Your newest order stays at the top, and all previous orders remain available here."
                  highlightOrderId={activeOrder.id}
                />
              </div>

                <section className="checkout-form-panel ember-surface">
                  <div className="cart-panel-head">
                    <div>
                      <span className="checkout-section-kicker">Delivery Snapshot</span>
                      <h2>Saved address details</h2>
                    </div>
                  </div>

                  <div className="checkout-confirm-grid">
                    <div>
                      <span>Full Name</span>
                      <strong>{activeOrder.raw.customer.fullName}</strong>
                    </div>
                    <div>
                      <span>Mobile Number</span>
                      <strong>{activeOrder.raw.customer.mobileNumber}</strong>
                    </div>
                    <div>
                      <span>Alternate Number</span>
                      <strong>{activeOrder.raw.customer.alternateMobileNumber || "Not provided"}</strong>
                    </div>
                    <div>
                      <span>Email</span>
                      <strong>{activeOrder.raw.customer.email || "Not provided"}</strong>
                    </div>
                    <div className="checkout-confirm-full">
                      <span>Address</span>
                      <strong>
                        {[activeOrder.raw.customer.addressLine1, activeOrder.raw.customer.addressLine2]
                          .filter(Boolean)
                          .join(", ")}
                      </strong>
                    </div>
                    <div>
                      <span>City</span>
                      <strong>{activeOrder.raw.customer.city}</strong>
                    </div>
                    <div>
                      <span>State</span>
                      <strong>{activeOrder.raw.customer.state}</strong>
                    </div>
                    <div>
                      <span>Pincode</span>
                      <strong>{activeOrder.raw.customer.pincode}</strong>
                    </div>
                    <div className="checkout-confirm-full">
                      <span>Instructions</span>
                      <strong>{activeOrder.raw.customer.deliveryInstructions || "No extra delivery instructions."}</strong>
                    </div>
                  </div>
                </section>
            </section>
          </section>
        ) : items.length === 0 ? (
          <section style={styles.emptyLayout}>
            <section className="catalog-empty cart-empty ember-surface">
              <h2>Your cart is empty.</h2>
              <p>Add products before moving to checkout, or review your order history below.</p>
              <div style={styles.emptyActions}>
                <Link to="/products" className="catalog-button">
                  Browse Products
                </Link>
                <Link to="/" className="catalog-button catalog-button-secondary-alt">
                  Back to Home
                </Link>
              </div>
            </section>

            <OrderHistoryPanel
              orders={orderHistory}
              title="Order History"
              subtitle="All orders placed from this account are saved automatically."
            />
          </section>
        ) : (
          <section className="checkout-active-layout">
            <section className="checkout-layout">
              <aside className="checkout-summary-panel ember-surface">
                <div className="cart-panel-head">
                  <div>
                    <span className="checkout-section-kicker">Order Summary</span>
                    <h2>Review totals</h2>
                  </div>
                  <span className="checkout-status-pill">{itemCount} items</span>
                </div>

                <div className="checkout-summary-list">
                  {summaryItems.map((item) => (
                    <div key={item.key} className="checkout-summary-item">
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.quantity} x {formatPrice(item.price)}</span>
                      </div>
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                    </div>
                  ))}
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
                  Your order is saved only after the Razorpay test payment is completed. Use Razorpay test card or UPI success@razorpay.
                </p>

                <div className="checkout-combined-section">
                  <div className="cart-panel-head">
                    <div>
                      <span className="checkout-section-kicker">Products</span>
                      <h2>Items in your cart</h2>
                    </div>
                  </div>

                  <div className="checkout-products-list">
                    {summaryItems.map((item) => (
                      <article key={item.key} className="checkout-product-card">
                        <div className="checkout-product-media">
                          <img src={item.image} alt={item.name} loading="eager" decoding="async" />
                        </div>
                        <div className="checkout-product-copy">
                          <strong>{item.name}</strong>
                          <span>{formatProductMeta(item) || "Standard pack"}</span>
                        </div>
                        <div className="checkout-product-total">
                          <span>Qty {item.quantity}</span>
                          <strong>{formatPrice(item.price * item.quantity)}</strong>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </aside>

              <form className="checkout-form-panel ember-surface" onSubmit={handlePlaceOrder}>
                <div className="cart-panel-head">
                  <div>
                    <span className="checkout-section-kicker">Delivery Details</span>
                    <h2>Shipping information</h2>
                  </div>
                </div>

                <div className="checkout-form-grid">
                  <label>
                    <span>Full Name</span>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(event) => handleChange("fullName", event.target.value)}
                      placeholder="Full name"
                    />
                    {errors.fullName ? <small>{errors.fullName}</small> : null}
                  </label>

                  <label>
                    <span>Mobile Number</span>
                    <input
                      type="tel"
                      value={form.mobileNumber}
                      onChange={(event) => handleChange("mobileNumber", event.target.value)}
                      placeholder="10-digit mobile number"
                    />
                    {errors.mobileNumber ? <small>{errors.mobileNumber}</small> : null}
                  </label>

                  <label>
                    <span>Alternate Mobile Number</span>
                    <input
                      type="tel"
                      value={form.alternateMobileNumber}
                      onChange={(event) => handleChange("alternateMobileNumber", event.target.value)}
                      placeholder="Optional alternate number"
                    />
                    {errors.alternateMobileNumber ? <small>{errors.alternateMobileNumber}</small> : null}
                  </label>

                  <label className="checkout-field-full">
                    <span>Delivery Address Line 1</span>
                    <input
                      type="text"
                      value={form.addressLine1}
                      onChange={(event) => handleChange("addressLine1", event.target.value)}
                      placeholder="House, flat, street"
                    />
                    {errors.addressLine1 ? <small>{errors.addressLine1}</small> : null}
                  </label>

                  <label className="checkout-field-full">
                    <span>Delivery Address Line 2</span>
                    <input
                      type="text"
                      value={form.addressLine2}
                      onChange={(event) => handleChange("addressLine2", event.target.value)}
                      placeholder="Area, landmark"
                    />
                  </label>

                  <label>
                    <span>City</span>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(event) => handleChange("city", event.target.value)}
                      placeholder="City"
                    />
                    {errors.city ? <small>{errors.city}</small> : null}
                  </label>

                  <label>
                    <span>State</span>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(event) => handleChange("state", event.target.value)}
                      placeholder="State"
                    />
                    {errors.state ? <small>{errors.state}</small> : null}
                  </label>

                  <label>
                    <span>Pincode</span>
                    <input
                      type="text"
                      value={form.pincode}
                      onChange={(event) => handleChange("pincode", event.target.value)}
                      placeholder="6-digit pincode"
                    />
                    {errors.pincode ? <small>{errors.pincode}</small> : null}
                  </label>

                  <label className="checkout-field-full">
                    <span>Delivery Instructions</span>
                    <textarea
                      rows="4"
                      value={form.deliveryInstructions}
                      onChange={(event) => handleChange("deliveryInstructions", event.target.value)}
                      placeholder="Optional instructions for delivery"
                    />
                  </label>
                </div>

                {submitError ? <div className="auth-route-error">{submitError}</div> : null}

                <button type="submit" className="catalog-button cart-checkout-button" disabled={placingOrder}>
                  {placingOrder ? "Opening Razorpay..." : "Pay with Razorpay Test"}
                </button>
              </form>
            </section>

            {orderHistory.length > 0 ? (
              <OrderHistoryPanel
                orders={visibleOrderHistory}
                title="Previous Orders"
                subtitle="Your saved orders stay available here even while you build a new cart."
                highlightOrderId={activeOrder?.id || ""}
              />
            ) : null}
          </section>
        )}
      </main>

      {successNotice ? (
        <div style={styles.successToast} role="status" aria-live="polite">
          {successNotice}
        </div>
      ) : null}

      <Footer />
    </div>
  );
}

const styles = {
  successLayout: {
    display: "grid",
    gap: "24px",
  },
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
  confirmNotice: {
    padding: "16px 18px",
    border: "1px solid rgba(34, 197, 94, 0.22)",
    background: "rgba(34, 197, 94, 0.1)",
  },
  confirmNoticeTitle: {
    display: "block",
    color: "#bbf7d0",
    marginBottom: "4px",
  },
  confirmNoticeBody: {
    margin: 0,
    color: "rgba(245, 237, 224, 0.82)",
    lineHeight: 1.55,
  },
  successToast: {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    zIndex: 50,
    padding: "12px 16px",
    borderRadius: "12px",
    background: "#16a34a",
    color: "#f0fdf4",
    boxShadow: "0 18px 48px rgba(22, 163, 74, 0.28)",
    fontWeight: 700,
  },
};

export default CheckoutScreen;
