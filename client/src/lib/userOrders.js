import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { normalizeOrderRecord } from "./adminStore";

function getCreatedAtTime(value) {
  return typeof value?.toMillis === "function" ? value.toMillis() : 0;
}

export function subscribeToUserOrders(uid, onOrders, onError) {
  if (!uid) {
    onOrders([]);
    return () => {};
  }

  return onSnapshot(
    collection(db, "users", uid, "orders"),
    (snapshot) => {
      const orders = snapshot.docs
        .map((item) => normalizeOrderRecord({ id: item.id, ...item.data(), userId: uid }))
        .sort((left, right) => getCreatedAtTime(right.createdAt) - getCreatedAtTime(left.createdAt));

      onOrders(orders);
    },
    onError
  );
}

export function mergeOrdersWithCurrent(latestOrder, orders = []) {
  if (!latestOrder?.id) {
    return orders;
  }

  return [latestOrder, ...orders.filter((item) => item.id !== latestOrder.id)];
}

export function createOptimisticOrder(orderId, payload) {
  return normalizeOrderRecord({
    id: orderId,
    orderId,
    userId: payload.userId,
    customer: payload.customer,
    items: payload.items,
    itemCount: payload.itemCount,
    total: payload.total,
    status: payload.status || "placed",
    paymentMethod: payload.paymentMethod || "Razorpay Test",
    paymentStatus: payload.paymentStatus || "Paid",
    paymentProvider: payload.paymentProvider || "Razorpay",
    paymentMode: payload.paymentMode || "test",
    paymentId: payload.paymentId || "",
    paidAt: payload.paidAt || null,
    createdAt: new Date(),
  });
}
