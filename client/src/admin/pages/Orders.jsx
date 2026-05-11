import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import {
  getOrderStatusOptions,
  getPendingAdminOrders,
  subscribeToOrders,
  updateOrderStatus,
} from "../../lib/adminStore";

const Orders = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [draftStatus, setDraftStatus] = useState("Pending");
  const [savingStatus, setSavingStatus] = useState(false);
  const requestedOrderId = searchParams.get("order") || "";
  const requestedUserId = searchParams.get("user") || "";
  const visibleOrders = useMemo(() => getPendingAdminOrders(orders), [orders]);

  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      (items) => {
        setOrders(items);
      },
      (error) => console.error("Failed to load live orders:", error)
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (visibleOrders.length === 0) {
      setSelectedOrder(null);
      return;
    }

    const requestedOrder =
      visibleOrders.find(
        (item) =>
          item.id === requestedOrderId ||
          item.orderId === requestedOrderId ||
          (requestedUserId && item.userId === requestedUserId && item.id === requestedOrderId)
      ) || null;

    setSelectedOrder((current) => requestedOrder || visibleOrders.find((item) => item.id === current?.id) || visibleOrders[0]);
  }, [requestedOrderId, requestedUserId, visibleOrders]);

  useEffect(() => {
    setDraftStatus(selectedOrder?.status || "Pending");
  }, [selectedOrder]);

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setSearchParams(
      order?.id
        ? {
            order: order.id,
            user: order.userId,
          }
        : {}
    );
  };

  const handleSaveStatus = async () => {
    if (!selectedOrder) {
      return;
    }

    try {
      setSavingStatus(true);
      await updateOrderStatus(selectedOrder, draftStatus);
    } catch (error) {
      console.error("Failed to update order status:", error);
    } finally {
      setSavingStatus(false);
    }
  };

  const columns = [
    { key: "orderId", label: "Order ID" },
    {
      key: "customerName",
      label: "Customer",
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/admin/customer-details?user=${encodeURIComponent(row.userId)}&order=${encodeURIComponent(row.id)}`)}
          style={styles.customerButton}
        >
          {row.customerName}
        </button>
      ),
    },
    { key: "amountLabel", label: "Amount" },
    { key: "paymentMethod", label: "Payment" },
    { key: "status", label: "Status", type: "status" },
    { key: "date", label: "Date" },
    {
      key: "actions",
      label: "View",
      render: (row) => (
        <button type="button" onClick={() => handleSelectOrder(row)} style={styles.linkButton}>
          Open
        </button>
      ),
    },
  ];

  return (
    <section className="admin-module-section">
      <div className="admin-page-head">
        <div>
          <h2>Orders</h2>
          <p>All customer orders stay here, while unread notifications are handled separately in the top bar.</p>
        </div>
      </div>

      <div className="admin-split-grid">
        <div className="admin-module-card">
          <DataTable columns={columns} rows={visibleOrders} rowKey="id" />
          {visibleOrders.length === 0 ? (
            <div className="admin-empty-state" style={styles.emptyState}>
              No customer orders yet. New orders will appear here automatically as soon as they are placed.
            </div>
          ) : null}
        </div>

        {selectedOrder ? (
          <aside className="admin-detail-card">
            <div className="admin-page-head compact">
              <div>
                <h3>Order Details</h3>
                <p>{selectedOrder.orderId}</p>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div className="admin-detail-grid">
              <div><span>Customer</span><strong>{selectedOrder.customerName}</strong></div>
              <div><span>Phone</span><strong>{selectedOrder.phone}</strong></div>
              <div className="full"><span>Address</span><strong>{selectedOrder.address}</strong></div>
              <div><span>Payment</span><strong>{selectedOrder.paymentMethod}</strong></div>
              <div><span>Payment Status</span><strong>{selectedOrder.paymentStatus}</strong></div>
              <div><span>Items</span><strong>{selectedOrder.itemCount}</strong></div>
            </div>

            <label style={styles.statusField}>
              <span>Order Status</span>
              <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)}>
                {getOrderStatusOptions().map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div style={styles.itemsWrap}>
              {selectedOrder.items.map((item) => (
                <div key={item.key || `${item.id}-${item.size || "default"}`} style={styles.itemRow}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.size || item.unit || "Standard pack"}</span>
                  </div>
                  <div style={styles.itemMeta}>
                    <span>Qty {item.quantity}</span>
                    <strong>Rs {Number((item.price || 0) * (item.quantity || 0)).toLocaleString("en-IN")}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-page-actions stretch">
              <ActionButton onClick={() => navigate(`/admin/customer-details?user=${encodeURIComponent(selectedOrder.userId)}&order=${encodeURIComponent(selectedOrder.id)}`)}>
                Open Customer
              </ActionButton>
              <ActionButton variant="primary" onClick={handleSaveStatus} disabled={savingStatus}>
                {savingStatus ? "Saving..." : "Save Status"}
              </ActionButton>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
};

const styles = {
  linkButton: {
    cursor: "pointer",
    color: "#f7a400",
    fontSize: "0.92rem",
    background: "transparent",
    border: 0,
  },
  customerButton: {
    cursor: "pointer",
    color: "#fff2d0",
    fontSize: "0.9rem",
    background: "transparent",
    border: 0,
    padding: 0,
    textAlign: "left",
  },
  emptyState: {
    marginTop: "12px",
  },
  statusField: {
    display: "grid",
    gap: "8px",
    marginBottom: "18px",
    color: "#cdb58c",
  },
  itemsWrap: {
    display: "grid",
    gap: "12px",
    marginTop: "18px",
  },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.04)",
  },
  itemMeta: {
    display: "grid",
    justifyItems: "end",
    gap: "4px",
  },
};

export default Orders;
