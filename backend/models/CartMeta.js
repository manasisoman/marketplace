const mongoose = require("mongoose");

const CartMetaSchema = new mongoose.Schema(
  {
    poNumber: { type: String, default: "" },
    orderNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CartMeta", CartMetaSchema);
