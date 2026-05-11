import { getFirebaseAdmin } from "./firebaseAdmin.js";
import { normalizeLabel, normalizeStatus, toMillis, toPlainTimestamp } from "../utils/normalize.js";

function normalizeContactSubmission(record) {
  const adminReply = normalizeLabel(record.adminReply);

  return {
    id: record.id,
    userId: record.userId || "",
    name: normalizeLabel(record.name, "Customer"),
    email: normalizeLabel(record.email, "No email"),
    message: normalizeLabel(record.message),
    subject: normalizeLabel(record.subject, normalizeLabel(record.message).slice(0, 42) || "Customer query"),
    status: normalizeStatus(record.status, "New"),
    adminSeen: Boolean(record.adminSeen),
    adminReply,
    adminReplyAt: toPlainTimestamp(record.adminReplyAt),
    userReplySeen: adminReply ? Boolean(record.userReplySeen) : true,
    createdAt: toPlainTimestamp(record.createdAt),
    updatedAt: toPlainTimestamp(record.updatedAt),
  };
}

export async function createContactSubmission(payload, user = null) {
  const { db, FieldValue } = await getFirebaseAdmin();
  const docRef = await db.collection("contactSubmissions").add({
    userId: user?.uid || payload.userId || null,
    name: normalizeLabel(payload.name),
    email: normalizeLabel(payload.email || user?.email),
    message: normalizeLabel(payload.message),
    subject: normalizeLabel(payload.subject, normalizeLabel(payload.message).slice(0, 42)),
    status: "new",
    adminSeen: false,
    adminReply: "",
    adminReplyAt: null,
    userReplySeen: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { id: docRef.id };
}

export async function listContactSubmissions() {
  const { db } = await getFirebaseAdmin();
  const snapshot = await db.collection("contactSubmissions").get();

  return snapshot.docs
    .map((item) => normalizeContactSubmission({ id: item.id, ...item.data() }))
    .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));
}

export async function markContactSubmissionAsRead(submissionId) {
  const { db, FieldValue } = await getFirebaseAdmin();
  await db.collection("contactSubmissions").doc(submissionId).set(
    {
      adminSeen: true,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function replyToContactSubmission(submissionId, reply, status = "Replied") {
  const { db, FieldValue } = await getFirebaseAdmin();
  const submissionRef = db.collection("contactSubmissions").doc(submissionId);
  const snapshot = await submissionRef.get();
  const submission = snapshot.exists ? snapshot.data() : {};
  const normalizedReply = normalizeLabel(reply);

  await submissionRef.set(
    {
      adminReply: normalizedReply,
      adminReplyAt: FieldValue.serverTimestamp(),
      adminSeen: true,
      userReplySeen: false,
      status: normalizeStatus(status, "Replied"),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (submission.userId) {
    await db.collection("users").doc(submission.userId).collection("queryReplies").doc(submissionId).set(
      {
        submissionId,
        subject: normalizeLabel(submission.subject, "Customer query"),
        adminReply: normalizedReply,
        seen: false,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
}

export async function markUserReplySeen(userId, notificationId) {
  const { db } = await getFirebaseAdmin();
  await db.collection("users").doc(userId).collection("queryReplies").doc(notificationId).set(
    {
      seen: true,
    },
    { merge: true }
  );
}
