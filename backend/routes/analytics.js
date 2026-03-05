const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const Order = require("../models/Order");
const ProductView = require("../models/ProductView");
const Product = require("../models/Product");
const Cart = require("../models/Cart");

/**
 * Helper: get a date threshold based on period string.
 * Supported periods: 7d, 30d, 90d, all
 */
function getDateThreshold(period) {
  const now = new Date();
  switch (period) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "all":
      return new Date(0);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

// GET /api/analytics/sales — sales summary for the authenticated seller
router.get("/sales", auth, async (req, res) => {
  try {
    const period = req.query.period || "30d";
    const dateThreshold = getDateThreshold(period);

    // Get seller's product IDs
    const sellerProducts = await Product.find({ sellerId: req.user._id }).select("_id");
    const productIds = sellerProducts.map((p) => p._id);

    // If the seller has no products, return empty stats
    if (productIds.length === 0) {
      return res.json({
        totalRevenue: 0,
        totalOrders: 0,
        ordersByStatus: {},
        topProductsByRevenue: [],
        topProductsByQuantity: [],
        period,
      });
    }

    // Aggregate orders containing the seller's products within the period
    const orders = await Order.find({
      "items.productId": { $in: productIds },
      createdAt: { $gte: dateThreshold },
    });

    let totalRevenue = 0;
    let totalOrders = 0;
    const ordersByStatus = {};
    const productRevenue = {};
    const productQuantity = {};

    for (const order of orders) {
      let orderHasSellerItem = false;
      for (const item of order.items) {
        if (productIds.some((pid) => pid.toString() === item.productId.toString())) {
          totalRevenue += item.price * item.quantity;
          orderHasSellerItem = true;

          const pid = item.productId.toString();
          productRevenue[pid] = (productRevenue[pid] || 0) + item.price * item.quantity;
          productQuantity[pid] = (productQuantity[pid] || 0) + item.quantity;
        }
      }
      if (orderHasSellerItem) {
        totalOrders++;
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
      }
    }

    // Top 5 by revenue
    const topProductsByRevenue = Object.entries(productRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pid, revenue]) => ({ productId: pid, revenue }));

    // Top 5 by quantity
    const topProductsByQuantity = Object.entries(productQuantity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pid, quantity]) => ({ productId: pid, quantity }));

    // Populate product names
    for (const item of [...topProductsByRevenue, ...topProductsByQuantity]) {
      const product = await Product.findById(item.productId).select("name");
      item.productName = product ? product.name : "Unknown";
    }

    res.json({
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      ordersByStatus,
      topProductsByRevenue,
      topProductsByQuantity,
      period,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sales analytics" });
  }
});

// GET /api/analytics/views — view data for the seller's products
router.get("/views", auth, async (req, res) => {
  try {
    const period = req.query.period || "30d";
    const dateThreshold = getDateThreshold(period);

    const sellerProducts = await Product.find({ sellerId: req.user._id }).select("_id name");
    const productIds = sellerProducts.map((p) => p._id);

    if (productIds.length === 0) {
      return res.json({
        totalViews: 0,
        uniqueViewers: 0,
        viewsPerProduct: [],
        period,
      });
    }

    // Aggregate views
    const viewsAgg = await ProductView.aggregate([
      {
        $match: {
          productId: { $in: productIds },
          createdAt: { $gte: dateThreshold },
        },
      },
      {
        $group: {
          _id: "$productId",
          totalViews: { $sum: 1 },
          uniqueViewers: { $addToSet: "$userId" },
        },
      },
    ]);

    let totalViews = 0;
    const allUniqueViewers = new Set();
    const viewsPerProduct = [];

    for (const entry of viewsAgg) {
      totalViews += entry.totalViews;
      entry.uniqueViewers.forEach((uid) => {
        if (uid) allUniqueViewers.add(uid.toString());
      });

      const product = sellerProducts.find(
        (p) => p._id.toString() === entry._id.toString()
      );
      viewsPerProduct.push({
        productId: entry._id,
        productName: product ? product.name : "Unknown",
        views: entry.totalViews,
        uniqueViewers: entry.uniqueViewers.filter(Boolean).length,
      });
    }

    res.json({
      totalViews,
      uniqueViewers: allUniqueViewers.size,
      viewsPerProduct: viewsPerProduct.sort((a, b) => b.views - a.views),
      period,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch view analytics" });
  }
});

// GET /api/analytics/conversion — conversion metrics for the seller's products
router.get("/conversion", auth, async (req, res) => {
  try {
    const period = req.query.period || "30d";
    const dateThreshold = getDateThreshold(period);

    const sellerProducts = await Product.find({ sellerId: req.user._id }).select("_id name");
    const productIds = sellerProducts.map((p) => p._id);

    if (productIds.length === 0) {
      return res.json({
        overallConversion: { views: 0, cartAdds: 0, purchases: 0 },
        perProduct: [],
        period,
      });
    }

    // Get total views per product
    const viewsAgg = await ProductView.aggregate([
      {
        $match: {
          productId: { $in: productIds },
          createdAt: { $gte: dateThreshold },
        },
      },
      { $group: { _id: "$productId", views: { $sum: 1 } } },
    ]);

    // Get cart additions per product
    const cartAgg = await Cart.aggregate([
      {
        $match: {
          productId: { $in: productIds },
          createdAt: { $gte: dateThreshold },
        },
      },
      { $group: { _id: "$productId", cartAdds: { $sum: 1 } } },
    ]);

    // Get purchases per product from orders
    const orders = await Order.find({
      "items.productId": { $in: productIds },
      createdAt: { $gte: dateThreshold },
      status: { $nin: ["cancelled", "refunded"] },
    });

    const purchasesByProduct = {};
    for (const order of orders) {
      for (const item of order.items) {
        if (productIds.some((pid) => pid.toString() === item.productId.toString())) {
          const pid = item.productId.toString();
          purchasesByProduct[pid] = (purchasesByProduct[pid] || 0) + item.quantity;
        }
      }
    }

    // Build per-product conversion data
    let totalViews = 0;
    let totalCartAdds = 0;
    let totalPurchases = 0;
    const perProduct = [];

    for (const product of sellerProducts) {
      const pid = product._id.toString();
      const views = (viewsAgg.find((v) => v._id.toString() === pid) || {}).views || 0;
      const cartAdds = (cartAgg.find((c) => c._id.toString() === pid) || {}).cartAdds || 0;
      const purchases = purchasesByProduct[pid] || 0;

      totalViews += views;
      totalCartAdds += cartAdds;
      totalPurchases += purchases;

      perProduct.push({
        productId: pid,
        productName: product.name,
        views,
        cartAdds,
        purchases,
        viewToCartRate: views > 0 ? parseFloat(((cartAdds / views) * 100).toFixed(2)) : 0,
        cartToPurchaseRate: cartAdds > 0 ? parseFloat(((purchases / cartAdds) * 100).toFixed(2)) : 0,
      });
    }

    res.json({
      overallConversion: {
        views: totalViews,
        cartAdds: totalCartAdds,
        purchases: totalPurchases,
        viewToCartRate: totalViews > 0 ? parseFloat(((totalCartAdds / totalViews) * 100).toFixed(2)) : 0,
        cartToPurchaseRate: totalCartAdds > 0 ? parseFloat(((totalPurchases / totalCartAdds) * 100).toFixed(2)) : 0,
      },
      perProduct: perProduct.sort((a, b) => b.views - a.views),
      period,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversion analytics" });
  }
});

module.exports = router;
