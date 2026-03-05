const mongoose = require("mongoose");

const wishlistItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  note: { type: String, default: "", maxlength: 500 },
  priceAtAdd: { type: Number },
  alertOnPriceDrop: { type: Boolean, default: false },
  targetPrice: { type: Number, default: null },
  addedAt: { type: Date, default: Date.now },
});

const wishlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, default: "My Wishlist", maxlength: 100 },
    description: { type: String, default: "", maxlength: 500 },
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String, unique: true, sparse: true },
    items: [wishlistItemSchema],
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: String, maxlength: 50 }],
  },
  { timestamps: true }
);

// Index for fast lookup by user
wishlistSchema.index({ userId: 1 });
// Index for share token lookup
wishlistSchema.index({ shareToken: 1 });

module.exports = mongoose.model("Wishlist", wishlistSchema);
