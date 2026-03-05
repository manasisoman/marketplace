const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware: these run on EVERY request before your routes
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};
app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Import models
const Product = require("./models/Product");
const Cart = require("./models/Cart");
const Favorite = require("./models/Favorite");

// ─────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────

// ENDPOINT 1: Health check — tells you the API is alive
app.get("/", (req, res) => {
  res.json({ message: "Marketplace API is running", endpoints: 9 });
});

// ─────────────────────────────────────────────
// PRODUCT ENDPOINTS
// ─────────────────────────────────────────────

// ENDPOINT 2: GET all products (with optional pagination)
// Example: GET http://localhost:5000/products?page=1&limit=20
app.get("/products", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments();
    const products = await Product.find()
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit);

    res.json({
      products,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ENDPOINT 3: SEARCH products by name or description
// Example: GET http://localhost:5000/products/search?q=shoes
// IMPORTANT: This MUST come before /products/:id or Express will treat "search" as an id
app.get("/products/search", async (req, res) => {
  try {
    const query = req.query.q || "";
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },        // case-insensitive name match
        { description: { $regex: query, $options: "i" } }, // case-insensitive description match
      ],
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

// ENDPOINT 4: GET a single product by its ID
// Example: GET http://localhost:5000/products/64abc123...
app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// ENDPOINT 5: CREATE a new product
// Example: POST http://localhost:5000/products  with JSON body
app.post("/products", async (req, res) => {
  try {
    const { name, price, description, image, category } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: "Name and price are required" });
    }
    const product = new Product({ name, price, description, image, category });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

// ENDPOINT 6: UPDATE an existing product
// Example: PUT http://localhost:5000/products/64abc123...  with updated JSON body
app.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // return the updated doc
    );
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

// ENDPOINT 7: DELETE a product
// Example: DELETE http://localhost:5000/products/64abc123...
app.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// ─────────────────────────────────────────────
// CART ENDPOINTS
// ─────────────────────────────────────────────

// ENDPOINT 8: GET all cart items
// Example: GET http://localhost:5000/cart
app.get("/cart", async (req, res) => {
  try {
    const items = await Cart.find().sort({ createdAt: -1 });
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.json({ items, total: parseFloat(total.toFixed(2)), count: items.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// ENDPOINT 9: ADD item to cart (or increase quantity if already in cart)
// Example: POST http://localhost:5000/cart  with { productId, name, price, image, quantity }
app.post("/cart", async (req, res) => {
  try {
    const { productId, name, price, image, quantity = 1 } = req.body;
    if (!productId || !name || !price) {
      return res.status(400).json({ error: "productId, name, and price are required" });
    }

    // Check if this product is already in the cart
    const existing = await Cart.findOne({ productId });
    if (existing) {
      existing.quantity += quantity;
      await existing.save();
      return res.json(existing);
    }

    const item = new Cart({ productId, name, price, image, quantity });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// ENDPOINT 10: UPDATE cart item quantity
// Example: PUT http://localhost:5000/cart/64abc123...  with { quantity: 3 }
app.put("/cart/:id", async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity == null || typeof quantity !== 'number') {
      return res.status(400).json({ error: "A numeric quantity is required" });
    }
    if (quantity <= 0) {
      const item = await Cart.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ error: "Cart item not found" });
      return res.json({ message: "Item removed from cart" });
    }
    const item = await Cart.findByIdAndUpdate(
      req.params.id,
      { quantity },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: "Cart item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to update cart item" });
  }
});

// ENDPOINT 11: REMOVE an item from the cart
// Example: DELETE http://localhost:5000/cart/64abc123...
app.delete("/cart/:id", async (req, res) => {
  try {
    const item = await Cart.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Cart item not found" });
    res.json({ message: "Item removed from cart" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove cart item" });
  }
});

// ─────────────────────────────────────────────
// FAVORITE ENDPOINTS
// ─────────────────────────────────────────────

// GET all favorites
app.get("/favorites", async (req, res) => {
  try {
    const favs = await Favorite.find().sort({ createdAt: -1 });
    res.json(favs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

// POST: add a product to favorites
app.post("/favorites", async (req, res) => {
  try {
    const { productId, name, price, image } = req.body;
    if (!productId || !name || !price)
      return res.status(400).json({ error: "productId, name, and price are required" });
    const existing = await Favorite.findOne({ productId });
    if (existing) return res.json(existing); // already favorited — idempotent
    const fav = new Favorite({ productId, name, price, image });
    await fav.save();
    res.status(201).json(fav);
  } catch (err) {
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

// DELETE: remove a product from favorites
app.delete("/favorites/:id", async (req, res) => {
  try {
    const fav = await Favorite.findByIdAndDelete(req.params.id);
    if (!fav) return res.status(404).json({ error: "Favorite not found" });
    res.json({ message: "Favorite removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
