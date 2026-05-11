import { getFirebaseAdmin } from "./firebaseAdmin.js";
import { normalizeLabel, slugify, toMillis, toPlainTimestamp } from "../utils/normalize.js";

function normalizeProduct(record) {
  return {
    id: record.id,
    name: normalizeLabel(record.name),
    slug: normalizeLabel(record.slug, slugify(record.name)),
    category: normalizeLabel(record.category, "Uncategorized"),
    image: normalizeLabel(record.image),
    price: Number(record.price || 0),
    stock: Number(record.stock || 0),
    status: normalizeLabel(record.status, "Active"),
    createdAt: toPlainTimestamp(record.createdAt),
    updatedAt: toPlainTimestamp(record.updatedAt),
    raw: record,
  };
}

export async function listProducts() {
  const { db } = await getFirebaseAdmin();
  const snapshot = await db.collection("products").get();

  return snapshot.docs
    .map((item) => normalizeProduct({ id: item.id, ...item.data() }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function saveProduct(productId, payload) {
  const { db, FieldValue } = await getFirebaseAdmin();
  const name = normalizeLabel(payload.name);
  const id = productId || slugify(payload.slug || name);
  const docRef = db.collection("products").doc(id);

  await docRef.set(
    {
      ...payload,
      name,
      slug: normalizeLabel(payload.slug, id),
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: payload.createdAt || FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { id };
}

export async function deleteProduct(productId) {
  const { db } = await getFirebaseAdmin();
  await db.collection("products").doc(productId).delete();
}

export async function listCategories() {
  const { db } = await getFirebaseAdmin();
  const snapshot = await db.collection("categories").get();

  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data(), createdAt: toPlainTimestamp(item.data().createdAt) }))
    .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));
}

export async function saveCategory(categoryId, payload) {
  const { db, FieldValue } = await getFirebaseAdmin();
  const name = normalizeLabel(payload.name);
  const id = categoryId || slugify(name);

  await db.collection("categories").doc(id).set(
    {
      name,
      image: normalizeLabel(payload.image),
      description: normalizeLabel(payload.description),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { id };
}

export async function deleteCategory(categoryId) {
  const { db } = await getFirebaseAdmin();
  await db.collection("categories").doc(categoryId).delete();
}
