import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, serverTimestamp } from "../firebase";
import { formatPrice, slugify } from "./catalog";

const DEFAULT_CATEGORY_DEFINITIONS = [
  {
    id: "masala",
    name: "Masala",
    image: "/images/mirchi.png",
    description: "Signature spice blends and pantry heroes for everyday cooking.",
  },
  {
    id: "flour",
    name: "Flour",
    image: "/images/besan.png",
    description: "Fresh milling staples for rotis, bhakri, batter, and baking.",
  },
  {
    id: "pantry",
    name: "Pantry",
    image: "/images/poha.png",
    description: "Kitchen essentials that keep the everyday shelf ready to cook.",
  },
];

const ORDER_ALERT_STATUSES = new Set(["placed", "pending", "processing", "confirmed"]);
const CLOSED_ORDER_STATUSES = new Set(["delivered", "cancelled", "canceled"]);
const ORDER_STATUS_OPTIONS = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const REVIEW_STATUS_OPTIONS = ["Pending", "Approved", "Hidden"];
const MILLIS_IN_DAY = 24 * 60 * 60 * 1000;

function normalizeLabel(value, fallback = "") {
  const normalizedValue = String(value || "").trim();
  return normalizedValue || fallback;
}

function normalizeStatus(value, fallback = "Pending") {
  const normalizedValue = normalizeLabel(value, fallback)
    .replace(/[_-]+/g, " ")
    .toLowerCase();

  return normalizedValue.replace(/\b\w/g, (character) => character.toUpperCase());
}

function getCreatedAtTime(value) {
  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsedDate = new Date(value || 0);
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
}

function toDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatOrderDate(value) {
  const rawDate = toDate(value);

  if (!rawDate) {
    return "Just now";
  }

  return rawDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(value) {
  const rawDate = toDate(value);

  if (!rawDate) {
    return "Today";
  }

  return rawDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function formatDateTime(value) {
  const rawDate = toDate(value);

  if (!rawDate) {
    return "Just now";
  }

  return rawDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildSku(value = "") {
  const parts = slugify(value)
    .split("-")
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part.slice(0, 2).toUpperCase());

  return `SR-${parts.join("") || "PRD"}`;
}

function getStartOfDayTimestamp(date) {
  const rawDate = new Date(date);
  rawDate.setHours(0, 0, 0, 0);
  return rawDate.getTime();
}

function isWithinDays(value, dayCount) {
  const time = getCreatedAtTime(value);

  if (!time) {
    return false;
  }

  return Date.now() - time <= dayCount * MILLIS_IN_DAY;
}

function formatJoinedLabel(value) {
  if (!value) {
    return "Joined recently";
  }

  return `Joined ${formatShortDate(value)}`;
}

export function getProductStatusOptions() {
  return ["Active", "Low Stock", "Coming Soon"];
}

export function getOrderStatusOptions() {
  return ORDER_STATUS_OPTIONS;
}

export function getReviewStatusOptions() {
  return REVIEW_STATUS_OPTIONS;
}

export function getDefaultCategoryDefinitions() {
  return DEFAULT_CATEGORY_DEFINITIONS;
}

export function buildCategoryPayload(values) {
  return {
    name: normalizeLabel(values.name),
    image: normalizeLabel(values.image),
    description: normalizeLabel(values.description),
  };
}

export async function saveCategory(categoryId, values) {
  const name = normalizeLabel(values.name);
  const resolvedCategoryId = slugify(categoryId || name);

  if (!resolvedCategoryId) {
    throw new Error("Category name is required.");
  }

  await setDoc(doc(db, "categories", resolvedCategoryId), buildCategoryPayload(values), {
    merge: true,
  });

  return resolvedCategoryId;
}

export async function deleteCategory(categoryId) {
  if (!categoryId) {
    throw new Error("Category reference is missing.");
  }

  await deleteDoc(doc(db, "categories", categoryId));
}

export function mergeCategoriesWithProducts(categoryDocs = [], products = []) {
  const categories = new Map(
    DEFAULT_CATEGORY_DEFINITIONS.map((category) => [
      category.id,
      {
        ...category,
        productCount: 0,
      },
    ])
  );

  categoryDocs.forEach((item) => {
    const name = normalizeLabel(item.name, item.id);
    const id = slugify(item.id || name);

    categories.set(id, {
      id,
      name,
      image: normalizeLabel(item.image),
      description: normalizeLabel(item.description),
      productCount: categories.get(id)?.productCount || 0,
    });
  });

  products.forEach((product) => {
    const name = normalizeLabel(product.category, "Uncategorized");
    const id = slugify(name);
    const current = categories.get(id) || {
      id,
      name,
      image: "",
      description: "",
      productCount: 0,
    };

    categories.set(id, {
      ...current,
      name,
      image: current.image || product.image || "",
      productCount: (current.productCount || 0) + 1,
    });
  });

  return Array.from(categories.values()).sort((left, right) =>
    left.name.localeCompare(right.name)
  );
}

export function subscribeToCategories(onCategories, onError) {
  return onSnapshot(
    collection(db, "categories"),
    (snapshot) => {
      const categoryDocs = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      onCategories(categoryDocs);
    },
    onError
  );
}

export function normalizeOrderRecord(record) {
  const customer = record.customer || {};
  const status = normalizeStatus(record.status, "Pending");
  const paymentMethod = normalizeLabel(
    record.paymentMethod || record.payment || "",
    "Cash on Delivery"
  );
  const paymentStatus = normalizeStatus(
    record.paymentStatus || (paymentMethod === "Cash on Delivery" ? "Pending" : "Paid"),
    paymentMethod === "Cash on Delivery" ? "Pending" : "Paid"
  );
  const customerName = normalizeLabel(
    record.customerName || customer.fullName || customer.name || record.customer,
    "Customer"
  );
  const phone = normalizeLabel(
    customer.mobileNumber || customer.phone || record.phone,
    "Not provided"
  );
  const address = [
    customer.addressLine1 || record.addressLine1 || record.address,
    customer.addressLine2 || record.addressLine2,
    customer.city || record.city,
    customer.state || record.state,
    customer.pincode || record.pincode,
  ]
    .filter(Boolean)
    .join(", ");
  const total = Number(record.total) || 0;
  const createdAt = record.createdAt || null;

  return {
    id: record.id,
    orderId: record.orderId || record.orderNumber || record.id,
    userId: record.userId || "",
    customerName,
    customerEmail: normalizeLabel(customer.email || record.customerEmail),
    phone,
    address: address || "Address not provided",
    amount: total,
    amountLabel: formatPrice(total),
    paymentMethod,
    paymentStatus,
    paymentProvider: normalizeLabel(record.paymentProvider),
    paymentMode: normalizeLabel(record.paymentMode),
    paymentId: normalizeLabel(record.paymentId),
    paidAt: record.paidAt || null,
    razorpayOrderId: normalizeLabel(record.razorpayOrderId),
    razorpaySignature: normalizeLabel(record.razorpaySignature),
    status,
    date: formatOrderDate(createdAt),
    createdAt,
    updatedAt: record.updatedAt || null,
    itemCount: Number(record.itemCount) || 0,
    items: Array.isArray(record.items) ? record.items : [],
    raw: record,
  };
}

export function subscribeToOrders(onOrders, onError) {
  return onSnapshot(
    collectionGroup(db, "orders"),
    (snapshot) => {
      const orders = snapshot.docs
        .map((item) =>
          normalizeOrderRecord({
            id: item.id,
            ...item.data(),
            userId: item.ref.parent.parent?.id || "",
          })
        )
        .sort((left, right) => getCreatedAtTime(right.createdAt) - getCreatedAtTime(left.createdAt));

      onOrders(orders);
    },
    onError
  );
}

export async function updateOrderStatus(order, status) {
  if (!order?.userId || !order?.id) {
    throw new Error("Order reference is missing.");
  }

  await updateDoc(doc(db, "users", order.userId, "orders", order.id), {
    status: String(status || "Pending").toLowerCase(),
    updatedAt: serverTimestamp(),
  });
}

export async function createAdminOrderNotification(order) {
  await addDoc(collection(db, "adminNotifications"), buildAdminOrderNotificationPayload(order));
}

export function buildAdminOrderNotificationPayload(order) {
  const normalizedOrder = normalizeOrderRecord(order);

  return {
    type: "order",
    userId: normalizedOrder.userId,
    orderId: normalizedOrder.orderId,
    orderDocumentId: normalizedOrder.id,
    customerName: normalizedOrder.customerName,
    customerEmail: normalizedOrder.customerEmail,
    status: "Unread",
    orderStatus: normalizedOrder.status,
    createdAt: serverTimestamp(),
  };
}

function normalizeNotificationRecord(record) {
  const status = normalizeStatus(record.status, "Unread");
  const customerName = normalizeLabel(record.customerName, "Customer");
  const orderId = normalizeLabel(record.orderId, record.orderDocumentId || record.id);

  return {
    id: record.id,
    type: record.type || "order",
    userId: record.userId || "",
    orderId,
    orderDocumentId: record.orderDocumentId || "",
    customerName,
    customerEmail: normalizeLabel(record.customerEmail),
    status,
    orderStatus: normalizeStatus(record.orderStatus, "Pending"),
    createdAt: record.createdAt || null,
    date: formatDateTime(record.createdAt),
    title: `${customerName} placed a new order`,
    message: `Order ${orderId} is waiting for admin review.`,
    isUnread: status === "Unread",
  };
}

export function subscribeToAdminNotifications(onNotifications, onError) {
  return onSnapshot(
    collection(db, "adminNotifications"),
    (snapshot) => {
      const notifications = snapshot.docs
        .map((item) => normalizeNotificationRecord({ id: item.id, ...item.data() }))
        .sort((left, right) => getCreatedAtTime(right.createdAt) - getCreatedAtTime(left.createdAt));

      onNotifications(notifications);
    },
    onError
  );
}

export async function markAdminNotificationAsRead(notificationId) {
  if (!notificationId) {
    return;
  }

  await updateDoc(doc(db, "adminNotifications", notificationId), {
    status: "Read",
    readAt: serverTimestamp(),
  });
}

export async function acknowledgeAdminOrderNotification(notification) {
  if (!notification?.id) {
    return;
  }

  await markAdminNotificationAsRead(notification.id);
}

export function getOrderNotificationCounts(orders = [], notifications = []) {
  const unreadNotifications = notifications.filter((item) => item.isUnread).length;

  return orders.reduce(
    (counts, order) => {
      const normalizedStatus = String(order.status || "").trim().toLowerCase();

      if (!CLOSED_ORDER_STATUSES.has(normalizedStatus)) {
        counts.pendingDeliveries += 1;
      }

      return counts;
    },
    { newOrders: unreadNotifications, pendingDeliveries: 0 }
  );
}

export function getPendingAdminOrders(orders = []) {
  return orders;
}

export function isPaidOrder(order) {
  return String(order?.paymentStatus || "").trim().toLowerCase() === "paid";
}

export function buildPaymentRows(orders = []) {
  return orders
    .filter((order) => order.paymentMethod || order.paymentStatus)
    .map((order) => ({
      paymentId: order.paymentId || `PAY-${order.id}`,
      orderId: order.orderId,
      customer: order.customerName,
      amount: order.amountLabel,
      amountValue: order.amount,
      method: order.paymentMethod,
      status: order.paymentStatus,
      date: order.date,
      raw: order,
    }));
}

function normalizeContactSubmissionRecord(record) {
  const createdAt = record.createdAt || null;
  const updatedAt = record.updatedAt || null;
  const adminReply = normalizeLabel(record.adminReply);
  const status = normalizeStatus(record.status, "New");

  return {
    id: record.id,
    userId: record.userId || "",
    name: normalizeLabel(record.name, "Customer"),
    email: normalizeLabel(record.email, "No email"),
    message: normalizeLabel(record.message),
    status,
    createdAt,
    updatedAt,
    date: formatOrderDate(createdAt),
    dateTime: formatDateTime(createdAt),
    adminSeen: Boolean(record.adminSeen),
    adminReply,
    adminReplyAt: record.adminReplyAt || null,
    userReplySeen: adminReply ? Boolean(record.userReplySeen) : true,
    hasUnreadReply: Boolean(adminReply) && !record.userReplySeen,
    subject: normalizeLabel(record.subject, normalizeLabel(record.message).slice(0, 42) || "Customer query"),
    preview:
      normalizeLabel(record.message).slice(0, 82) +
      (normalizeLabel(record.message).length > 82 ? "..." : ""),
  };
}

export function subscribeToContactSubmissions(onSubmissions, onError) {
  return onSnapshot(
    collection(db, "contactSubmissions"),
    (snapshot) => {
      const submissions = snapshot.docs
        .map((item) => normalizeContactSubmissionRecord({ id: item.id, ...item.data() }))
        .sort((left, right) => getCreatedAtTime(right.createdAt) - getCreatedAtTime(left.createdAt));

      onSubmissions(submissions);
    },
    onError
  );
}

export function subscribeToUserContactSubmissions(userId, email, onSubmissions, onError) {
  if (!userId && !email) {
    onSubmissions([]);
    return () => {};
  }

  const submissionsById = new Map();

  const pushMergedSubmissions = () => {
    const submissions = Array.from(submissionsById.values()).sort(
      (left, right) => getCreatedAtTime(right.createdAt) - getCreatedAtTime(left.createdAt)
    );
    onSubmissions(submissions);
  };

  const unsubscribers = [];

  if (userId) {
    unsubscribers.push(
      onSnapshot(
        query(collection(db, "contactSubmissions"), where("userId", "==", userId)),
        (snapshot) => {
          snapshot.docs.forEach((item) => {
            submissionsById.set(
              item.id,
              normalizeContactSubmissionRecord({ id: item.id, ...item.data() })
            );
          });
          pushMergedSubmissions();
        },
        onError
      )
    );
  }

  if (email) {
    unsubscribers.push(
      onSnapshot(
        query(collection(db, "contactSubmissions"), where("email", "==", email)),
        (snapshot) => {
          snapshot.docs.forEach((item) => {
            submissionsById.set(
              item.id,
              normalizeContactSubmissionRecord({ id: item.id, ...item.data() })
            );
          });
          pushMergedSubmissions();
        },
        onError
      )
    );
  }

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}

export async function markContactSubmissionAsRead(submissionId) {
  if (!submissionId) {
    return;
  }

  await updateDoc(doc(db, "contactSubmissions", submissionId), {
    adminSeen: true,
    updatedAt: serverTimestamp(),
  });
}

export async function replyToContactSubmission(submissionId, reply, currentStatus = "Replied") {
  if (!submissionId) {
    return;
  }

  await updateDoc(doc(db, "contactSubmissions", submissionId), {
    adminReply: normalizeLabel(reply),
    adminReplyAt: serverTimestamp(),
    adminSeen: true,
    userReplySeen: false,
    status: normalizeStatus(currentStatus, "Replied"),
    updatedAt: serverTimestamp(),
  });
}

export async function markContactReplyAsSeen(submissionId) {
  if (!submissionId) {
    return;
  }

  await updateDoc(doc(db, "contactSubmissions", submissionId), {
    userReplySeen: true,
    updatedAt: serverTimestamp(),
  });
}

function normalizeUserQueryReplyRecord(record) {
  return {
    id: record.id,
    submissionId: record.submissionId || "",
    subject: normalizeLabel(record.subject, "Admin reply"),
    adminReply: normalizeLabel(record.adminReply),
    createdAt: record.createdAt || null,
    dateTime: formatDateTime(record.createdAt),
    seen: Boolean(record.seen),
  };
}

export function subscribeToUserQueryReplyNotifications(userId, onNotifications, onError) {
  if (!userId) {
    onNotifications([]);
    return () => {};
  }

  return onSnapshot(
    collection(db, "users", userId, "queryReplies"),
    (snapshot) => {
      const notifications = snapshot.docs
        .map((item) => normalizeUserQueryReplyRecord({ id: item.id, ...item.data() }))
        .sort((left, right) => getCreatedAtTime(right.createdAt) - getCreatedAtTime(left.createdAt));

      onNotifications(notifications);
    },
    onError
  );
}

export async function createUserQueryReplyNotification(userId, submissionId, subject, adminReply) {
  if (!userId || !submissionId) {
    return;
  }

  await setDoc(
    doc(db, "users", userId, "queryReplies", submissionId),
    {
      submissionId,
      subject: normalizeLabel(subject, "Customer query"),
      adminReply: normalizeLabel(adminReply),
      seen: false,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function markUserQueryReplyNotificationSeen(userId, notificationId) {
  if (!userId || !notificationId) {
    return;
  }

  await updateDoc(doc(db, "users", userId, "queryReplies", notificationId), {
    seen: true,
  });
}

function getOrderedStockByProductId(orders = []) {
  return orders.reduce((lookup, order) => {
    const normalizedStatus = String(order.status || "").trim().toLowerCase();

    if (CLOSED_ORDER_STATUSES.has(normalizedStatus)) {
      return lookup;
    }

    order.items.forEach((item) => {
      const key = item.id || item.slug || item.name;

      if (!key) {
        return;
      }

      lookup.set(key, (lookup.get(key) || 0) + Math.max(0, Number(item.quantity) || 0));
    });

    return lookup;
  }, new Map());
}

function getInventoryStatus(product, availableStock, reorderLevel) {
  if (product.status === "Coming Soon") {
    return "Coming Soon";
  }

  if (availableStock <= 0) {
    return "Out of Stock";
  }

  if (availableStock <= reorderLevel || product.status === "Low Stock") {
    return "Low Stock";
  }

  return "Active";
}

export function buildInventoryRows(products = [], orders = []) {
  const orderedStockLookup = getOrderedStockByProductId(orders);

  return products.map((product) => {
    const key = product.documentId || product.id || product.slug;
    const totalStock = Math.max(0, Number(product.stock) || 0);
    const orderedStock = Math.max(
      0,
      orderedStockLookup.get(key) || orderedStockLookup.get(product.id) || 0
    );
    const availableStock = Math.max(0, totalStock - orderedStock);
    const reorderLevel = Math.max(1, Number(product.reorderLevel) || 10);
    const status = getInventoryStatus(product, availableStock, reorderLevel);

    return {
      id: key,
      sku: product.sku || buildSku(product.slug || product.name),
      product: product.name,
      category: product.category,
      totalStock,
      orderedStock,
      availableStock,
      reorderLevel,
      status,
    };
  });
}

export function buildInventoryStats(rows = []) {
  const lowStockCount = rows.filter((item) => item.status === "Low Stock").length;
  const outOfStockCount = rows.filter((item) => item.status === "Out of Stock").length;
  const reorderCount = rows.filter(
    (item) => item.availableStock > 0 && item.availableStock <= item.reorderLevel
  ).length;

  return [
    { label: "Total SKUs", value: String(rows.length), tone: "amber" },
    { label: "Low Stock", value: String(lowStockCount), tone: "warning" },
    { label: "Out of Stock", value: String(outOfStockCount), tone: "danger" },
    { label: "Ready To Reorder", value: String(reorderCount), tone: "info" },
  ];
}

function normalizeUserRecord(record) {
  const name = normalizeLabel(record.name || record.firstName, "Spice Root customer");

  return {
    id: record.id || record.uid,
    uid: record.uid || record.id || "",
    name,
    firstName: normalizeLabel(record.firstName, name.split(/\s+/)[0] || "Customer"),
    email: normalizeLabel(record.email, "No email"),
    phoneNumber: normalizeLabel(record.phoneNumber),
    city: normalizeLabel(record.city),
    state: normalizeLabel(record.state),
    addressLine1: normalizeLabel(record.addressLine1),
    addressLine2: normalizeLabel(record.addressLine2),
    pincode: normalizeLabel(record.pincode),
    createdAt: record.createdAt || null,
    updatedAt: record.updatedAt || null,
    lastLoginAt: record.lastLoginAt || null,
  };
}

export function subscribeToUsers(onUsers, onError) {
  return onSnapshot(
    collection(db, "users"),
    (snapshot) => {
      const users = snapshot.docs
        .map((item) => normalizeUserRecord({ id: item.id, ...item.data() }))
        .sort((left, right) => getCreatedAtTime(right.createdAt) - getCreatedAtTime(left.createdAt));

      onUsers(users);
    },
    onError
  );
}

function buildCustomerStatus(user, orders) {
  if (orders.some((item) => isWithinDays(item.createdAt, 14))) {
    return "Active";
  }

  if (isWithinDays(user.lastLoginAt, 30)) {
    return "Active";
  }

  if (orders.length > 0) {
    return "Returning";
  }

  return "New";
}

export function buildCustomerRows(users = [], orders = []) {
  const ordersByUser = orders.reduce((lookup, order) => {
    if (!order.userId) {
      return lookup;
    }

    const list = lookup.get(order.userId) || [];
    list.push(order);
    lookup.set(order.userId, list);
    return lookup;
  }, new Map());

  return users
    .map((user) => {
      const customerOrders = ordersByUser.get(user.uid) || [];
      const totalSpendValue = customerOrders.reduce(
        (total, order) => total + Math.max(0, Number(order.amount) || 0),
        0
      );
      const latestOrder = customerOrders
        .slice()
        .sort((left, right) => getCreatedAtTime(right.createdAt) - getCreatedAtTime(left.createdAt))[0];

      return {
        id: user.uid,
        uid: user.uid,
        customer: user.name,
        email: user.email,
        orders: customerOrders.length,
        spend: formatPrice(totalSpendValue),
        totalSpendValue,
        totalSpend: totalSpendValue,
        status: buildCustomerStatus(user, customerOrders),
        phone: user.phoneNumber || "Not provided",
        city: user.city || "Not provided",
        lastOrderDate: latestOrder?.date || "No orders yet",
        joined: formatJoinedLabel(user.createdAt),
        createdAt: user.createdAt,
      };
    })
    .sort((left, right) => right.totalSpendValue - left.totalSpendValue || right.orders - left.orders);
}

export function buildCustomerDetails(users = [], orders = [], reviews = [], userId = "") {
  const requestedProfile = userId ? users.find((item) => item.uid === userId) || null : null;
  const profile = userId ? requestedProfile : users[0] || null;

  if (!profile) {
    return null;
  }

  const customerOrders = orders.filter((item) => item.userId === profile.uid);
  const customerReviews = reviews.filter((item) => item.userId === profile.uid);
  const totalSpendValue = customerOrders.reduce(
    (total, order) => total + Math.max(0, Number(order.amount) || 0),
    0
  );
  const favoriteProduct =
    customerOrders
      .flatMap((order) => order.items || [])
      .sort((left, right) => (right.quantity || 0) - (left.quantity || 0))[0]?.name || "No orders yet";

  return {
    id: profile.uid,
    name: profile.name,
    email: profile.email,
    phone: profile.phoneNumber || "Not provided",
    totalOrders: customerOrders.length,
    totalSpend: formatPrice(totalSpendValue),
    totalSpendValue,
    loyaltyPoints: String(customerOrders.length * 10),
    lastActive: customerOrders[0]?.date || formatOrderDate(profile.lastLoginAt || profile.createdAt),
    favorite: favoriteProduct,
    address: [
      profile.addressLine1,
      profile.addressLine2,
      profile.city,
      profile.state,
      profile.pincode,
    ]
      .filter(Boolean)
      .join(", ") || "Address not provided",
    notes:
      customerReviews[0]?.review ||
      "No customer notes yet. Once reviews or more orders arrive, this section updates automatically.",
    orders: customerOrders,
    reviews: customerReviews,
    status: buildCustomerStatus(profile, customerOrders),
  };
}

function normalizeReviewRecord(record) {
  const type = record.type === "overall" ? "overall" : "product";
  const productName =
    type === "overall"
      ? "Overall Store Review"
      : normalizeLabel(record.productName, "Product Review");
  const createdAt = record.createdAt || null;

  return {
    id: record.id,
    userId: record.userId || "",
    orderId: normalizeLabel(record.orderId),
    productId: normalizeLabel(record.productId),
    productName,
    product: productName,
    type,
    customer: normalizeLabel(record.customerName, "Customer"),
    customerEmail: normalizeLabel(record.customerEmail),
    rating: Math.max(1, Math.min(5, Number(record.rating) || 5)),
    review: normalizeLabel(record.review),
    status: normalizeStatus(record.status, "Pending"),
    createdAt,
    date: formatOrderDate(createdAt),
    isApproved: normalizeStatus(record.status, "Pending") === "Approved",
  };
}

export function subscribeToReviews(onReviews, onError) {
  return onSnapshot(
    collection(db, "reviews"),
    (snapshot) => {
      const reviews = snapshot.docs
        .map((item) => normalizeReviewRecord({ id: item.id, ...item.data() }))
        .sort((left, right) => getCreatedAtTime(right.createdAt) - getCreatedAtTime(left.createdAt));

      onReviews(reviews);
    },
    onError
  );
}

export async function submitReview(payload) {
  const type = payload.type === "overall" ? "overall" : "product";

  await addDoc(collection(db, "reviews"), {
    userId: payload.userId,
    customerName: normalizeLabel(payload.customerName, "Customer"),
    customerEmail: normalizeLabel(payload.customerEmail),
    orderId: normalizeLabel(payload.orderId),
    productId: type === "overall" ? "" : normalizeLabel(payload.productId),
    productName: type === "overall" ? "Overall Store Review" : normalizeLabel(payload.productName),
    type,
    rating: Math.max(1, Math.min(5, Number(payload.rating) || 5)),
    review: normalizeLabel(payload.review),
    status: "Pending",
    createdAt: serverTimestamp(),
  });
}

export async function updateReviewStatus(reviewId, status) {
  if (!reviewId) {
    return;
  }

  await updateDoc(doc(db, "reviews", reviewId), {
    status: normalizeStatus(status, "Pending"),
    updatedAt: serverTimestamp(),
  });
}

export function getReviewableDeliveredItems(orders = []) {
  return orders
    .filter((order) => String(order.status || "").trim().toLowerCase() === "delivered")
    .flatMap((order) =>
      (order.items || []).map((item) => ({
        orderId: order.orderId,
        productId: item.id || item.slug || "",
        productName: item.name,
        quantity: item.quantity,
      }))
    )
    .filter((item) => item.productId && item.productName)
    .filter(
      (item, index, list) =>
        list.findIndex(
          (candidate) =>
            candidate.orderId === item.orderId && candidate.productId === item.productId
        ) === index
    );
}

function buildDailyRevenueSeries(orders = [], dayOffset = 0, totalDays = 7) {
  return Array.from({ length: totalDays }, (_, index) => {
    const dayIndex = totalDays - 1 - index + dayOffset;
    const targetDate = new Date(Date.now() - dayIndex * MILLIS_IN_DAY);
    const startOfDay = getStartOfDayTimestamp(targetDate);
    const endOfDay = startOfDay + MILLIS_IN_DAY;
    const dailyTotal = orders.reduce((total, order) => {
      const orderTime = getCreatedAtTime(order.createdAt);

      if (orderTime < startOfDay || orderTime >= endOfDay) {
        return total;
      }

      return total + Math.max(0, Number(order.amount) || 0);
    }, 0);

    return {
      day: targetDate.toLocaleDateString("en-IN", { weekday: "short" }),
      value: dailyTotal,
    };
  });
}

function buildDailyOrderSeries(orders = [], totalDays = 7) {
  return Array.from({ length: totalDays }, (_, index) => {
    const dayIndex = totalDays - 1 - index;
    const targetDate = new Date(Date.now() - dayIndex * MILLIS_IN_DAY);
    const startOfDay = getStartOfDayTimestamp(targetDate);
    const endOfDay = startOfDay + MILLIS_IN_DAY;
    const total = orders.filter((order) => {
      const orderTime = getCreatedAtTime(order.createdAt);
      return orderTime >= startOfDay && orderTime < endOfDay;
    }).length;

    return {
      label: targetDate.toLocaleDateString("en-IN", { weekday: "short" }),
      total,
    };
  });
}

function buildTopSellingProducts(products = [], orders = []) {
  const totals = new Map();
  const productLookup = new Map(
    products.map((product) => [product.id || product.slug || product.documentId, product])
  );

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const key = item.id || item.slug || item.name;

      if (!key) {
        return;
      }

      const current = totals.get(key) || {
        key,
        name: item.name,
        quantity: 0,
      };

      current.quantity += Math.max(0, Number(item.quantity) || 0);
      totals.set(key, current);
    });
  });

  return Array.from(totals.values())
    .sort((left, right) => right.quantity - left.quantity)
    .slice(0, 5)
    .map((item) => {
      const product = productLookup.get(item.key) || products.find((candidate) => candidate.name === item.name);

      return {
        name: product?.name || item.name,
        image: product?.image || "/images/mirchi.png",
        sku: product?.sku || buildSku(product?.slug || item.name),
        sales: `${item.quantity} sold`,
      };
    });
}

function buildLowStockProducts(products = [], inventoryRows = []) {
  const productLookup = new Map(
    products.map((product) => [product.name, product])
  );

  return inventoryRows
    .filter((item) => item.status === "Low Stock" || item.status === "Out Of Stock" || item.status === "Out of Stock")
    .sort((left, right) => left.availableStock - right.availableStock)
    .slice(0, 5)
    .map((item) => ({
      name: item.product,
      stock: `${item.availableStock} left`,
      tone: item.availableStock <= 0 ? "danger" : "warning",
      image: productLookup.get(item.product)?.image || "/images/mirchi.png",
    }));
}

function buildRecentOrders(orders = []) {
  return orders.slice(0, 5);
}

function buildNewCustomers(users = []) {
  return users.slice(0, 5).map((user) => ({
    name: user.name,
    city: user.city || "Location pending",
    joined: formatJoinedLabel(user.createdAt),
  }));
}

export function buildDashboardData(products = [], users = [], orders = [], reviews = []) {
  const inventoryRows = buildInventoryRows(products, orders);
  const paidOrders = orders.filter(isPaidOrder);
  const totalRevenue = paidOrders.reduce((total, order) => total + Math.max(0, Number(order.amount) || 0), 0);
  const deliveredOrders = orders.filter(
    (item) => String(item.status || "").trim().toLowerCase() === "delivered"
  ).length;
  const revenueTrend = buildDailyRevenueSeries(orders, 0, 7);
  const previousRevenueTrend = buildDailyRevenueSeries(orders, 7, 7);
  const orderVolume = buildDailyOrderSeries(orders, 7);

  return {
    dashboardStats: [
      {
        id: "revenue",
        label: "Revenue",
        value: formatPrice(totalRevenue),
        note: `${reviews.length} review${reviews.length === 1 ? "" : "s"} recorded`,
        change: `${paidOrders.length} paid orders`,
        tone: "green",
        points: revenueTrend.map((item) => item.value),
      },
      {
        id: "orders",
        label: "Orders",
        value: String(orders.length),
        note: `${orders.filter((item) => item.status === "Pending").length} pending right now`,
        change: `${orders.filter((item) => isWithinDays(item.createdAt, 7)).length} this week`,
        tone: "amber",
        points: orderVolume.map((item) => item.total),
      },
      {
        id: "customers",
        label: "Customers",
        value: String(users.length),
        note: `${users.filter((item) => isWithinDays(item.createdAt, 7)).length} new this week`,
        change: `${users.filter((item) => isWithinDays(item.lastLoginAt, 30)).length} active recently`,
        tone: "blue",
        points: buildDailyOrderSeries(
          users.map((item) => ({
            createdAt: item.createdAt,
          })),
          7
        ).map((item) => item.total),
      },
      {
        id: "deliveries",
        label: "Deliveries",
        value: String(deliveredOrders),
        note: `${inventoryRows.filter((item) => item.status === "Low Stock").length} low-stock SKU alerts`,
        change: `${orders.filter((item) => item.status === "Shipped").length} shipped`,
        tone: "orange",
        points: buildDailyOrderSeries(
          orders.filter((item) => item.status === "Delivered"),
          7
        ).map((item) => item.total),
      },
    ],
    revenueTrend,
    previousRevenueTrend,
    orderVolume,
    topSellingProducts: buildTopSellingProducts(products, orders),
    lowStockProducts: buildLowStockProducts(products, inventoryRows),
    recentOrders: buildRecentOrders(orders),
    newCustomers: buildNewCustomers(users),
  };
}
