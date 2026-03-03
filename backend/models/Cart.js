const mongoose = require("mongoose");

// A Cart item links to a product and has a quantity
const cartSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  quantity: { type: Number, required: true, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);
