# Testing the Marketplace App Locally

## Prerequisites

- MongoDB connection string configured in `backend/.env` as `MONGO_URI`
- Node.js installed with npm

## Devin Secrets Needed

- `MONGO_URI` — MongoDB Atlas connection string (already in `backend/.env`)
- `LINEAR_API_KEY` — For creating/updating Linear tickets associated with PRs

## Starting the App

### Backend

```bash
cd ~/repos/marketplace/backend && PORT=3001 node server.js
```

The backend defaults to port 5000 from `.env`, but the frontend proxy expects port 3001. Override with `PORT=3001` to match.

Wait for both "Server running on http://localhost:3001" and "MongoDB Connected" before proceeding.

### Frontend

```bash
cd ~/repos/marketplace/frontend && BROWSER=none npm start
```

Runs on port 3000. The CRA dev proxy (`package.json` → `"proxy": "http://localhost:3001"`) forwards API requests to the backend.

**Important:** Start the backend before the frontend, or on the correct port. If the backend isn't on port 3001 when the frontend starts, you'll see `ECONNREFUSED` proxy errors. The frontend will recover once the backend is available — just refresh the page.

## Port Configuration Gotcha

The `backend/.env` may set `PORT=5000`, but `frontend/package.json` has `"proxy": "http://localhost:3001"`. These must match. The simplest fix is to override the port when starting the backend: `PORT=3001 node server.js`.

## Testing Auth-Dependent Features

Many features (Coupons, Wishlists, Cart with coupons, Orders) require authentication via the `x-user-id` header. The auth middleware is at `backend/middleware/auth.js` and reads the `x-user-id` header.

### Creating a Test User

Create a test user in MongoDB via the backend shell or a script:

```bash
node -e "
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const user = await User.findOneAndUpdate(
    { email: 'test@example.com' },
    { name: 'Test User', email: 'test@example.com', role: 'seller' },
    { upsert: true, new: true }
  );
  console.log('Test user ID:', user._id);
  process.exit(0);
});
"
```

Note the user ID output — you'll need it for the next step.

### Temporarily Patching App.js for Auth

To test auth-dependent features in the browser, temporarily add the test user ID to `frontend/src/App.js`:

1. Add `const TEST_USER_ID = "<user_id_from_above>";` near the top
2. Pass `currentUserId={TEST_USER_ID}` to components that need auth (e.g., `<Cart>`, `<CouponManager>`)
3. **IMPORTANT:** Do NOT commit this patch. Revert with `git checkout -- frontend/src/App.js` after testing.

## Navigation and Key UI Paths

- **Home/Browse:** Product grid with Add to Cart, Delete, Favorite buttons
- **Navigation bar:** Browse, + Sell, Orders, Analytics, Coupons, Messages, Cart
- **Cart:** Click "Cart" in nav → shows items, quantities, coupon input, subtotal/discount/total
- **Coupons:** Click "Coupons" in nav → Coupon Management page with create/list/deactivate/delete
- **Orders:** Click "Orders" in nav → order list with status badges
- **Analytics:** Click "Analytics" in nav → seller dashboard with sales/views/conversion
- **Messages:** Click "Messages" in nav → conversation list and message thread

## Testing Coupon System (Example Flow)

1. Navigate to Coupons page
2. Click "+ Create Coupon"
3. Fill in code, discount type (percentage/fixed/free-shipping), value, end date
4. Click "Create Coupon" → verify it appears in the list with Active status
5. Navigate to Cart
6. Enter coupon code in "Have a coupon code?" input, click "Apply"
7. Verify discount is calculated correctly and shown in summary
8. Click "Remove" to verify total reverts

## Common Mongoose/JavaScript Pitfalls

These patterns have caused bugs in this codebase and might recur:

- **ObjectId comparison:** `wishlist.collaborators.includes(stringId)` fails because ObjectId !== string. Use `.some(id => id.toString() === stringId)` instead.
- **Falsy value checks:** `if (!price)` or `.filter(item => item.price)` treats `0` as falsy. Use `price == null` or `price != null` for nullish checks.
- **Nullish coalescing:** Use `??` instead of `||` when `0` or `false` are valid values (e.g., `usageLimit ?? null` not `usageLimit || null`).
- **Non-atomic MongoDB operations:** Read-modify-write patterns (read doc → modify in JS → save) cause race conditions. Use atomic operators (`$inc`, `$pull`, `$push`, `$addToSet`) with `findByIdAndUpdate` instead.
- **Route ordering:** Specific routes (e.g., `/stats/summary`) must come before parameterized routes (e.g., `/:id`) or Express will match the parameter first.
- **Alert ownership scoping:** Price alerts belong to the wishlist owner, not the collaborator making changes. All alert operations should scope to `wishlist.userId`.

## Common Issues

- If products don't load, check that the backend is running and connected to MongoDB
- Proxy errors on frontend startup are normal if the backend wasn't running yet — just refresh after starting the backend
- The `build` command (`npx react-scripts build`) serves as the lint check for the frontend
- ESLint warnings about missing useEffect dependencies are expected and non-blocking
