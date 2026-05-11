import { fallbackCatalog } from "../../lib/catalog";

const priceLabel = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

const inventorySeed = {
  "mirchi-powder": { sku: "SR-MP-001", stock: 86, reserved: 12, reorder: 20 },
  "lahsun-mirchi-masala": { sku: "SR-LM-002", stock: 54, reserved: 8, reorder: 16 },
  "turmeric-colour": { sku: "SR-TC-003", stock: 122, reserved: 10, reorder: 24 },
  "turmeric-aromatic": { sku: "SR-TA-004", stock: 47, reserved: 7, reorder: 16 },
  "turmeric-colour-aromatic": { sku: "SR-TA-005", stock: 38, reserved: 5, reorder: 14 },
  "garam-masala": { sku: "SR-GM-006", stock: 14, reserved: 4, reorder: 18 },
  besan: { sku: "SR-BE-007", stock: 22, reserved: 5, reorder: 18 },
  "rice-flour": { sku: "SR-RF-008", stock: 19, reserved: 3, reorder: 15 },
  "wheat-flour": { sku: "SR-WF-009", stock: 64, reserved: 9, reorder: 20 },
  "bajara-flour": { sku: "SR-BF-010", stock: 31, reserved: 6, reorder: 14 },
  "jowar-flour": { sku: "SR-JF-011", stock: 27, reserved: 4, reorder: 14 },
  "nachani-flour": { sku: "SR-NF-012", stock: 24, reserved: 4, reorder: 12 },
  poha: { sku: "SR-PO-013", stock: 43, reserved: 7, reorder: 18 },
  "chana-dal": { sku: "SR-CD-014", stock: 17, reserved: 2, reorder: 16 },
};

const salesSeed = {
  "turmeric-colour": 426,
  "mirchi-powder": 398,
  "lahsun-mirchi-masala": 356,
  "garam-masala": 322,
  "turmeric-aromatic": 289,
  "turmeric-colour-aromatic": 268,
  besan: 248,
  "rice-flour": 210,
  "wheat-flour": 236,
  "bajara-flour": 172,
  "jowar-flour": 164,
  "nachani-flour": 149,
  poha: 188,
  "chana-dal": 157,
};

const categoryTone = {
  Masala: "amber",
  Flour: "orange",
  Pantry: "blue",
};

const catalogById = Object.fromEntries(fallbackCatalog.map((item) => [item.id, item]));

const getInventoryMeta = (id) =>
  inventorySeed[id] || { sku: `SR-${id.slice(0, 2).toUpperCase()}-000`, stock: 24, reserved: 3, reorder: 12 };

const getInventoryStatus = (stock, reorder) => {
  if (stock <= 0) {
    return "Out of Stock";
  }

  if (stock <= reorder) {
    return "Low Stock";
  }

  return "Active";
};

const inventoryEntries = fallbackCatalog.map((item) => {
  const meta = getInventoryMeta(item.id);
  const status = getInventoryStatus(meta.stock, meta.reorder);

  return {
    ...item,
    ...meta,
    status,
    sales: salesSeed[item.id] || 100,
  };
});

const lowStockEntries = inventoryEntries.filter((item) => item.stock <= item.reorder).slice(0, 4);

const categoryGroups = Object.values(
  fallbackCatalog.reduce((accumulator, item) => {
    if (!accumulator[item.category]) {
      accumulator[item.category] = {
        title: item.category,
        count: 0,
        image: item.image,
      };
    }

    accumulator[item.category].count += 1;
    return accumulator;
  }, {})
);

export const dashboardStats = [
  {
    id: "revenue",
    label: "Total Revenue",
    value: "Rs 28,45,680",
    change: "+12.4%",
    note: "vs Apr 2024",
    tone: "amber",
    points: [38, 44, 41, 52, 50, 58, 56, 64],
  },
  {
    id: "orders",
    label: "Total Orders",
    value: "1,842",
    change: "+8.7%",
    note: "since 01 May 2024",
    tone: "orange",
    points: [22, 28, 30, 33, 36, 39, 41, 46],
  },
  {
    id: "customers",
    label: "Total Customers",
    value: "1,256",
    change: "+15.2%",
    note: "active this month",
    tone: "red",
    points: [18, 21, 23, 27, 29, 32, 35, 38],
  },
  {
    id: "deliveries",
    label: "Pending Deliveries",
    value: "312",
    change: "+4.1%",
    note: "for dispatch follow-up",
    tone: "gold",
    points: [16, 18, 15, 19, 17, 21, 20, 24],
  },
];

