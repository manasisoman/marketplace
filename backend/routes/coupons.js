const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Coupon = require("../models/Coupon");
const Product = require("../models/Product");
const Cart = require("../models/Cart");

// POST /api/coupons — create a new coupon (seller/admin)
router.post("/", auth, async (req, res) => {
  try {
    const {
      code, description, discountType, discountValue, minimumOrderAmount,
      maximumDiscount, applicableCategories, applicableProducts, excludedProducts,
      usageLimit, perUserLimit, startDate, endDate, stackable, firstOrderOnly,
    } = req.body;

    if (!code || !discountType || discountValue === undefined || !endDate) {
      return res.status(400).json({
        error: "code, discountType, discountValue, and endDate are required",
      });
    }

    if (discountType === "percentage" && (discountValue < 0 || discountValue > 100)) {
      return res.status(400).json({ error: "Percentage discount must be between 0 and 100" });
    }

    const coupon = new Coupon({
      code: code.toUpperCase().trim(),
      description,
      discountType,
      discountValue,
      minimumOrderAmount: minimumOrderAmount || 0,
      maximumDiscount: maximumDiscount || null,
      applicableCategories: applicableCategories || [],
      applicableProducts: applicableProducts || [],
      excludedProducts: excludedProducts || [],
      usageLimit: usageLimit ?? null,
      perUserLimit: perUserLimit ?? 1,
      startDate: startDate || new Date(),
      endDate: new Date(endDate),
      stackable: stackable || false,
      firstOrderOnly: firstOrderOnly || false,
      createdBy: req.user._id,
    });

    await coupon.save();
    res.status(201).json(coupon);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Coupon code already exists" });
    }
    res.status(500).json({ error: "Failed to create coupon" });
  }
});

// GET /api/coupons — list all coupons (seller/admin view)
router.get("/", auth, async (req, res) => {
  try {
    const { active, expired } = req.query;
    const filter = {};

    if (active === "true") {
      filter.isActive = true;
      filter.endDate = { $gte: new Date() };
    } else if (expired === "true") {
      filter.endDate = { $lt: new Date() };
    }

    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch coupons" });
  }
});

// POST /api/coupons/validate — validate a coupon code and calculate discount
router.post("/validate", auth, async (req, res) => {
  try {
    const { code, cartTotal, cartItems } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Coupon code is required" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    // Check if coupon is valid
    const now = new Date();
    if (!coupon.isActive) {
      return res.status(400).json({ error: "This coupon is no longer active" });
    }
    if (now < coupon.startDate) {
      return res.status(400).json({ error: "This coupon is not yet active" });
    }
    if (now > coupon.endDate) {
      return res.status(400).json({ error: "This coupon has expired" });
    }
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ error: "This coupon has reached its usage limit" });
    }

    // Check per-user limit
    const userUsageCount = coupon.usedBy.filter(
      (u) => u.userId.toString() === req.user._id.toString()
    ).length;
    if (userUsageCount >= coupon.perUserLimit) {
      return res.status(400).json({ error: "You have already used this coupon" });
    }

    // Check minimum order amount
    const orderTotal = cartTotal || 0;
    if (orderTotal < coupon.minimumOrderAmount) {
      return res.status(400).json({
        error: `Minimum order amount of $${coupon.minimumOrderAmount.toFixed(2)} required`,
        minimumOrderAmount: coupon.minimumOrderAmount,
        currentTotal: orderTotal,
      });
    }

    // Calculate discount
    let discount = 0;
    let eligibleAmount = orderTotal;

    // Filter by applicable categories/products if specified
    if (cartItems && cartItems.length > 0) {
      if (coupon.applicableCategories.length > 0) {
        const eligibleItems = cartItems.filter((item) =>
          coupon.applicableCategories.includes(item.category)
        );
        eligibleAmount = eligibleItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      }

      if (coupon.excludedProducts.length > 0) {
        const excluded = coupon.excludedProducts.map((id) => id.toString());
        const baseItems = coupon.applicableCategories.length > 0
          ? cartItems.filter((item) => coupon.applicableCategories.includes(item.category))
          : cartItems;
        const filteredItems = baseItems.filter((item) => !excluded.includes(item.productId));
        eligibleAmount = filteredItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      }
    }

    switch (coupon.discountType) {
      case "percentage":
        discount = (eligibleAmount * coupon.discountValue) / 100;
        if (coupon.maximumDiscount !== null) {
          discount = Math.min(discount, coupon.maximumDiscount);
        }
        break;
      case "fixed":
        discount = Math.min(coupon.discountValue, eligibleAmount);
        break;
      case "free_shipping":
        discount = 0; // Shipping discount handled separately
        break;
    }

    discount = parseFloat(discount.toFixed(2));

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discount,
      newTotal: parseFloat((orderTotal - discount).toFixed(2)),
      freeShipping: coupon.discountType === "free_shipping",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to validate coupon" });
  }
});

