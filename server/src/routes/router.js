import { config } from "../config/env.js";
import { getOptionalUser, requireAdmin, requireUser } from "../middleware/auth.js";
import { getSessionProfile, recordLoginActivity, syncUserProfile } from "../services/authService.js";
import {
  createContactSubmission,
  listContactSubmissions,
  markContactSubmissionAsRead,
  markUserReplySeen,
  replyToContactSubmission,
} from "../services/contactService.js";
import {
  deleteCategory,
  deleteProduct,
  listCategories,
  listProducts,
  saveCategory,
  saveProduct,
} from "../services/catalogService.js";
import {
  createUserOrder,
  listOrders,
  listPayments,
  updateOrderStatus,
} from "../services/orderService.js";
import { listReviews, submitReview, updateReviewStatus } from "../services/reviewService.js";
import { createRazorpayOrder, verifyRazorpaySignature } from "../services/razorpayService.js";
import { getCorsOrigin, HttpError, matchPattern, readJsonBody, sendJson } from "../utils/http.js";

const routes = [];

function route(method, pattern, handler) {
  routes.push({ method, pattern, handler });
}

function json(payload) {
  return {
    statusCode: 200,
    payload,
  };
}

route("GET", "/health", async () =>
  json({
    ok: true,
    service: "spice-root-server",
    backend: "firebase-admin",
    razorpayMode: config.razorpay.mockMode ? "mock-test" : "razorpay-test",
  })
);

route("GET", "/api/auth/me", async ({ request }) => {
  const user = await requireUser(request);
  return json(await getSessionProfile(user));
});

route("POST", "/api/auth/sync", async ({ request, body }) => {
  const user = await requireUser(request);
  const profile = await syncUserProfile(user, body);

  if (body.recordLogin) {
    await recordLoginActivity(user, profile, body.source || "client");
  }

  return json({ profile });
});

route("GET", "/api/products", async () => json({ products: await listProducts() }));

route("POST", "/api/admin/products", async ({ request, body }) => {
  await requireAdmin(request);
  return json(await saveProduct(body.id, body));
});

route("PATCH", "/api/admin/products/:productId", async ({ request, params, body }) => {
  await requireAdmin(request);
  return json(await saveProduct(params.productId, body));
});

route("DELETE", "/api/admin/products/:productId", async ({ request, params }) => {
  await requireAdmin(request);
  await deleteProduct(params.productId);
  return json({ ok: true });
});

route("GET", "/api/categories", async () => json({ categories: await listCategories() }));

route("POST", "/api/admin/categories", async ({ request, body }) => {
  await requireAdmin(request);
  return json(await saveCategory(body.id, body));
});

route("PATCH", "/api/admin/categories/:categoryId", async ({ request, params, body }) => {
  await requireAdmin(request);
  return json(await saveCategory(params.categoryId, body));
});

route("DELETE", "/api/admin/categories/:categoryId", async ({ request, params }) => {
  await requireAdmin(request);
  await deleteCategory(params.categoryId);
  return json({ ok: true });
});

route("POST", "/api/contact", async ({ request, body }) => {
  const user = await getOptionalUser(request);
  return json(await createContactSubmission(body, user));
});

route("GET", "/api/admin/contact-submissions", async ({ request }) => {
  await requireAdmin(request);
  return json({ submissions: await listContactSubmissions() });
});

route("PATCH", "/api/admin/contact-submissions/:submissionId/read", async ({ request, params }) => {
  await requireAdmin(request);
  await markContactSubmissionAsRead(params.submissionId);
  return json({ ok: true });
});

route("POST", "/api/admin/contact-submissions/:submissionId/reply", async ({ request, params, body }) => {
  await requireAdmin(request);
  await replyToContactSubmission(params.submissionId, body.reply, body.status);
  return json({ ok: true });
});

route("PATCH", "/api/user/query-replies/:notificationId/seen", async ({ request, params }) => {
  const user = await requireUser(request);
  await markUserReplySeen(user.uid, params.notificationId);
  return json({ ok: true });
});

route("POST", "/api/orders", async ({ request, body }) => {
  const user = await requireUser(request);
  return json(await createUserOrder(user, body));
});

route("GET", "/api/admin/orders", async ({ request }) => {
  await requireAdmin(request);
  return json({ orders: await listOrders() });
});

route("PATCH", "/api/admin/orders/:userId/:orderId/status", async ({ request, params, body }) => {
  await requireAdmin(request);
  await updateOrderStatus(params.userId, params.orderId, body.status);
  return json({ ok: true });
});

route("GET", "/api/admin/payments", async ({ request }) => {
  await requireAdmin(request);
  return json({ payments: await listPayments() });
});

route("GET", "/api/admin/reviews", async ({ request }) => {
  await requireAdmin(request);
  return json({ reviews: await listReviews() });
});

route("POST", "/api/reviews", async ({ request, body }) => {
  const user = await requireUser(request);
  return json(await submitReview(user, body));
});

route("PATCH", "/api/admin/reviews/:reviewId/status", async ({ request, params, body }) => {
  await requireAdmin(request);
  await updateReviewStatus(params.reviewId, body.status);
  return json({ ok: true });
});

route("GET", "/api/razorpay/config", async () =>
  json({
    keyId: config.razorpay.keyId,
    mode: config.razorpay.mockMode ? "mock-test" : "razorpay-test",
  })
);

route("POST", "/api/razorpay/create-order", async ({ body }) => {
  const order = await createRazorpayOrder({
    amount: body.amount,
    currency: body.currency || "INR",
    receipt: body.receipt || body.orderDocumentId || `spice-root-${Date.now()}`,
    notes: {
      orderDocumentId: body.orderDocumentId || "",
      customerEmail: body.customerEmail || "",
      mode: "test",
    },
  });

  return json({
    keyId: config.razorpay.keyId,
    razorpayOrderId: order.id,
    amount: order.amount,
    currency: order.currency,
    mock: order.mock,
  });
});

route("POST", "/api/razorpay/verify-payment", async ({ body }) => {
  const verified = verifyRazorpaySignature({
    razorpayOrderId: body.razorpayOrderId,
    paymentId: body.paymentId,
    razorpaySignature: body.razorpaySignature,
  });

  return {
    statusCode: verified ? 200 : 400,
    payload: {
      verified,
      mode: config.razorpay.mockMode ? "mock-test" : "razorpay-test",
      paymentId: body.paymentId || "",
      razorpayOrderId: body.razorpayOrderId || "",
      razorpaySignature: body.razorpaySignature || "",
    },
  };
});

function findRoute(method, pathname) {
  for (const item of routes) {
    if (item.method !== method) {
      continue;
    }

    const params = matchPattern(item.pattern, pathname);

    if (params) {
      return { ...item, params };
    }
  }

  return null;
}

export async function handleRequest(request, response) {
  const origin = getCorsOrigin(request.headers.origin);
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {}, origin);
    return;
  }

  try {
    const matchedRoute = findRoute(request.method, url.pathname);

    if (!matchedRoute) {
      throw new HttpError(404, "Route not found.");
    }

    const body = ["POST", "PATCH", "PUT"].includes(request.method)
      ? await readJsonBody(request)
      : {};
    const result = await matchedRoute.handler({
      request,
      response,
      params: matchedRoute.params,
      query: url.searchParams,
      body,
    });

    sendJson(response, result.statusCode || 200, result.payload ?? result, origin);
  } catch (error) {
    const statusCode = error.statusCode || 500;

    if (statusCode >= 500) {
      console.error(error);
    }

    sendJson(
      response,
      statusCode,
      {
        error: error.message || "Unexpected server error.",
      },
      origin
    );
  }
}
