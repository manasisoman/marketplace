const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Inventory = require("../models/Inventory");
const Product = require("../models/Product");

// GET /api/inventory/product/:productId — get all inventory entries for a product
router.get("/product/:productId", async (req, res) => {
  try {
    const entries = await Inventory.find({
      productId: req.params.productId,
      isActive: true,
    }).sort({ "variant.size": 1, "variant.color": 1 });

    const totalStock = entries.reduce((sum, e) => sum + e.quantity - e.reserved, 0);
    const lowStockItems = entries.filter((e) => e.quantity - e.reserved <= e.lowStockThreshold);

    res.json({
      productId: req.params.productId,
      variants: entries,
      totalStock,
      lowStockCount: lowStockItems.length,
      availableSizes: [...new Set(entries.map((e) => e.variant.size).filter(Boolean))],
      availableColors: [...new Set(entries.map((e) => e.variant.color).filter(Boolean))],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// POST /api/inventory — create a new inventory entry (variant)
router.post("/", auth, async (req, res) => {
  try {
    const {
      productId, sku, variant, quantity, lowStockThreshold,
      warehouseLocation, costPrice, weight, barcode,
    } = req.body;

    if (!productId || !sku) {
      return res.status(400).json({ error: "productId and sku are required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const entry = new Inventory({
      productId,
      sku,
      variant: variant || {},
      quantity: quantity || 0,
      lowStockThreshold: lowStockThreshold || 5,
      warehouseLocation: warehouseLocation || "",
      costPrice: costPrice || 0,
      weight: weight || 0,
      barcode: barcode || "",
    });

    await entry.save();

    // Update product's hasVariants and totalStock
    await updateProductStockInfo(productId);

    res.status(201).json(entry);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "SKU already exists" });
    }
    res.status(500).json({ error: "Failed to create inventory entry" });
  }
});

// PUT /api/inventory/:id — update an inventory entry
router.put("/:id", auth, async (req, res) => {
  try {
    const entry = await Inventory.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: "Inventory entry not found" });
    }

    const allowedFields = [
      "variant", "quantity", "lowStockThreshold", "warehouseLocation",
      "costPrice", "weight", "barcode", "isActive",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        entry[field] = req.body[field];
      }
    }

    await entry.save();
    await updateProductStockInfo(entry.productId);

    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: "Failed to update inventory entry" });
  }
});

// POST /api/inventory/:id/restock — restock an inventory item
router.post("/:id/restock", auth, async (req, res) => {
  try {
    const { quantity, note, supplier } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Positive quantity is required" });
    }

    const entry = await Inventory.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: "Inventory entry not found" });
    }

    entry.quantity += quantity;
    entry.lastRestockedAt = new Date();
    entry.restockHistory.push({
      quantity,
      note: note || "",
      supplier: supplier || "",
    });

    await entry.save();
    await updateProductStockInfo(entry.productId);

    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: "Failed to restock" });
  }
});

// POST /api/inventory/:id/reserve — reserve stock (e.g., when item added to cart)
router.post("/:id/reserve", auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Positive quantity is required" });
    }

    const entry = await Inventory.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: "Inventory entry not found" });
    }

    const available = entry.quantity - entry.reserved;
    if (quantity > available) {
      return res.status(409).json({
        error: "Insufficient stock",
        available,
        requested: quantity,
      });
    }

    entry.reserved += quantity;
    await entry.save();

    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: "Failed to reserve stock" });
  }
});

// POST /api/inventory/:id/release — release reserved stock
router.post("/:id/release", auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Positive quantity is required" });
    }

    const entry = await Inventory.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: "Inventory entry not found" });
    }

    entry.reserved = Math.max(0, entry.reserved - quantity);
    await entry.save();

    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: "Failed to release stock" });
  }
});

// GET /api/inventory/low-stock — get all low-stock items (for seller dashboard)
router.get("/low-stock", auth, async (req, res) => {
  try {
    const entries = await Inventory.find({ isActive: true })
      .populate("productId", "name price image category")
      .sort({ quantity: 1 });

    const lowStock = entries.filter((e) => e.quantity - e.reserved <= e.lowStockThreshold);

    res.json({
      lowStockItems: lowStock,
      totalLowStock: lowStock.length,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch low-stock items" });
  }
});

// DELETE /api/inventory/:id — deactivate an inventory entry
router.delete("/:id", auth, async (req, res) => {
  try {
    const entry = await Inventory.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: "Inventory entry not found" });
    }

    entry.isActive = false;
    await entry.save();
    await updateProductStockInfo(entry.productId);

    res.json({ message: "Inventory entry deactivated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to deactivate inventory entry" });
  }
});

// Helper: Update product's aggregate stock info
async function updateProductStockInfo(productId) {
  const entries = await Inventory.find({ productId, isActive: true });
  const totalStock = entries.reduce((sum, e) => sum + e.quantity - e.reserved, 0);
  const hasVariants = entries.length > 1 || entries.some(
    (e) => e.variant.size || e.variant.color || e.variant.material
  );

  await Product.findByIdAndUpdate(productId, {
    totalStock,
    hasVariants,
    variantCount: entries.length,
  });
}

module.exports = router;
