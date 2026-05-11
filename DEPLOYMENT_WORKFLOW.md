# Spice Root Deployment Workflow

## Local Development

Install dependencies from the clean folders when needed:

```bash
npm --prefix server install
npm --prefix client install
```

Run both apps from the repository root:

```bash
npm run dev
```

If npm lifecycle scripts are blocked by the local Windows/npm cache, use the direct commands:

```bash
node server/index.js
node scripts/dev-client.mjs
```

Client:

```txt
http://localhost:5173
```

If Vite opens on a LAN address such as `http://10.203.139.22:5173`, the local server allows that development origin automatically. For deployed Render production, keep `CLIENT_ORIGIN` set to your Vercel domain.

Server:

```txt
http://localhost:3001
```

Health check:

```bash
curl http://localhost:3001/health
```

Production client build:

```bash
node scripts/build-client.mjs
```

## Vercel Client Deployment

Deploy the repository root to Vercel. `vercel.json` points Vercel at the `client` app.

Vercel settings:

```txt
Framework Preset: Vite
Build Command: node scripts/build-client.mjs
Output Directory: client/dist
Install Command: npm --prefix client install
```

Set these Vercel environment variables:

```txt
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_ADMIN_EMAILS
VITE_API_URL=https://your-render-service.onrender.com/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

## Render Server Deployment

Deploy `server` as a Render Web Service.

Root directory:

```txt
server
```

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Set these Render environment variables:

```txt
PORT=3001
CLIENT_ORIGIN=https://your-vercel-domain.vercel.app
ADMIN_EMAILS=your-admin-email@example.com
FIREBASE_ADMIN_PROJECT_ID=spice-root-e30db
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@spice-root-e30db.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=spice-root-e30db.firebasestorage.app
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret
RAZORPAY_MOCK_MODE=true
ALLOW_LIVE_RAZORPAY=false
```

Keep `RAZORPAY_MOCK_MODE=true` for the visible Razorpay demo/test gateway with the current keys. The user sees Razorpay Checkout, completes a Razorpay test payment, and the order is saved after the successful callback.

Set `RAZORPAY_MOCK_MODE=false` only after you regenerate a valid Razorpay test key secret. In that full verification mode, the server creates a real Razorpay order and verifies the returned signature.

Do not expose `RAZORPAY_KEY_SECRET` in Vercel or client-side code.

## Project Structure

```txt
client/                 React + Vite storefront/admin UI
server/index.js          Node server entry
server/src/config        environment/deployment config
server/src/middleware    Firebase auth token and admin guards
server/src/routes        API routes
server/src/services      backend business logic for auth, catalog, contact queries, orders, payments, reviews
scripts/                 root helpers for local dev and Vercel builds
```

## Payment Flow

1. User confirms checkout in the client.
2. Client calls `POST /api/razorpay/create-order`.
3. In mock mode the server returns a test response without creating a real Razorpay order.
4. Client opens Razorpay Checkout using only the public key.
5. Client calls `POST /api/razorpay/verify-payment`.
6. Order is written only after verification succeeds.
7. Admin revenue/payment views can read the saved payment fields from the order record.
