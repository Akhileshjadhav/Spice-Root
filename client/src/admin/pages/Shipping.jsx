import DataTable from "../components/DataTable";
import { shippingRows } from "../data/adminData";

const columns = [
  { key: "shipmentId", label: "Shipment ID" },
  { key: "orderId", label: "Order ID" },
  { key: "courier", label: "Courier" },
  { key: "tracking", label: "Tracking" },
  { key: "status", label: "Status", type: "status" },
  { key: "dispatch", label: "Dispatch Date" },
  { key: "eta", label: "ETA" },
];

const Shipping = () => {
  return (
    <section className="admin-module-section">
      <div className="admin-page-head">
        <div>
          <h2>Shipping / Delivery</h2>
          <p>Watch courier movement and delivery deadlines.</p>
        </div>
      </div>

      <div className="admin-module-card">
        <DataTable columns={columns} rows={shippingRows} rowKey="shipmentId" />
      </div>
    </section>
  );
};

export default Shipping;
