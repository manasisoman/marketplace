const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    category: { type: String, default: "General" },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Text index for full-text search on name and description
productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
