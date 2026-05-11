import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import { buildPaymentRows, isPaidOrder, subscribeToOrders } from "../../lib/adminStore";
import { formatPrice } from "../../lib/catalog";

const columns = [
  { key: "paymentId", label: "Payment ID" },
  { key: "orderId", label: "Order ID" },
  { key: "customer", label: "Customer" },
  { key: "amount", label: "Amount" },
  { key: "method", label: "Method" },
  { key: "status", label: "Status", type: "status" },
  { key: "date", label: "Date" },
];

const Payments = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      setOrders,
      (error) => console.error("Failed to load live payments:", error)
    );

    return () => unsubscribe();
  }, []);

  const paymentRows = useMemo(() => buildPaymentRows(orders), [orders]);
  const paidRevenue = useMemo(
    () => orders.filter(isPaidOrder).reduce((total, order) => total + Math.max(0, Number(order.amount) || 0), 0),
    [orders]
  );

  return (
    <section className="admin-module-section">
      <div className="admin-page-head">
        <div>
          <h2>Payments</h2>
          <p>Track Razorpay test transactions, payment status, and paid revenue from live orders.</p>
        </div>
      </div>

      <div className="admin-kpi-grid" style={styles.summaryGrid}>
        <article className="admin-kpi-card">
          <span>Paid Revenue</span>
          <strong>{formatPrice(paidRevenue)}</strong>
          <small>{orders.filter(isPaidOrder).length} paid orders</small>
        </article>
        <article className="admin-kpi-card">
          <span>Total Payment Records</span>
          <strong>{paymentRows.length}</strong>
          <small>Synced from customer orders</small>
        </article>
      </div>

      <div className="admin-module-card">
        <DataTable columns={columns} rows={paymentRows} rowKey="paymentId" />
        {paymentRows.length === 0 ? (
          <div className="admin-empty-state" style={styles.emptyState}>
            Payments will appear here after a customer completes the Razorpay test checkout.
          </div>
        ) : null}
      </div>
    </section>
  );
};

const styles = {
  summaryGrid: {
    marginBottom: "18px",
  },
  emptyState: {
    marginTop: "12px",
  },
};

export default Payments;
