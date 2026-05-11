import ActionButton from "../components/ActionButton";
import DataTable from "../components/DataTable";
import { adminUsers } from "../data/adminData";

const columns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "lastLogin", label: "Last Login" },
  { key: "status", label: "Status", type: "status" },
];

const AdminUsers = () => {
  return (
    <section className="admin-module-section">
      <div className="admin-page-head">
        <div>
          <h2>Admin Users</h2>
          <p>Manage access to the admin workspace and store controls.</p>
        </div>
        <div className="admin-page-actions">
          <ActionButton variant="primary">+ Add Admin User</ActionButton>
        </div>
      </div>

      <div className="admin-module-card">
        <DataTable columns={columns} rows={adminUsers} rowKey="email" />
      </div>
    </section>
  );
};

export default AdminUsers;
