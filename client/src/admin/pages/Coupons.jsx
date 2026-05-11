import ActionButton from "../components/ActionButton";
import DataTable from "../components/DataTable";
import { couponRows } from "../data/adminData";

const columns = [
  { key: "code", label: "Coupon Code" },
  { key: "discount", label: "Discount" },
  { key: "type", label: "Type" },
  { key: "usage", label: "Usage" },
  { key: "expires", label: "Expires" },
  { key: "status", label: "Status", type: "status" },
];

const Coupons = () => {
  return (
    <section className="admin-module-section">
      <div className="admin-page-head">
        <div>
          <h2>Coupons & Offers</h2>
          <p>Launch discounts and monitor campaign performance.</p>
        </div>
        <div className="admin-page-actions">
          <ActionButton variant="primary">+ Add Coupon</ActionButton>
        </div>
      </div>

      <div className="admin-module-card">
        <DataTable columns={columns} rows={couponRows} rowKey="code" />
      </div>
    </section>
  );
};

export default Coupons;