// POST /api/coupons/apply — apply a coupon (called during checkout)
router.post("/apply", auth, async (req, res) => {
  try {
    const { code, orderId } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Coupon code is required" });
    }

    // Atomic apply with per-user limit check
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon || !coupon.isValid) {
      return res.status(400).json({ error: "Invalid or expired coupon" });
    }

    // Check per-user limit before applying
    const userUsageCount = coupon.usedBy.filter(
      (u) => u.userId.toString() === req.user._id.toString()
    ).length;
    if (userUsageCount >= coupon.perUserLimit) {
      return res.status(400).json({ error: "You have already used this coupon" });
    }

    // Atomic increment with per-user limit enforced in filter
    const perUserLimit = coupon.perUserLimit;
    const userId = req.user._id;
    const userFilterEntries = Array(perUserLimit).fill(userId);
    const updated = await Coupon.findOneAndUpdate(
      {
        _id: coupon._id,
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        $or: [{ usageLimit: null }, { $expr: { $lt: ["$usageCount", "$usageLimit"] } }],
        "usedBy.userId": { $not: { $all: userFilterEntries } },
      },
      {
        $inc: { usageCount: 1 },
        $push: { usedBy: { userId, orderId: orderId || null } },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({ error: "Coupon is no longer valid or usage limit reached" });
    }

    res.json({ message: "Coupon applied successfully", coupon: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to apply coupon" });
  }
});

// GET /api/coupons/stats/summary — coupon usage statistics (must be before /:id)
router.get("/stats/summary", auth, async (req, res) => {
  try {
    const totalCoupons = await Coupon.countDocuments();
    const activeCoupons = await Coupon.countDocuments({ isActive: true, endDate: { $gte: new Date() } });
    const expiredCoupons = await Coupon.countDocuments({ endDate: { $lt: new Date() } });

    const coupons = await Coupon.find();
    const totalRedemptions = coupons.reduce((sum, c) => sum + c.usageCount, 0);
    const totalDiscountGiven = coupons.reduce((sum, c) => {
      return sum + c.usedBy.length * (c.discountType === "percentage" ? 0 : c.discountValue);
    }, 0);

    res.json({
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      totalRedemptions,
      estimatedDiscountGiven: totalDiscountGiven,
      topCoupons: coupons
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5)
        .map((c) => ({ code: c.code, usageCount: c.usageCount, discountType: c.discountType })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch coupon stats" });
  }
});

// GET /api/coupons/:id — get a single coupon
router.get("/:id", auth, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch coupon" });
  }
});

// PUT /api/coupons/:id — update a coupon
router.put("/:id", auth, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    const allowedFields = [
      "description", "discountValue", "minimumOrderAmount", "maximumDiscount",
      "applicableCategories", "applicableProducts", "excludedProducts",
      "usageLimit", "perUserLimit", "endDate", "isActive", "stackable", "firstOrderOnly",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        coupon[field] = req.body[field];
      }
    }

    await coupon.save();
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ error: "Failed to update coupon" });
  }
});

// DELETE /api/coupons/:id — deactivate a coupon
router.delete("/:id", auth, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    coupon.isActive = false;
    await coupon.save();
    res.json({ message: "Coupon deactivated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to deactivate coupon" });
  }
});

module.exports = router;
