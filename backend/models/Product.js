const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    category: { type: String, default: "General" },
    hasVariants: { type: Boolean, default: false },
    variantCount: { type: Number, default: 0 },
    totalStock: { type: Number, default: 0 },
    availableSizes: [{ type: String }],
    availableColors: [{ type: String }],
    weightUnit: { type: String, enum: ["oz", "lb", "g", "kg"], default: "oz" },
    brand: { type: String, default: "" },
    tags: [{ type: String }],
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Text index for full-text search on name and description
productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