export const revenueTrend = [
  { day: "01 May", value: 12 },
  { day: "08 May", value: 18 },
  { day: "15 May", value: 15 },
  { day: "22 May", value: 24 },
  { day: "29 May", value: 20 },
  { day: "31 May", value: 27 },
];

export const previousRevenueTrend = [
  { day: "01 May", value: 8 },
  { day: "08 May", value: 13 },
  { day: "15 May", value: 11 },
  { day: "22 May", value: 18 },
  { day: "29 May", value: 16 },
  { day: "31 May", value: 21 },
];

export const orderVolume = [
  { label: "01 May", total: 82 },
  { label: "05 May", total: 114 },
  { label: "09 May", total: 98 },
  { label: "13 May", total: 148 },
  { label: "17 May", total: 122 },
  { label: "21 May", total: 176 },
  { label: "25 May", total: 136 },
  { label: "29 May", total: 164 },
  { label: "31 May", total: 142 },
];

export const topSellingProducts = [
  "turmeric-colour",
  "mirchi-powder",
  "lahsun-mirchi-masala",
  "garam-masala",
  "turmeric-aromatic",
].map((id) => {
  const item = catalogById[id];
  const meta = getInventoryMeta(id);

  return {
    name: item.name,
    sku: meta.sku,
    sales: `${(salesSeed[id] || 0).toLocaleString("en-IN")} units`,
    image: item.image,
  };
});

export const lowStockProducts = lowStockEntries.map((item) => ({
  name: item.name,
  stock: `${item.stock} left`,
  tone: item.stock <= Math.max(10, item.reorder - 4) ? "danger" : "warning",
}));

export const recentOrders = [
  { orderId: "#SR84548", customer: "Rahul Sharma", amount: "Rs 2,145", status: "Delivered", date: "31 May 2024" },
  { orderId: "#SR84546", customer: "Priya Singh", amount: "Rs 2,560", status: "Shipped", date: "31 May 2024" },
  { orderId: "#SR84544", customer: "Amit Verma", amount: "Rs 980", status: "Processing", date: "30 May 2024" },
  { orderId: "#SR84543", customer: "Nisha Patel", amount: "Rs 1,450", status: "Pending", date: "30 May 2024" },
];

export const newCustomers = [
  { name: "Vivaan Singh", city: "Pune", joined: "31 May 2024" },
  { name: "Ajan Patil", city: "Kolhapur", joined: "31 May 2024" },
  { name: "Rihan Gupta", city: "Nagpur", joined: "30 May 2024" },
  { name: "Sneha Iyer", city: "Mumbai", joined: "30 May 2024" },
];

export const productRows = inventoryEntries.map((item) => ({
  product: item.name,
  category: item.category,
  price: priceLabel(item.price),
  stock: item.stock,
  status: item.status,
}));

export const categoryCards = categoryGroups.map((item) => ({
  title: item.title,
  count: `${item.count} Products`,
  image: item.image,
}));

export const ordersRows = [
  { orderId: "#SR84548", customer: "Rahul Sharma", amount: "Rs 2,145", payment: "Paid", status: "Delivered", date: "31 May 2024" },
  { orderId: "#SR84546", customer: "Priya Singh", amount: "Rs 2,560", payment: "Paid", status: "Shipped", date: "31 May 2024" },
  { orderId: "#SR84544", customer: "Amit Verma", amount: "Rs 980", payment: "COD", status: "Processing", date: "30 May 2024" },
  { orderId: "#SR84543", customer: "Nisha Patel", amount: "Rs 1,450", payment: "Paid", status: "Pending", date: "30 May 2024" },
  { orderId: "#SR84542", customer: "Karan Mehta", amount: "Rs 2,890", payment: "Paid", status: "Confirmed", date: "29 May 2024" },
  { orderId: "#SR84540", customer: "Siya Nair", amount: "Rs 740", payment: "Paid", status: "Cancelled", date: "29 May 2024" },
];

