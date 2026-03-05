const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const auth = require("../middleware/auth");
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const PriceAlert = require("../models/PriceAlert");

// GET /api/wishlists — list all wishlists for authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const wishlists = await Wishlist.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .populate("items.productId", "name price image category");
    res.json(wishlists);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch wishlists" });
  }
});

// POST /api/wishlists — create a new wishlist
router.post("/", auth, async (req, res) => {
  try {
    const { name, description, isPublic, tags } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Wishlist name is required" });
    }

    const wishlist = new Wishlist({
      userId: req.user._id,
      name: name.trim(),
      description: description || "",
      isPublic: isPublic || false,
      tags: tags || [],
    });

    if (isPublic) {
      wishlist.shareToken = crypto.randomBytes(16).toString("hex");
    }

    await wishlist.save();
    res.status(201).json(wishlist);
  } catch (err) {
    res.status(500).json({ error: "Failed to create wishlist" });
  }
});

// GET /api/wishlists/shared/:shareToken — view a shared wishlist (public, no auth)
router.get("/shared/:shareToken", async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      shareToken: req.params.shareToken,
      isPublic: true,
    })
      .populate("userId", "name avatar")
      .populate("items.productId", "name price image category");

    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found or is private" });
    }
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch shared wishlist" });
  }
});

// GET /api/wishlists/:id — get a single wishlist
router.get("/:id", auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user._id },
        { collaborators: req.user._id },
      ],
    }).populate("items.productId", "name price image category");

    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

// PUT /api/wishlists/:id — update wishlist metadata
router.put("/:id", auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ _id: req.params.id, userId: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }

    const { name, description, isPublic, tags } = req.body;
    if (name) wishlist.name = name.trim();
    if (description !== undefined) wishlist.description = description;
    if (tags !== undefined) wishlist.tags = tags;

    if (isPublic !== undefined) {
      wishlist.isPublic = isPublic;
      if (isPublic && !wishlist.shareToken) {
        wishlist.shareToken = crypto.randomBytes(16).toString("hex");
      }
    }

    await wishlist.save();
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: "Failed to update wishlist" });
  }
});

// DELETE /api/wishlists/:id — delete a wishlist
router.delete("/:id", auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }
    // Clean up price alerts only for products not in other wishlists with alerts
    const productIds = wishlist.items.map((item) => item.productId);
    const otherWishlists = await Wishlist.find({
      userId: req.user._id,
      _id: { $ne: wishlist._id },
      "items.productId": { $in: productIds },
    });
    const protectedProductIds = new Set(
      otherWishlists.flatMap((wl) =>
        wl.items.filter((i) => i.alertOnPriceDrop).map((i) => i.productId.toString())
      )
    );
    const productIdsToDelete = productIds.filter((id) => !protectedProductIds.has(id.toString()));
    if (productIdsToDelete.length > 0) {
      await PriceAlert.deleteMany({ userId: req.user._id, productId: { $in: productIdsToDelete } });
    }

    res.json({ message: "Wishlist deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete wishlist" });
  }
});

// POST /api/wishlists/:id/items — add a product to a wishlist
router.post("/:id/items", auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      _id: req.params.id,
      $or: [{ userId: req.user._id }, { collaborators: req.user._id }],
    });
    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }

    const { productId, note, alertOnPriceDrop, targetPrice } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    // Check if product already in wishlist
    const exists = wishlist.items.find((item) => item.productId.toString() === productId);
    if (exists) {
      return res.status(409).json({ error: "Product already in this wishlist" });
    }

    // Look up product to get current price
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    wishlist.items.push({
      productId,
      note: note || "",
      priceAtAdd: product.price,
      alertOnPriceDrop: alertOnPriceDrop || false,
      targetPrice: targetPrice != null ? targetPrice : null,
    });

    await wishlist.save();

    // Create price alert if requested
    if (alertOnPriceDrop && targetPrice != null) {
      await PriceAlert.findOneAndUpdate(
        { userId: req.user._id, productId, isActive: true },
        {
          userId: req.user._id,
          productId,
          targetPrice,
          originalPrice: product.price,
          isActive: true,
        },
        { upsert: true, new: true }
      );
    }

    await wishlist.populate("items.productId", "name price image category");
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: "Failed to add item to wishlist" });
  }
});

