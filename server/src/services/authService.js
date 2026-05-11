import { isAllowedAdminEmail } from "../config/env.js";
import { getFirebaseAdmin } from "./firebaseAdmin.js";

function extractFirstName(value) {
  return (
    String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)[0] || ""
  );
}

function normalizeUserProfile(user, profile = {}, payload = {}) {
  const resolvedName =
    profile.name || payload.name?.trim() || payload.firstName?.trim() || user.name || "";
  const resolvedFirstName =
    profile.firstName || payload.firstName?.trim() || extractFirstName(resolvedName);

  return {
    uid: profile.uid || user.uid,
    firstName: resolvedFirstName,
    name: resolvedName,
    email: profile.email || user.email || "",
    phoneNumber: profile.phoneNumber || "",
    alternatePhoneNumber: profile.alternatePhoneNumber || "",
    addressLine1: profile.addressLine1 || "",
    addressLine2: profile.addressLine2 || "",
    city: profile.city || "",
    state: profile.state || "",
    pincode: profile.pincode || "",
    deliveryInstructions: profile.deliveryInstructions || "",
    createdAt: profile.createdAt || null,
    updatedAt: profile.updatedAt || null,
    lastLoginAt: profile.lastLoginAt || null,
  };
}

export async function syncUserProfile(user, payload = {}) {
  const { db, FieldValue } = await getFirebaseAdmin();
  const userRef = db.collection("users").doc(user.uid);
  const snapshot = await userRef.get();
  const profile = snapshot.exists ? snapshot.data() : {};
  const nextName = payload.name?.trim() || payload.firstName?.trim() || user.name || "";
  const nextFirstName = payload.firstName?.trim() || extractFirstName(nextName);

  const basePayload = {
    uid: user.uid,
    firstName: profile.firstName || nextFirstName,
    name: profile.name || nextName,
    email: user.email || profile.email || "",
    phoneNumber: profile.phoneNumber || "",
    alternatePhoneNumber: profile.alternatePhoneNumber || "",
    addressLine1: profile.addressLine1 || "",
    addressLine2: profile.addressLine2 || "",
    city: profile.city || "",
    state: profile.state || "",
    pincode: profile.pincode || "",
    deliveryInstructions: profile.deliveryInstructions || "",
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!snapshot.exists) {
    basePayload.createdAt = FieldValue.serverTimestamp();
    basePayload.lastLoginAt = null;
  }

  await userRef.set(basePayload, { merge: true });
  const refreshedSnapshot = await userRef.get();
  return normalizeUserProfile(user, refreshedSnapshot.data(), payload);
}

export async function getAdminProfile(user) {
  if (!isAllowedAdminEmail(user.email)) {
    return null;
  }

  const { db } = await getFirebaseAdmin();
  const snapshot = await db.collection("admins").doc(user.uid).get();
  const adminProfile = snapshot.exists ? snapshot.data() : {};

  return {
    uid: user.uid,
    email: user.email || "",
    name: adminProfile.name || user.name || "Administrator",
    role: adminProfile.role || "admin",
    status: adminProfile.status || "active",
    createdAt: adminProfile.createdAt || null,
  };
}

export async function recordLoginActivity(user, profile, source = "user") {
  const { db, FieldValue } = await getFirebaseAdmin();
  const isAdmin = isAllowedAdminEmail(user.email);

  await db.collection("users").doc(user.uid).set(
    {
      firstName: profile.firstName || extractFirstName(profile.name),
      name: profile.name || user.name || "",
      email: user.email || profile.email || "",
      lastLoginAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await db.collection("users").doc(user.uid).collection("loginEvents").add({
    uid: user.uid,
    email: user.email || profile.email || "",
    name: profile.name || "",
    isAdmin,
    source,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function getSessionProfile(user) {
  const profile = await syncUserProfile(user);
  const adminProfile = await getAdminProfile(user);
  return {
    user: {
      uid: user.uid,
      email: user.email || "",
      name: user.name || profile.name || "",
    },
    profile,
    adminProfile,
    role: adminProfile ? "admin" : "user",
  };
}