export const orderDetails = {
  orderId: "#SR84548",
  customer: "Rahul Sharma",
  phone: "9876543210",
  address: "12 MG Street, Ranchi, Jharkhand - 834001",
  payment: "Razorpay",
  status: "Delivered",
  items: [
    { name: "Mirchi Powder", qty: 2, price: "Rs 550", total: "Rs 1,100" },
    { name: "Turmeric Powder (Colour)", qty: 2, price: "Rs 300", total: "Rs 600" },
    { name: "Poha", qty: 1, price: "Rs 120", total: "Rs 120" },
  ],
  summary: [
    { label: "Subtotal", value: "Rs 1,820" },
    { label: "Shipping", value: "Rs 120" },
    { label: "Discount", value: "- Rs 95" },
    { label: "Total Amount", value: "Rs 1,845" },
  ],
};

export const inventoryStats = [
  { label: "Total SKUs", value: String(inventoryEntries.length), tone: "amber" },
  { label: "Low Stock", value: String(inventoryEntries.filter((item) => item.status === "Low Stock").length), tone: "warning" },
  { label: "Out of Stock", value: String(inventoryEntries.filter((item) => item.status === "Out of Stock").length), tone: "danger" },
  { label: "Ready To Reorder", value: String(lowStockEntries.length), tone: "info" },
];

export const inventoryRows = inventoryEntries.map((item) => ({
  sku: item.sku,
  product: item.name,
  stock: item.stock,
  reserved: item.reserved,
  reorder: item.reorder,
  status: item.status === "Active" ? "In Stock" : item.status,
}));

export const couponRows = [
  { code: "SPICEROOT10", discount: "10%", type: "Flat", usage: "480", expires: "15 Jun 2024", status: "Active" },
  { code: "MASALA20", discount: "20%", type: "Festival", usage: "120", expires: "30 Jun 2024", status: "Active" },
  { code: "FLOUR15", discount: "15%", type: "Combo", usage: "90", expires: "08 Jun 2024", status: "Expiring" },
  { code: "WELCOME05", discount: "5%", type: "First order", usage: "620", expires: "Always", status: "Active" },
];

export const customerRows = [
  { customer: "Rahul Sharma", email: "rahul@gmail.com", orders: 12, spend: "Rs 12,450", status: "Active" },
  { customer: "Priya Singh", email: "priya@gmail.com", orders: 9, spend: "Rs 8,960", status: "Active" },
  { customer: "Amit Verma", email: "amit@gmail.com", orders: 7, spend: "Rs 4,890", status: "Active" },
  { customer: "Nisha Patel", email: "nisha@gmail.com", orders: 6, spend: "Rs 7,410", status: "Active" },
  { customer: "Karan Mehta", email: "karan@gmail.com", orders: 4, spend: "Rs 2,980", status: "Inactive" },
  { customer: "Siya Nair", email: "siya@gmail.com", orders: 11, spend: "Rs 9,350", status: "Active" },
];

export const customerProfile = {
  name: "Rahul Sharma",
  email: "rahul@gmail.com",
  phone: "9876543210",
  address: "12 MG Street, Ranchi, Jharkhand - 834001",
  totalOrders: 12,
  totalSpend: "Rs 12,450",
  loyaltyPoints: 118,
  lastActive: "31 May 2024",
  favorite: "Masala",
  notes: "Repeat buyer with strong preference for bulk kitchen staples and premium masalas.",
};

export const customerHistory = [
  { orderId: "#SR84548", date: "31 May 2024", amount: "Rs 2,145", status: "Delivered" },
  { orderId: "#SR84544", date: "30 May 2024", amount: "Rs 1,160", status: "Processing" },
  { orderId: "#SR84522", date: "24 May 2024", amount: "Rs 1,940", status: "Delivered" },
  { orderId: "#SR84510", date: "20 May 2024", amount: "Rs 2,150", status: "Delivered" },
];

export const reviewRows = [
  { product: "Garam Masala", customer: "Rahul Sharma", rating: 5, review: "Excellent quality", status: "Approved" },
  { product: "Turmeric Powder (Colour)", customer: "Priya Singh", rating: 4, review: "Great aroma and color", status: "Approved" },
  { product: "Mirchi Powder", customer: "Amit Verma", rating: 5, review: "Very spicy and fresh", status: "Approved" },
  { product: "Besan", customer: "Nisha Patel", rating: 4, review: "Smooth texture for batter", status: "Pending" },
];

