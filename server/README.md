# Spice Root Server

Render-ready Node backend for Spice Root.

This folder contains the server-side logic that was previously mixed into the frontend:

```txt
src/config/env.js               environment and deployment config
src/middleware/auth.js          Firebase token verification and admin guard
src/routes/router.js            API route table
src/services/authService.js     user profile sync, admin checks, login event writes
src/services/catalogService.js  products and categories
src/services/contactService.js  contact queries, admin replies, user reply notifications
src/services/orderService.js    orders, order status, payment/revenue rows
src/services/razorpayService.js Razorpay test/mock order creation and signature verification
src/services/reviewService.js   customer reviews and admin review status
```

## Local

```bash
npm run dev
```

Default URL:

```txt
http://localhost:3001
```

Health check:

```txt
GET /health
```

Install dependencies before using Firebase Admin backed routes:

```bash
npm install
```

Main API groups:

```txt
GET    /api/auth/me
POST   /api/auth/sync
GET    /api/products
POST   /api/admin/products
PATCH  /api/admin/products/:productId
DELETE /api/admin/products/:productId
GET    /api/categories
POST   /api/admin/categories
PATCH  /api/admin/categories/:categoryId
DELETE /api/admin/categories/:categoryId
POST   /api/contact
GET    /api/admin/contact-submissions
PATCH  /api/admin/contact-submissions/:submissionId/read
POST   /api/admin/contact-submissions/:submissionId/reply
POST   /api/orders
GET    /api/admin/orders
PATCH  /api/admin/orders/:userId/:orderId/status
GET    /api/admin/payments
GET    /api/admin/reviews
POST   /api/reviews
PATCH  /api/admin/reviews/:reviewId/status
GET    /api/razorpay/config
POST   /api/razorpay/create-order
POST   /api/razorpay/verify-payment
```

## Render

Use `server` as the root directory.

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Set environment variables from `.env.example` in Render dashboard.

## Razorpay Modes

`RAZORPAY_MOCK_MODE=true` is the visible demo/test gateway mode for the current project keys. It opens Razorpay Checkout and saves the order after a successful test payment callback.

`RAZORPAY_MOCK_MODE=false` creates a real Razorpay test order using the configured `rzp_test_` key and secret. Use that only after the Razorpay secret is confirmed valid.