// PUT /api/wishlists/:id/items/:productId — update note or alert settings for an item
router.put("/:id/items/:productId", auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      _id: req.params.id,
      $or: [{ userId: req.user._id }, { collaborators: req.user._id }],
    });
    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }

    const item = wishlist.items.find(
      (i) => i.productId.toString() === req.params.productId
    );
    if (!item) {
      return res.status(404).json({ error: "Item not found in wishlist" });
    }

    const { note, alertOnPriceDrop, targetPrice } = req.body;
    if (note !== undefined) item.note = note;
    if (alertOnPriceDrop !== undefined) item.alertOnPriceDrop = alertOnPriceDrop;
    if (targetPrice !== undefined) item.targetPrice = targetPrice;

    await wishlist.save();

    // Update price alert
    if (alertOnPriceDrop && targetPrice != null) {
      const product = await Product.findById(req.params.productId);
      await PriceAlert.findOneAndUpdate(
        { userId: req.user._id, productId: req.params.productId, isActive: true },
        {
          userId: req.user._id,
          productId: req.params.productId,
          targetPrice,
          originalPrice: product ? product.price : 0,
          isActive: true,
        },
        { upsert: true, new: true }
      );
    } else if (alertOnPriceDrop === false) {
      await PriceAlert.updateMany(
        { userId: req.user._id, productId: req.params.productId },
        { isActive: false }
      );
    }

    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: "Failed to update wishlist item" });
  }
});

// DELETE /api/wishlists/:id/items/:productId — remove a product from a wishlist
router.delete("/:id/items/:productId", auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      _id: req.params.id,
      $or: [{ userId: req.user._id }, { collaborators: req.user._id }],
    });
    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }

    const itemIndex = wishlist.items.findIndex(
      (i) => i.productId.toString() === req.params.productId
    );
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in wishlist" });
    }

    wishlist.items.splice(itemIndex, 1);
    await wishlist.save();

    // Deactivate price alerts for this product — check ALL users' wishlists, not just requester
    const anyWishlistWithAlert = await Wishlist.findOne({
      "items": { $elemMatch: { productId: req.params.productId, alertOnPriceDrop: true } },
    });
    if (!anyWishlistWithAlert) {
      // No wishlist anywhere has an active alert for this product — deactivate all alerts
      await PriceAlert.updateMany(
        { productId: req.params.productId },
        { isActive: false }
      );
    }

    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: "Failed to remove item from wishlist" });
  }
});

// POST /api/wishlists/:id/collaborators — add a collaborator
router.post("/:id/collaborators", auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ _id: req.params.id, userId: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }

    const { collaboratorId } = req.body;
    if (!collaboratorId) {
      return res.status(400).json({ error: "collaboratorId is required" });
    }

    if (wishlist.collaborators.includes(collaboratorId)) {
      return res.status(409).json({ error: "User is already a collaborator" });
    }

    wishlist.collaborators.push(collaboratorId);
    await wishlist.save();
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: "Failed to add collaborator" });
  }
});

// GET /api/wishlists/:id/price-changes — get price changes for wishlist items
router.get("/:id/price-changes", auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      _id: req.params.id,
      $or: [{ userId: req.user._id }, { collaborators: req.user._id }],
    }).populate("items.productId", "name price image category");

    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }

    const priceChanges = wishlist.items
      .filter((item) => item.productId && item.priceAtAdd)
      .map((item) => ({
        productId: item.productId._id,
        name: item.productId.name,
        image: item.productId.image,
        priceAtAdd: item.priceAtAdd,
        currentPrice: item.productId.price,
        priceDiff: item.productId.price - item.priceAtAdd,
        percentChange: (((item.productId.price - item.priceAtAdd) / item.priceAtAdd) * 100).toFixed(1),
      }))
      .filter((item) => item.priceDiff !== 0);

    res.json({
      wishlistId: wishlist._id,
      wishlistName: wishlist.name,
      priceChanges,
      totalSavings: priceChanges
        .filter((c) => c.priceDiff < 0)
        .reduce((sum, c) => sum + Math.abs(c.priceDiff), 0),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to check price changes" });
  }
});

module.exports = router;
