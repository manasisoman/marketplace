const mongoose = require("mongoose");

const priceAlertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    targetPrice: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    isTriggered: { type: Boolean, default: false },
    triggeredAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    notificationSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One active alert per user per product
priceAlertSchema.index({ userId: 1, productId: 1, isActive: 1 });

module.exports = mongoose.model("PriceAlert", priceAlertSchema);
