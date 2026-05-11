import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import {
  FaArrowRight,
  FaBoxOpen,
  FaChartLine,
  FaCog,
  FaGlobe,
  FaLayerGroup,
  FaMoneyBillWave,
  FaQuestionCircle,
  FaShoppingCart,
  FaSignOutAlt,
  FaStar,
  FaStore,
  FaTruck,
  FaUserShield,
  FaUsers,
  FaWarehouse,
  FaPepperHot,
} from "react-icons/fa";
import { useAuth } from "../../context/useAuth";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const { logoutUser } = useAuth();

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <FaChartLine /> },
    { name: "Products", path: "/admin/products", icon: <FaBoxOpen /> },
    { name: "Categories", path: "/admin/categories", icon: <FaLayerGroup /> },
    { name: "Inventory", path: "/admin/inventory", icon: <FaWarehouse /> },
    { name: "Orders", path: "/admin/orders", icon: <FaShoppingCart /> },
    { name: "Customers", path: "/admin/customers", icon: <FaUsers /> },
    { name: "Coupons & Offers", path: "/admin/coupons", icon: <FaMoneyBillWave /> },
    { name: "Reviews", path: "/admin/reviews", icon: <FaStar /> },
    { name: "Payments", path: "/admin/payments", icon: <FaMoneyBillWave /> },
    { name: "Shipping", path: "/admin/shipping", icon: <FaTruck /> },
    { name: "Analytics", path: "/admin/analytics", icon: <FaChartLine /> },
    { name: "Customer Queries", path: "/admin/queries", icon: <FaQuestionCircle /> },
    { name: "Website CMS", path: "/admin/cms", icon: <FaGlobe /> },
    { name: "Admin Users", path: "/admin/users", icon: <FaUserShield /> },
    { name: "Settings", path: "/admin/settings", icon: <FaCog /> },
  ];

  const handleLogout = async () => {
    await logoutUser();
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <div className="admin-brand-mark">
          <FaPepperHot />
        </div>
        <div>
          <strong>Spice Root</strong>
          <span>Premium Masala Admin</span>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `admin-sidebar-link${isActive ? " active" : ""}`}
          >
            <span className="admin-sidebar-link-dot" />
            <span className="admin-sidebar-link-icon">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}

        <div className="admin-sidebar-promo">
          <span className="admin-mini-label">Live Control</span>
          <h3>Preview storefront updates</h3>
          <p>Open the website anytime to verify banners, pricing, and live product changes.</p>
          <div className="admin-sidebar-stats">
            <span><FaStore /> Website</span>
            <span><FaArrowRight /> Preview</span>
          </div>
        </div>

        <NavLink to="/" className="admin-sidebar-link" target="_blank" rel="noreferrer">
          <span className="admin-sidebar-link-dot" />
          <span className="admin-sidebar-link-icon"><FaStore /></span>
          <span>Preview Website</span>
        </NavLink>

        <button type="button" className="admin-sidebar-link admin-sidebar-logout" onClick={handleLogout}>
          <span className="admin-sidebar-link-dot" />
          <span className="admin-sidebar-link-icon"><FaSignOutAlt /></span>
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
