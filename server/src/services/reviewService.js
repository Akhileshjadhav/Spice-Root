import { getFirebaseAdmin } from "./firebaseAdmin.js";
import { normalizeLabel, normalizeStatus, toMillis, toPlainTimestamp } from "../utils/normalize.js";

function normalizeReview(record) {
  return {
    id: record.id,
    userId: record.userId || "",
    customerName: normalizeLabel(record.customerName || record.name, "Customer"),
    productName: normalizeLabel(record.productName, "Store review"),
    rating: Number(record.rating || 0),
    comment: normalizeLabel(record.comment || record.message),
    status: normalizeStatus(record.status, "Pending"),
    createdAt: toPlainTimestamp(record.createdAt),
    updatedAt: toPlainTimestamp(record.updatedAt),
  };
}

export async function listReviews() {
  const { db } = await getFirebaseAdmin();
  const snapshot = await db.collection("reviews").get();

  return snapshot.docs
    .map((item) => normalizeReview({ id: item.id, ...item.data() }))
    .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));
}

export async function submitReview(user, payload) {
  const { db, FieldValue } = await getFirebaseAdmin();
  const docRef = await db.collection("reviews").add({
    ...payload,
    userId: user.uid,
    customerEmail: user.email || payload.customerEmail || "",
    status: "Pending",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { id: docRef.id };
}

export async function updateReviewStatus(reviewId, status) {
  const { db, FieldValue } = await getFirebaseAdmin();
  await db.collection("reviews").doc(reviewId).set(
    {
      status: normalizeStatus(status, "Pending"),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
