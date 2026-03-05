const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Order = require("../models/Order");

// Valid status transitions map
const validTransitions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

// GET /api/orders — list orders for the authenticated user (buyer or seller)
router.get("/", auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Filter by role: buyer sees their orders, seller sees orders for their products
    const filter = req.query.role === "seller"
      ? { sellerId: req.user._id }
      : { buyerId: req.user._id };

    // Optional status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      orders,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// GET /api/orders/:id — get a single order
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only buyer or seller can view the order
    const isBuyer = order.buyerId.toString() === req.user._id.toString();
    const isSeller = order.sellerId && order.sellerId.toString() === req.user._id.toString();
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// PUT /api/orders/:id/status — update order status (seller or admin)
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status, note, trackingNumber, carrier } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only seller can update order status
    const isSeller = order.sellerId && order.sellerId.toString() === req.user._id.toString();
    if (!isSeller) {
      return res.status(403).json({ error: "Only the seller can update order status" });
    }

    // Validate status transition
    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from '${order.status}' to '${status}'. Allowed: ${allowed.join(", ") || "none"}`,
      });
    }

    // If shipping, require tracking info
    if (status === "shipped") {
      if (!trackingNumber || !carrier) {
        return res.status(400).json({
          error: "Tracking number and carrier are required when shipping",
        });
      }
      order.trackingNumber = trackingNumber;
      order.carrier = carrier;
    }

    // Update status and push to history
    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`,
    });

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// GET /api/orders/:id/tracking — get tracking info
router.get("/:id/tracking", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only buyer or seller can view tracking
    const isBuyer = order.buyerId.toString() === req.user._id.toString();
    const isSeller = order.sellerId && order.sellerId.toString() === req.user._id.toString();
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: "Not authorized to view tracking" });
    }

    res.json({
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      currentStatus: order.status,
      statusHistory: order.statusHistory,
      estimatedDelivery: null, // Would integrate with carrier API in production
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tracking info" });
  }
});

// POST /api/orders/:id/refund — request a refund (buyer)
router.post("/:id/refund", auth, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Refund reason is required" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only buyer can request refund
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the buyer can request a refund" });
    }

    // Can only request refund for delivered or shipped orders
    if (!["delivered", "shipped"].includes(order.status)) {
      return res.status(400).json({
        error: "Refunds can only be requested for shipped or delivered orders",
      });
    }

    // Can't request refund if one is already in progress
    if (order.refundStatus !== "none") {
      return res.status(400).json({
        error: `Refund already ${order.refundStatus}`,
      });
    }

    order.refundStatus = "requested";
    order.refundReason = reason;
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      note: `Refund requested: ${reason}`,
    });

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to request refund" });
  }
});

// PUT /api/orders/:id/refund — approve or reject refund (seller or admin)
router.put("/:id/refund", auth, async (req, res) => {
  try {
    const { action, amount } = req.body;

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Action must be 'approve' or 'reject'" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only seller can process refunds
    const isSeller = order.sellerId && order.sellerId.toString() === req.user._id.toString();
    if (!isSeller) {
      return res.status(403).json({ error: "Only the seller can process refund requests" });
    }

    // Only process if refund is in 'requested' state
    if (order.refundStatus !== "requested") {
      return res.status(400).json({ error: "No pending refund request" });
    }

    if (action === "approve") {
      order.refundStatus = "approved";
      order.refundAmount = amount != null ? amount : order.totalAmount;
      order.status = "refunded";
      order.statusHistory.push({
        status: "refunded",
        timestamp: new Date(),
        note: `Refund approved for $${(amount != null ? amount : order.totalAmount).toFixed(2)}`,
      });
    } else {
      order.refundStatus = "rejected";
      order.statusHistory.push({
        status: order.status,
        timestamp: new Date(),
        note: "Refund request rejected",
      });
    }

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to process refund" });
  }
});

module.exports = router;
