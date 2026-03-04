# TradeHub — B2B Marketplace App

A full-stack B2B marketplace web application built with React, Node.js, Express, and MongoDB.

## Features

- Browse product listings with images, categories, and prices
- Search products by name or description (live search)
- List new products for sale
- Add products to cart (with quantity tracking)
- Remove items from cart with real-time total calculation
- Delete product listings
- Favorite and unfavorite products (persisted in MongoDB)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Axios, CSS |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (Mongoose) |

## API Endpoints (13 total)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/products` | Get all products |
| GET | `/products/search?q=` | Search products |
| GET | `/products/:id` | Get single product |
| POST | `/products` | Create a product |
| PUT | `/products/:id` | Update a product |
| DELETE | `/products/:id` | Delete a product |
| GET | `/cart` | Get cart items + total |
| POST | `/cart` | Add item to cart |
| DELETE | `/cart/:id` | Remove cart item |
| GET | `/favorites` | Get all favorites |
| POST | `/favorites` | Add product to favorites |
| DELETE | `/favorites/:id` | Remove product from favorites |

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
│   │   ├── Cart.js         # Cart schema
│   │   └── Favorite.js     # Favorite schema
│   ├── server.js           # Express server + all API routes
│   ├── seed.js             # Database seed script
│   ├── .env.example        # Template for environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── ProductGrid.js
│   │   │   ├── ProductCard.js
│   │   │   ├── AddProductForm.js
│   │   │   ├── ProductDetail.js
│   │   │   └── Cart.js
│   │   ├── App.js
│   │   └── App.css
│   └── package.json
└── README.md
```
