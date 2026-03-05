const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware: these run on EVERY request before your routes
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-user-id"],
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
const ProductView = require("./models/ProductView");
const Category = require("./models/Category");

// Import route files
const analyticsRouter = require("./routes/analytics");

// Register route files
app.use("/api/analytics", analyticsRouter);

// Import route files
const conversationsRouter = require("./routes/conversations");
const messagesRouter = require("./routes/messages");

// Register route files
app.use("/api/conversations", conversationsRouter);
app.use("/api/messages", messagesRouter);

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

// ENDPOINT 2: GET all products (with optional pagination, sorting, category, and price filters)
// Example: GET http://localhost:5000/products?page=1&limit=20&sortBy=price&order=asc&category=Electronics&minPrice=10&maxPrice=100
// Supported sortBy values: price, createdAt, name, rating
// Order: asc or desc (default: desc)
// Category filter: case-insensitive exact match on the product's category field
// Price filters: minPrice and maxPrice for price range filtering
app.get("/products", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Determine sort field and order
    const allowedSortFields = ["price", "createdAt", "name", "rating"];
    const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const sortOrder = { [sortBy]: order };

    // Also support legacy sort param for backward compatibility
    const legacySortOptions = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
    };
    const finalSort = req.query.sort && Object.prototype.hasOwnProperty.call(legacySortOptions, req.query.sort)
      ? legacySortOptions[req.query.sort]
      : sortOrder;

    // Build filter
    const filter = {};
    if (req.query.category) {
      filter.category = { $regex: new RegExp(`^${req.query.category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") };
    }
    if (req.query.minPrice) {
      filter.price = { ...filter.price, $gte: parseFloat(req.query.minPrice) };
    }
    if (req.query.maxPrice) {
      filter.price = { ...filter.price, $lte: parseFloat(req.query.maxPrice) };
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(finalSort)
      .skip(skip)
      .limit(limit);

    res.json({
      products,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      sortBy,
      order: order === 1 ? "asc" : "desc",
      ...(req.query.category ? { category: req.query.category } : {}),
      ...(req.query.minPrice ? { minPrice: parseFloat(req.query.minPrice) } : {}),
      ...(req.query.maxPrice ? { maxPrice: parseFloat(req.query.maxPrice) } : {}),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ENDPOINT 3: SEARCH products by name or description with filters
// Example: GET http://localhost:5000/products/search?q=shoes&category=Footwear&minPrice=20&maxPrice=200&sortBy=price&order=asc&page=1&limit=20
// IMPORTANT: This MUST come before /products/:id or Express will treat "search" as an id
app.get("/products/search", async (req, res) => {
  try {
    const query = req.query.q || "";
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Determine sort
    const allowedSortFields = ["price", "createdAt", "name", "rating"];
    const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const sortOrder = { [sortBy]: order };

    // Build filter with text search
    const filter = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    };

    // Apply category filter
    if (req.query.category) {
      filter.category = { $regex: new RegExp(`^${req.query.category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") };
    }
    // Apply price range filters
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sortOrder)
      .skip(skip)
      .limit(limit);

    res.json({
      products,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      query: query,
      sortBy,
      order: order === 1 ? "asc" : "desc",
    });
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

// ENDPOINT 4: GET a single product by its ID
// Example: GET http://localhost:5000/products/64abc123...
// Also tracks product views for analytics (fire-and-forget)
app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Track product view (fire-and-forget — don't block the response)
    ProductView.create({
      productId: product._id,
      userId: req.headers["x-user-id"] || null,
      sessionId: req.headers["x-session-id"] || null,
      referrer: req.headers.referer || null,
    }).catch(() => {}); // silently ignore tracking errors

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

// ENDPOINT 11: CLEAR all items from the cart
// Example: DELETE http://localhost:5000/cart
app.delete("/cart", async (req, res) => {
  try {
    const result = await Cart.deleteMany({});
    res.json({
      message: "Cart cleared successfully",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

// ENDPOINT 12: REMOVE an item from the cart
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

// GET: check if a product is favorited by productId
// Example: GET http://localhost:5000/favorites/product/64abc123...
app.get("/favorites/product/:productId", async (req, res) => {
  try {
    const fav = await Favorite.findOne({ productId: req.params.productId });
    if (!fav) return res.status(404).json({ isFavorited: false });
    res.json({ isFavorited: true, favorite: fav });
  } catch (err) {
    res.status(500).json({ error: "Failed to check favorite status" });
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

// ─────────────────────────────────────────────
// CATEGORY ENDPOINTS
// ─────────────────────────────────────────────

// GET all categories
app.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// POST: create a new category
app.post("/categories", async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: "Name and slug are required" });
    }
    const category = new Category({ name, slug, description });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Category already exists" });
    }
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
