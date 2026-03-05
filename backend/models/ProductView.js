const mongoose = require("mongoose");

const productViewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sessionId: { type: String },
    referrer: { type: String },
  },
  { timestamps: true }
);

// Index for efficient aggregation queries
productViewSchema.index({ productId: 1, createdAt: -1 });
productViewSchema.index({ userId: 1 });

module.exports = mongoose.model("ProductView", productViewSchema);
