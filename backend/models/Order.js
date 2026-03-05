const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    trackingNumber: { type: String, default: "" },
    carrier: {
      type: String,
      enum: ["", "UPS", "FedEx", "USPS", "DHL", "Other"],
      default: "",
    },
    statusHistory: [statusHistorySchema],
    refundStatus: {
      type: String,
      enum: ["none", "requested", "approved", "rejected", "completed"],
      default: "none",
    },
    refundReason: { type: String, default: "" },
    refundAmount: { type: Number, default: 0 },
    shippingAddress: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      country: { type: String, default: "US" },
    },
  },
  { timestamps: true }
);

// Push initial status to statusHistory on creation
orderSchema.pre("save", function (next) {
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: "Order created",
    });
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
