# Testing the Marketplace App Locally

## Prerequisites

- MongoDB connection string configured in `backend/.env` as `MONGO_URI`
- Node.js installed with npm

## Devin Secrets Needed

- `MONGO_URI` — MongoDB Atlas connection string (already in `backend/.env`)

## Starting the App

### Backend

```bash
cd ~/repos/marketplace/backend && PORT=3001 npm run dev
```

The backend defaults to port 5000 from `.env`, but the frontend proxy expects port 3001. Override with `PORT=3001` to match.

Wait for both "Server running on http://localhost:3001" and "MongoDB Connected" before proceeding.

### Frontend

```bash
cd ~/repos/marketplace/frontend && npm start
```

Runs on port 3000. The CRA dev proxy (`package.json` → `"proxy": "http://localhost:3001"`) forwards API requests to the backend.

**Important:** Start the backend before the frontend, or on the correct port. If the backend isn't on port 3001 when the frontend starts, you'll see `ECONNREFUSED` proxy errors. The frontend will recover once the backend is available — just refresh the page.

## Port Configuration Gotcha

The `backend/.env` may set `PORT=5000`, but `frontend/package.json` has `"proxy": "http://localhost:3001"`. These must match. The simplest fix is to override the port when starting the backend: `PORT=3001 npm run dev`.

## Testing Approach

1. Open `http://localhost:3000` in the browser
2. The app loads directly to the product grid (no login required, no auth)
3. All features (products, cart, favorites) are global — shared across all visitors
4. Test features by interacting with the UI and refreshing to verify MongoDB persistence

## Key UI Layout

- **Product cards** show in a grid on the home view with buttons: Add to Cart, Delete, and Favorite
- **Navigation** is via top bar: Browse, + Sell, Cart
- **Views** are controlled by state (`home`, `sell`, `cart`) — no URL routing

## Common Issues

- If products don't load, check that the backend is running and connected to MongoDB
- Proxy errors on frontend startup are normal if the backend wasn't running yet — just refresh after starting the backend
- The `build` command (`npx react-scripts build`) serves as the lint check for the frontend
