// backend/models/Favorite.js
const mongoose = require("mongoose");

const FavoriteSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, unique: true },
    name:      { type: String, required: true },
    price:     { type: Number, required: true },
    image:     { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Favorite", FavoriteSchema);
