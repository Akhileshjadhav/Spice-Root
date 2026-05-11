import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaBell,
  FaCalendarAlt,
  FaEnvelope,
  FaExternalLinkAlt,
  FaSearch,
} from "react-icons/fa";
import { useAuth } from "../../context/useAuth";
import {
  markContactSubmissionAsRead,
  subscribeToContactSubmissions,
  subscribeToOrders,
} from "../../lib/adminStore";

const titleMap = {
  "/admin/dashboard": {
    title: "Dashboard Overview",
    subtitle: "See revenue, orders, stock health, and customer momentum at a glance.",
  },
  "/admin/products": {
    title: "Products",
    subtitle: "Manage live catalog items, pricing, stock, and publish status.",
  },
  "/admin/categories": {
    title: "Categories",
    subtitle: "Control storefront category groups and featured collection blocks.",
  },
  "/admin/inventory": {
    title: "Inventory",
    subtitle: "Track stock, reorder thresholds, and replenishment health.",
  },
  "/admin/orders": {
    title: "Orders",
    subtitle: "Review customer purchases and fulfillment progress.",
  },
  "/admin/order-details": {
    title: "Order Details",
    subtitle: "Inspect order items, payment, delivery, and status history.",
  },
  "/admin/customers": {
    title: "Customers",
    subtitle: "Monitor active buyers, repeat orders, and account health.",
  },
  "/admin/customer-details": {
    title: "Customer Details",
    subtitle: "Review customer profile, wallet, and order history.",
  },
  "/admin/coupons": {
    title: "Coupons & Offers",
    subtitle: "Launch campaigns and tune discount usage across the store.",
  },
  "/admin/reviews": {
    title: "Reviews",
    subtitle: "Approve product reviews and track sentiment quality.",
  },
  "/admin/payments": {
    title: "Payments",
    subtitle: "Watch capture, refunds, and payment-method performance.",
  },
  "/admin/shipping": {
    title: "Shipping",
    subtitle: "Track dispatch timelines, couriers, and delivery SLAs.",
  },
  "/admin/analytics": {
    title: "Analytics",
    subtitle: "Measure growth trends, conversion, and product contribution.",
  },
  "/admin/queries": {
    title: "Customer Queries",
    subtitle: "Respond to support tickets and order-related issues quickly.",
  },
  "/admin/cms": {
    title: "Website CMS",
    subtitle: "Update live banners, featured sections, and promotional assets.",
  },
  "/admin/users": {
    title: "Admin Users",
    subtitle: "Manage team access, roles, and audit visibility.",
  },
  "/admin/settings": {
    title: "Settings",
    subtitle: "Configure store, delivery, and payment preferences.",
  },
};

const LOCAL_READ_NOTIFICATION_KEY = "spice-root-admin-read-order-notifications";

function readLocalReadNotifications() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_READ_NOTIFICATION_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalReadNotifications(orderIds) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_READ_NOTIFICATION_KEY, JSON.stringify(orderIds));
}

