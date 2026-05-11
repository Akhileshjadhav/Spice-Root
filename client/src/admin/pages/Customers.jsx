import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import { buildCustomerRows, subscribeToOrders, subscribeToUsers } from "../../lib/adminStore";

const Customers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToUsers(
      setUsers,
      (error) => console.error("Failed to load live customers:", error)
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      setOrders,
      (error) => console.error("Failed to load customer orders:", error)
    );

    return () => unsubscribe();
  }, []);

  const customerRows = useMemo(() => buildCustomerRows(users, orders), [orders, users]);
  const columns = useMemo(
    () => [
      {
        key: "customer",
        label: "Customer",
        render: (row) => (
          <button
            type="button"
            style={styles.customerButton}
            onClick={() => navigate(`/admin/customer-details?user=${encodeURIComponent(row.uid)}`)}
          >
            {row.customer}
          </button>
        ),
      },
      { key: "email", label: "Email" },
      { key: "orders", label: "Orders", align: "right" },
      { key: "spend", label: "Total Spend" },
      { key: "status", label: "Status", type: "status" },
    ],
    [navigate]
  );

  return (
    <section className="admin-module-section">
      <div className="admin-page-head">
        <div>
          <h2>Customers</h2>
          <p>See live registered users, total orders, total spend, and account activity status.</p>
        </div>
      </div>

      <div className="admin-module-card">
        <DataTable columns={columns} rows={customerRows} rowKey="uid" />
        {customerRows.length === 0 ? (
          <div className="admin-empty-state" style={styles.emptyState}>
            Registered users will appear here automatically once customers sign up.
          </div>
        ) : null}
      </div>
    </section>
  );
};

const styles = {
  customerButton: {
    background: "transparent",
    border: 0,
    color: "#fff2d0",
    cursor: "pointer",
    padding: 0,
    textAlign: "left",
  },
  emptyState: {
    marginTop: "12px",
  },
};

export default Customers;
