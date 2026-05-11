import { config } from "../config/env.js";
import { HttpError } from "../utils/http.js";

let adminModulesPromise;
let cachedAdmin;

async function loadAdminModules() {
  if (!adminModulesPromise) {
    adminModulesPromise = Promise.all([
      import("firebase-admin/app"),
      import("firebase-admin/auth"),
      import("firebase-admin/firestore"),
    ]);
  }

  return adminModulesPromise;
}

export async function getFirebaseAdmin() {
  if (cachedAdmin) {
    return cachedAdmin;
  }

  const [appModule, authModule, firestoreModule] = await loadAdminModules();
  const { initializeApp, getApps, cert } = appModule;
  const { getAuth } = authModule;
  const { getFirestore, FieldValue } = firestoreModule;

  if (!config.firebase.projectId || !config.firebase.clientEmail || !config.firebase.privateKey) {
    throw new HttpError(500, "Firebase Admin credentials are missing in server environment.");
  }

  const app =
    getApps()[0] ||
    initializeApp({
      credential: cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
      storageBucket: config.firebase.storageBucket,
    });

  cachedAdmin = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    FieldValue,
  };

  return cachedAdmin;
}
