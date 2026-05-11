import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import DataTable from "../components/DataTable";
import { db } from "../../firebase";
import { normalizeFirestoreProduct } from "../../lib/catalog";
import {
  buildInventoryRows,
  buildInventoryStats,
  subscribeToOrders,
} from "../../lib/adminStore";

const columns = [
  { key: "sku", label: "SKU" },
  { key: "product", label: "Product" },
  { key: "totalStock", label: "Total Stock", align: "right" },
  { key: "orderedStock", label: "Ordered Stock", align: "right" },
  { key: "availableStock", label: "Available Stock", align: "right" },
  { key: "status", label: "Status", type: "status" },
];

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs
        .map((docItem) => normalizeFirestoreProduct({ id: docItem.id, ...docItem.data() }))
        .filter(Boolean);

      setProducts(items);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      (liveOrders) => setOrders(liveOrders),
      (error) => console.error("Failed to load orders for inventory:", error)
    );

    return () => unsubscribe();
  }, []);

  const inventoryRows = useMemo(
    () => buildInventoryRows(products, orders),
    [orders, products]
  );
  const inventoryStats = useMemo(
    () => buildInventoryStats(inventoryRows),
    [inventoryRows]
  );
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return inventoryRows.filter((item) => {
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        [item.sku, item.product, item.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesQuery;
    });
  }, [inventoryRows, query, statusFilter]);

  return (
    <section id="inventory" className="admin-module-section admin-search-target">
      <div className="admin-page-head">
        <div>
          <h2>Inventory</h2>
          <p>Track stock position and replenishment risks across live SKUs.</p>
        </div>
      </div>

      <div className="admin-summary-strip">
        {inventoryStats.map((item) => (
          <div key={item.label} className={`admin-summary-card tone-${item.tone}`}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="admin-filter-row">
        <input
          className="admin-inline-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter inventory by product, SKU, or category..."
        />

        <select
          className="admin-inline-search"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
          <option value="Coming Soon">Coming Soon</option>
        </select>
      </div>

      <div className="admin-module-card">
        <DataTable columns={columns} rows={filteredRows} rowKey="id" />
      </div>
    </section>
  );
};

export default Inventory;
