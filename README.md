# Spice Root

Production-ready split project for the Spice Root storefront.

## Folders

```txt
client/   React + Vite app for users and admin
server/   Node backend for auth/profile sync, admin guards, catalog, contact replies, orders, payments, reviews
scripts/  Local and deployment helper scripts
```

## Local Run

```bash
npm --prefix server install
npm --prefix client install
node server/index.js
node scripts/dev-client.mjs
```

Open:

```txt
http://localhost:5173
```

API health:

```bash
curl http://localhost:3001/health
```

## Build

```bash
node scripts/build-client.mjs
```

## Environment Files

`client/.env` only contains public `VITE_` values.

`server/.env` contains private service keys and Razorpay secrets. Never deploy private keys to Vercel or expose them in client code.

For the visible Razorpay demo/test gateway with the current keys, keep `RAZORPAY_MOCK_MODE=true` in `server/.env`. The user still sees Razorpay Checkout, and the order is saved after the successful test payment callback.

If you regenerate a valid Razorpay test key secret and want full server-created Razorpay orders with signature verification, set `RAZORPAY_MOCK_MODE=false`.

During local development, the server accepts Vite origins from `localhost`, `127.0.0.1`, and private LAN IPs such as `http://10.x.x.x:5173`. In production, set `CLIENT_ORIGIN` to the deployed Vercel URL.

## Deployment

Deploy the client to Vercel from the repository root using `vercel.json`.

Deploy the server to Render with `server` as the root directory.

Set `VITE_API_URL` in Vercel to your Render API URL:

```txt
https://your-render-service.onrender.com/api
```

Set `CLIENT_ORIGIN` in Render to your Vercel domain:

```txt
https://your-vercel-domain.vercel.app
```
