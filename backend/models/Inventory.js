const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    sku: { type: String, required: true, unique: true },
    variant: {
      size: { type: String, default: null },
      color: { type: String, default: null },
      material: { type: String, default: null },
    },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    warehouseLocation: { type: String, default: "" },
    costPrice: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    barcode: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    lastRestockedAt: { type: Date, default: null },
    restockHistory: [
      {
        quantity: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        note: { type: String, default: "" },
        supplier: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

// Virtual: available = quantity - reserved
inventorySchema.virtual("available").get(function () {
  return this.quantity - this.reserved;
});

// Virtual: is low stock?
inventorySchema.virtual("isLowStock").get(function () {
  return this.quantity - this.reserved <= this.lowStockThreshold;
});

// Ensure virtuals are included in JSON
inventorySchema.set("toJSON", { virtuals: true });
inventorySchema.set("toObject", { virtuals: true });

// Index for fast lookup
inventorySchema.index({ productId: 1 });
inventorySchema.index({ sku: 1 });
inventorySchema.index({ "variant.size": 1, "variant.color": 1 });

module.exports = mongoose.model("Inventory", inventorySchema);
