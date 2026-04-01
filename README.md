# ShopHub — Marketplace App

A full-stack marketplace web application built with React, Node.js, Express, and MongoDB.

## Features

- Browse product listings with images, categories, and prices
- Search products by name or description (live search)
- List new products for sale
- Add products to cart (with quantity tracking)
- Remove items from cart with real-time total calculation
- Delete product listings
- Apply coupon codes for discounts
- Track inventory levels per product variant
- Save products to a wishlist
- Leave product reviews and ratings
- Place and manage orders
- Message sellers via conversations
- View sales analytics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Axios, CSS |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (Mongoose) |

## API Endpoints

### Core
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/products` | Get all products |
| GET | `/products/search?q=` | Search products |
| GET | `/products/:id` | Get single product |
| POST | `/products` | Create a product |
| PUT | `/products/:id` | Update a product |
| DELETE | `/products/:id` | Delete a product |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cart` | Get cart items + total |
| POST | `/cart` | Add item to cart |
| PUT | `/cart/:id` | Update cart item quantity |
| DELETE | `/cart` | Clear entire cart |
| DELETE | `/cart/:id` | Remove cart item |

### Additional Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/favorites` | List / add favorites |
| DELETE | `/favorites/:id` | Remove a favorite |
| GET/POST | `/categories` | List / create categories |
| GET/POST/DELETE | `/api/coupons` | Coupon management |
| GET/POST/PUT | `/api/inventory` | Inventory management |
| GET/POST/PUT/DELETE | `/api/wishlists` | Wishlist management |
| GET/POST/PUT/DELETE | `/api/reviews` | Product reviews |
| GET/POST/PUT | `/api/orders` | Order management |
| GET | `/api/analytics` | Sales analytics |
| GET/POST | `/api/conversations` | Seller conversations |
| GET/POST | `/api/messages` | Conversation messages |

## Running Locally

### Prerequisites
- Node.js (v18+)
- A MongoDB Atlas account (free tier works)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/marketplace.git
cd marketplace
```

### 2. Set up the backend
```bash
cd backend
npm install
```

Create a `.env` file (copy from `.env.example`):
```
MONGO_URI=your_mongodb_connection_string_here
PORT=5000
```

Start the backend:
```bash
npm run dev
```

### 3. Set up the frontend
```bash
cd ../frontend
npm install
npm start
```

The app will open at `http://localhost:3000`.

## Project Structure

```
marketplace/
├── backend/
│   ├── models/
│   │   ├── Product.js      # Product schema
│   │   └── Cart.js         # Cart schema
│   ├── server.js           # Express server + all API routes
│   ├── .env.example        # Template for environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── ProductGrid.js
│   │   │   ├── ProductCard.js
│   │   │   ├── AddProductForm.js
│   │   │   └── Cart.js
│   │   ├── App.js
│   │   └── App.css
│   └── package.json
└── README.md
```
