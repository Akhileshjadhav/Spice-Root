import { getFirebaseAdmin } from "./firebaseAdmin.js";
import { normalizeLabel, normalizeStatus, toMillis, toPlainTimestamp } from "../utils/normalize.js";

function normalizeOrder(record) {
  return {
    id: record.id,
    userId: record.userId || "",
    orderId: normalizeLabel(record.orderId, record.id),
    customerName: normalizeLabel(record.customerName || record.name, "Customer"),
    customerEmail: normalizeLabel(record.customerEmail || record.email),
    amount: Number(record.amount || record.total || 0),
    paymentMethod: normalizeLabel(record.paymentMethod),
    paymentStatus: normalizeLabel(record.paymentStatus),
    paymentProvider: normalizeLabel(record.paymentProvider),
    paymentMode: normalizeLabel(record.paymentMode),
    paymentId: normalizeLabel(record.paymentId),
    status: normalizeStatus(record.status, "Pending"),
    itemCount: Number(record.itemCount) || 0,
    items: Array.isArray(record.items) ? record.items : [],
    createdAt: toPlainTimestamp(record.createdAt),
    updatedAt: toPlainTimestamp(record.updatedAt),
  };
}

export async function createUserOrder(user, payload) {
  const { db, FieldValue } = await getFirebaseAdmin();
  const docRef = db.collection("users").doc(user.uid).collection("orders").doc(payload.orderId || undefined);
  const orderPayload = {
    ...payload,
    userId: user.uid,
    customerEmail: payload.customerEmail || user.email || "",
    status: normalizeLabel(payload.status, "placed").toLowerCase(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(orderPayload, { merge: true });

  await db.collection("adminNotifications").add({
    type: "order",
    userId: user.uid,
    orderId: payload.orderId || docRef.id,
    orderDocumentId: docRef.id,
    customerName: payload.customerName || "Customer",
    customerEmail: payload.customerEmail || user.email || "",
    status: "Unread",
    orderStatus: orderPayload.status,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { id: docRef.id, orderId: payload.orderId || docRef.id };
}

export async function listOrders() {
  const { db } = await getFirebaseAdmin();
  const snapshot = await db.collectionGroup("orders").get();

  return snapshot.docs
    .map((item) =>
      normalizeOrder({
        id: item.id,
        ...item.data(),
        userId: item.ref.parent.parent?.id || "",
      })
    )
    .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));
}

export async function updateOrderStatus(userId, orderId, status) {
  const { db, FieldValue } = await getFirebaseAdmin();
  await db.collection("users").doc(userId).collection("orders").doc(orderId).set(
    {
      status: normalizeLabel(status, "Pending").toLowerCase(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function listPayments() {
  const orders = await listOrders();

  return orders
    .filter((order) => order.paymentMethod || order.paymentStatus || order.paymentId)
    .map((order) => ({
      paymentId: order.paymentId || `PAY-${order.id}`,
      orderId: order.orderId,
      customer: order.customerName,
      amount: order.amount,
      method: order.paymentMethod,
      status: order.paymentStatus,
      provider: order.paymentProvider,
      mode: order.paymentMode,
      createdAt: order.createdAt,
    }));
}