export const paymentRows = [
  { paymentId: "PAY8951", orderId: "#SR84548", customer: "Rahul Sharma", amount: "Rs 2,145", method: "Razorpay", status: "Paid", date: "31 May 2024" },
  { paymentId: "PAY8948", orderId: "#SR84546", customer: "Priya Singh", amount: "Rs 2,560", method: "Razorpay", status: "Paid", date: "31 May 2024" },
  { paymentId: "PAY8942", orderId: "#SR84544", customer: "Amit Verma", amount: "Rs 980", method: "COD", status: "Pending", date: "30 May 2024" },
  { paymentId: "PAY8938", orderId: "#SR84543", customer: "Nisha Patel", amount: "Rs 1,450", method: "Razorpay", status: "Refunded", date: "30 May 2024" },
];

export const shippingRows = [
  { shipmentId: "SHIP8456", orderId: "#SR84548", courier: "DTDC", tracking: "1234567890", status: "Delivered", dispatch: "30 May 2024", eta: "31 May 2024" },
  { shipmentId: "SHIP8448", orderId: "#SR84546", courier: "Blue Dart", tracking: "9876543210", status: "Shipped", dispatch: "31 May 2024", eta: "02 Jun 2024" },
  { shipmentId: "SHIP8442", orderId: "#SR84544", courier: "Delhivery", tracking: "5566778899", status: "Processing", dispatch: "30 May 2024", eta: "02 Jun 2024" },
  { shipmentId: "SHIP8438", orderId: "#SR84543", courier: "Xpressbees", tracking: "2233445566", status: "Pending", dispatch: "31 May 2024", eta: "03 Jun 2024" },
];

export const analyticsSummary = [
  { label: "Revenue", value: "Rs 28,45,680", change: "+12.4%" },
  { label: "Orders", value: "1,842", change: "+8.7%" },
  { label: "Customers", value: "1,256", change: "+15.2%" },
  { label: "Conversion", value: "2.45%", change: "+0.3%" },
];

export const channelMix = categoryGroups.map((item) => ({
  label: item.title,
  share: Math.round((item.count / fallbackCatalog.length) * 100),
  tone: categoryTone[item.title] || "amber",
}));

export const queryRows = [
  { queryId: "QRY901", customer: "Rahul Sharma", subject: "Order not delivered", status: "Open", date: "31 May 2024" },
  { queryId: "QRY900", customer: "Priya Singh", subject: "Refund request", status: "Resolved", date: "31 May 2024" },
  { queryId: "QRY898", customer: "Amit Verma", subject: "Product quality issue", status: "In Progress", date: "30 May 2024" },
  { queryId: "QRY894", customer: "Nisha Patel", subject: "Delivery address change", status: "Closed", date: "30 May 2024" },
];

export const cmsBanners = [
  { title: "Summer Sale Banner", location: "Home slider", status: "Active", image: catalogById["turmeric-colour"]?.image || "/images/haldi.png" },
  { title: "Premium Masala Banner", location: "Category banner", status: "Active", image: catalogById["garam-masala"]?.image || "/images/garam.png" },
  { title: "Free Shipping Banner", location: "Top bar", status: "Draft", image: catalogById["mirchi-powder"]?.image || "/images/mirchi.png" },
];

export const adminUsers = [
  { name: "Admin User", email: "admin@spiceroot.com", role: "Super Admin", lastLogin: "31 May 2024", status: "Active" },
  { name: "Inventory Manager", email: "inventory@spiceroot.com", role: "Inventory", lastLogin: "30 May 2024", status: "Active" },
  { name: "Order Manager", email: "orders@spiceroot.com", role: "Operations", lastLogin: "30 May 2024", status: "Active" },
  { name: "Support Manager", email: "support@spiceroot.com", role: "Support", lastLogin: "29 May 2024", status: "Active" },
];

export const settingsSections = [
  {
    title: "Store Settings",
    fields: [
      { label: "Store Name", value: "Spice Root" },
      { label: "Store Email", value: "hello@spiceroot.com" },
      { label: "Store Phone", value: "+91 98765 43210" },
    ],
  },
  {
    title: "Payment Settings",
    fields: [
      { label: "Gateway", value: "Razorpay" },
      { label: "Auto Refunds", value: "Disabled" },
      { label: "COD Limit", value: "Rs 3,000" },
    ],
  },
  {
    title: "Delivery Settings",
    fields: [
      { label: "Free Shipping Threshold", value: "Rs 999" },
      { label: "Default SLA", value: "2-4 business days" },
      { label: "Return Window", value: "7 days" },
    ],
  },
];
