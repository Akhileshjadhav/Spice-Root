import { formatPrice, formatProductMeta } from "../../lib/catalog";

function OrderHistoryPanel({
  orders = [],
  title = "Order History",
  subtitle = "Your saved orders appear here automatically.",
  highlightOrderId = "",
  emptyTitle = "No orders yet.",
  emptyBody = "Place your first order to see it here.",
}) {
  return (
    <section className="ember-surface" style={styles.panel}>
      <div style={styles.head}>
        <div>
          <span style={styles.kicker}>Orders</span>
          <h2 style={styles.title}>{title}</h2>
          <p style={styles.subtitle}>{subtitle}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={styles.emptyState}>
          <h3 style={styles.emptyTitle}>{emptyTitle}</h3>
          <p style={styles.emptyBody}>{emptyBody}</p>
        </div>
      ) : (
        <div style={styles.list}>
          {orders.map((order) => (
            <article key={order.id} style={styles.card}>
              <div style={styles.row}>
                <div>
                  <div style={styles.orderLine}>
                    <strong>{order.orderId}</strong>
                    {highlightOrderId === order.id ? (
                      <span style={styles.badge}>Current Order</span>
                    ) : null}
                  </div>
                  <span style={styles.meta}>{order.date}</span>
                </div>
                <div style={styles.amountBlock}>
                  <strong>{order.amountLabel || formatPrice(order.amount)}</strong>
                  <span style={styles.meta}>{order.status}</span>
                </div>
              </div>

              <div style={styles.items}>
                {order.items.map((item) => (
                  <div key={item.key || `${item.id}-${item.size || "default"}`} style={styles.itemRow}>
                    <div>
                      <strong>{item.name}</strong>
                      <span style={styles.meta}>{formatProductMeta(item) || "Standard pack"}</span>
                    </div>
                    <div style={styles.amountBlock}>
                      <span style={styles.meta}>Qty {item.quantity}</span>
                      <strong>{formatPrice((item.price || 0) * (item.quantity || 0))}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

const styles = {
  panel: {
    padding: "24px",
    display: "grid",
    gap: "18px",
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
  },
  kicker: {
    display: "inline-block",
    fontSize: "0.72rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#caa66b",
    marginBottom: "8px",
  },
  title: {
    margin: 0,
  },
  subtitle: {
    margin: "8px 0 0",
    color: "rgba(245, 237, 224, 0.72)",
  },
  emptyState: {
    borderRadius: "18px",
    padding: "18px",
    background: "rgba(255,255,255,0.04)",
  },
  emptyTitle: {
    margin: 0,
  },
  emptyBody: {
    margin: "8px 0 0",
    color: "rgba(245, 237, 224, 0.72)",
  },
  list: {
    display: "grid",
    gap: "14px",
  },
  card: {
    display: "grid",
    gap: "14px",
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.04)",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
  },
  orderLine: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center",
  },
  badge: {
    padding: "4px 10px",
    borderRadius: "999px",
    background: "rgba(247, 164, 0, 0.16)",
    color: "#ffd998",
    fontSize: "0.75rem",
  },
  meta: {
    display: "block",
    color: "rgba(245, 237, 224, 0.68)",
    fontSize: "0.88rem",
    marginTop: "4px",
  },
  amountBlock: {
    textAlign: "right",
  },
  items: {
    display: "grid",
    gap: "10px",
  },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    paddingTop: "10px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
};

export default OrderHistoryPanel;