const searchTargets = [
  { label: "Dashboard Overview", path: "/admin/dashboard", keywords: ["dashboard", "dashboard overview", "overview", "admin dashboard"] },
  { label: "Revenue Overview", path: "/admin/dashboard#revenue-overview", keywords: ["revenue", "revenue overview", "sales overview", "income"] },
  { label: "Products", path: "/admin/products", keywords: ["products", "product list", "catalog"] },
  { label: "Categories", path: "/admin/categories", keywords: ["categories", "category"] },
  { label: "Inventory", path: "/admin/inventory", keywords: ["inventory", "stock", "warehouse"] },
  { label: "Orders", path: "/admin/orders", keywords: ["orders"] },
  { label: "Order Details", path: "/admin/order-details", keywords: ["order details", "order detail"] },
  { label: "Customers", path: "/admin/customers", keywords: ["customers", "customer"] },
  { label: "Customer Details", path: "/admin/customer-details", keywords: ["customer details", "customer detail"] },
  { label: "Coupons & Offers", path: "/admin/coupons", keywords: ["coupons", "offers", "discounts", "coupon"] },
  { label: "Reviews", path: "/admin/reviews", keywords: ["reviews", "product reviews"] },
  { label: "Payments", path: "/admin/payments", keywords: ["payments", "payment"] },
  { label: "Shipping", path: "/admin/shipping", keywords: ["shipping", "delivery", "dispatch"] },
  { label: "Analytics", path: "/admin/analytics", keywords: ["analytics", "report", "reports"] },
  { label: "Customer Queries", path: "/admin/queries", keywords: ["queries", "customer queries", "support"] },
  { label: "Website CMS", path: "/admin/cms", keywords: ["cms", "website cms", "banner", "banners"] },
  { label: "Admin Users", path: "/admin/users", keywords: ["admin users", "team", "staff"] },
  { label: "Settings", path: "/admin/settings", keywords: ["settings", "store settings"] },
  { label: "Orders Overview", path: "/admin/dashboard#orders-overview", keywords: ["orders overview", "order overview", "orders chart"] },
  { label: "Top Selling Products", path: "/admin/dashboard#top-selling-masalas", keywords: ["top selling", "top selling products", "best sellers", "top products"] },
  { label: "Low Stock Alerts", path: "/admin/dashboard#low-stock-alerts", keywords: ["low stock", "stock alerts", "low stock alerts", "reorder"] },
  { label: "Recent Orders", path: "/admin/dashboard#recent-orders", keywords: ["recent orders", "latest orders"] },
  { label: "New Customers", path: "/admin/dashboard#new-customers", keywords: ["new customers", "recent customers"] },
];

const normalizeSearch = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const findSearchTarget = (value) => {
  const normalizedValue = normalizeSearch(value);

  if (!normalizedValue) {
    return null;
  }

  const exactMatch = searchTargets.find((target) =>
    target.keywords.some((keyword) => normalizeSearch(keyword) === normalizedValue)
  );

  if (exactMatch) {
    return exactMatch;
  }

  return (
    searchTargets.find((target) =>
      target.keywords.some((keyword) => normalizeSearch(keyword).includes(normalizedValue))
    ) ||
    searchTargets.find((target) =>
      target.keywords.some((keyword) => normalizedValue.includes(normalizeSearch(keyword)))
    ) ||
    null
  );
};

const AdminTopbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminProfile, currentUser } = useAuth();
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState([]);
  const [queries, setQueries] = useState([]);
  const [localReadNotifications, setLocalReadNotifications] = useState(() => readLocalReadNotifications());
  const [notificationPanelType, setNotificationPanelType] = useState("");
  const [markingNotificationId, setMarkingNotificationId] = useState("");
  const pageMeta = titleMap[location.pathname] || titleMap["/admin/dashboard"];
  const displayName = adminProfile?.name || currentUser?.displayName || "Admin User";
  const displayEmail = adminProfile?.email || currentUser?.email || "admin@spiceroot.com";
  const suggestions = useMemo(() => [...new Set(searchTargets.map((target) => target.label))], []);
  const unreadOrderNotifications = useMemo(() => {
    return orders
      .filter((item) => {
        const normalizedStatus = String(item.status || "").trim().toLowerCase();

        return (
          !localReadNotifications.includes(item.id) &&
          normalizedStatus !== "delivered" &&
          normalizedStatus !== "cancelled" &&
          normalizedStatus !== "canceled"
        );
      })
      .map((item) => ({
        id: `order-${item.id}`,
        source: "order",
        userId: item.userId,
        orderId: item.orderId,
        orderDocumentId: item.id,
        customerName: item.customerName,
        customerEmail: item.customerEmail,
        createdAt: item.createdAt,
        message: `Order ${item.orderId} is waiting for admin review.`,
        isUnread: true,
        notificationType: "order",
      }))
      .sort((left, right) => {
        const leftTime = typeof left.createdAt?.toMillis === "function" ? left.createdAt.toMillis() : 0;
        const rightTime = typeof right.createdAt?.toMillis === "function" ? right.createdAt.toMillis() : 0;
        return rightTime - leftTime;
      });
  }, [localReadNotifications, orders]);
  const unreadQueryNotifications = useMemo(() => {
    return queries
      .filter((item) => !item.adminSeen)
      .map((item) => ({
        id: `query-${item.id}`,
        queryId: item.id,
        userId: item.userId,
        customerName: item.name,
        customerEmail: item.email,
        createdAt: item.createdAt,
        message: item.preview || "A customer sent a new message.",
        isUnread: true,
        notificationType: "query",
      }))
      .sort((left, right) => {
        const leftTime = typeof left.createdAt?.toMillis === "function" ? left.createdAt.toMillis() : 0;
        const rightTime = typeof right.createdAt?.toMillis === "function" ? right.createdAt.toMillis() : 0;
        return rightTime - leftTime;
      });
  }, [queries]);
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    []
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    const target = findSearchTarget(query);

    if (target) {
      navigate(target.path);
    }
  };

  const markNotificationAsHandled = async (notification) => {
    if (!notification?.isUnread) {
      return;
    }

    if (notification.notificationType === "query") {
      await markContactSubmissionAsRead(notification.queryId);
      return;
    }

    setLocalReadNotifications((current) => {
      const next = Array.from(new Set([...current, notification.orderDocumentId || notification.orderId]));
      writeLocalReadNotifications(next);
      return next;
    });
  };

  const handleOpenNotificationOrder = async (notification) => {
    if (!notification?.userId) {
      return;
    }

    try {
      if (notification.isUnread) {
        setMarkingNotificationId(notification.id);
        await markNotificationAsHandled(notification);
      }

      navigate(
        notification.notificationType === "query"
          ? `/admin/queries?query=${encodeURIComponent(notification.queryId)}`
          : `/admin/orders?user=${encodeURIComponent(notification.userId)}&order=${encodeURIComponent(
            notification.orderDocumentId || notification.orderId
          )}`
      );
      setNotificationPanelType("");
    } catch (error) {
      console.error("Failed to open admin order notification:", error);
    } finally {
      setMarkingNotificationId("");
    }
  };

  const handleMarkAsRead = async (notification) => {
    try {
      setMarkingNotificationId(notification.id);
      await markNotificationAsHandled(notification);
    } catch (error) {
      console.error("Failed to mark admin notification as read:", error);
    } finally {
      setMarkingNotificationId("");
    }
  };

  useEffect(() => {
    const target = searchTargets.find((item) =>
      item.keywords.some((keyword) => normalizeSearch(keyword) === normalizeSearch(query))
    );

    if (!target) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      navigate(target.path);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [navigate, query]);

  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      setOrders,
      (error) => console.error("Failed to load topbar order counts:", error)
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToContactSubmissions(
      setQueries,
      (error) => console.error("Failed to load topbar query counts:", error)
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setNotificationPanelType("");
  }, [location.pathname, location.search]);

  return (
    <div className="admin-topbar">
      <div className="admin-title-block">
        <span className="admin-kicker">Spice Root Admin</span>
        <h1>{pageMeta.title}</h1>
        <p>{pageMeta.subtitle}</p>
      </div>

      <form className="admin-search-shell" aria-label="Search admin dashboard" onSubmit={handleSubmit}>
        <span><FaSearch /></span>
        <input
          type="search"
          list="admin-search-targets"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search pages or sections..."
        />
        <button type="submit" className="admin-search-submit" aria-label="Jump to admin page or section">
          <FaSearch />
        </button>
      </form>

      <datalist id="admin-search-targets">
        {suggestions.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>

      <div className="admin-top-actions">
        <Link to="/" className="admin-secondary-button admin-link-button" target="_blank" rel="noreferrer">
          <FaExternalLinkAlt />
          <span>Preview Website</span>
        </Link>

        <button type="button" className="admin-secondary-button admin-date-chip">
          <FaCalendarAlt />
          <span>{todayLabel}</span>
        </button>

        <div className="admin-notification-shell">
          <button
            type="button"
            className="admin-notify-icon admin-notify-button"
            title={`${unreadOrderNotifications.length} unread order notification${unreadOrderNotifications.length === 1 ? "" : "s"}`}
            onClick={() =>
              setNotificationPanelType((current) => (current === "orders" ? "" : "orders"))
            }
          >
            <FaBell />
            <span>{unreadOrderNotifications.length}</span>
          </button>

          {notificationPanelType === "orders" ? (
            <div className="admin-notification-panel">
              <div className="admin-notification-panel-head">
                <div>
                  <strong>Order Notifications</strong>
                  <small>Unread order alerts disappear after they are marked as read.</small>
                </div>
              </div>

              <div className="admin-notification-list">
                {unreadOrderNotifications.length === 0 ? (
                  <div className="admin-empty-state">No new order notifications right now.</div>
                ) : (
                  unreadOrderNotifications.map((notification) => (
                    <article
                      key={notification.id}
                      className={`admin-notification-card${notification.isUnread ? " unread" : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenNotificationOrder(notification)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleOpenNotificationOrder(notification);
                        }
                      }}
                    >
                      <div className="admin-notification-meta">
                        <strong>{notification.customerName}</strong>
                        <span>{notification.orderId}</span>
                      </div>
                      <p>{notification.message}</p>
                      <div className="admin-notification-actions">
                        <button
                          type="button"
                          className="admin-panel-action-link"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenNotificationOrder(notification);
                          }}
                        >
                          Open order
                        </button>
                        <button
                          type="button"
                          className="admin-panel-action-link"
                          disabled={!notification.isUnread || markingNotificationId === notification.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleMarkAsRead(notification);
                          }}
                        >
                          {markingNotificationId === notification.id
                            ? "Saving..."
                            : notification.isUnread
                              ? "Mark as read"
                              : "Read"}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="admin-notification-shell">
          <button
            type="button"
            className="admin-notify-icon admin-notify-button"
            title={`${unreadQueryNotifications.length} unread customer quer${unreadQueryNotifications.length === 1 ? "y" : "ies"}`}
            onClick={() =>
              setNotificationPanelType((current) => (current === "queries" ? "" : "queries"))
            }
          >
            <FaEnvelope />
            <span>{unreadQueryNotifications.length}</span>
          </button>

          {notificationPanelType === "queries" ? (
            <div className="admin-notification-panel">
              <div className="admin-notification-panel-head">
                <div>
                  <strong>Customer Queries</strong>
                  <small>Unread customer messages move here until the admin reads them.</small>
                </div>
              </div>

              <div className="admin-notification-list">
                {unreadQueryNotifications.length === 0 ? (
                  <div className="admin-empty-state">No new customer queries right now.</div>
                ) : (
                  unreadQueryNotifications.map((notification) => (
                    <article
                      key={notification.id}
                      className={`admin-notification-card${notification.isUnread ? " unread" : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenNotificationOrder(notification)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleOpenNotificationOrder(notification);
                        }
                      }}
                    >
                      <div className="admin-notification-meta">
                        <strong>{notification.customerName}</strong>
                        <span>{`Query ${notification.queryId}`}</span>
                      </div>
                      <p>{notification.message}</p>
                      <div className="admin-notification-actions">
                        <button
                          type="button"
                          className="admin-panel-action-link"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenNotificationOrder(notification);
                          }}
                        >
                          Open query
                        </button>
                        <button
                          type="button"
                          className="admin-panel-action-link"
                          disabled={!notification.isUnread || markingNotificationId === notification.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleMarkAsRead(notification);
                          }}
                        >
                          {markingNotificationId === notification.id ? "Saving..." : "Mark as read"}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="admin-user-chip">
          <div className="admin-avatar">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <strong>{displayName}</strong>
            <span>{displayEmail}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTopbar;
