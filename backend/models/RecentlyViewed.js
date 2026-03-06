// backend/models/RecentlyViewed.js
const mongoose = require("mongoose");

const RecentlyViewedSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, unique: true },
    name:      { type: String, required: true },
    price:     { type: Number, required: true },
    image:     { type: String },
    category:  { type: String },
    viewedAt:  { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecentlyViewed", RecentlyViewedSchema);
