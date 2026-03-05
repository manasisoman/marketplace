const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "free_shipping"],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    minimumOrderAmount: { type: Number, default: 0 },
    maximumDiscount: { type: Number, default: null },
    applicableCategories: [{ type: String }],
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    excludedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    usageLimit: { type: Number, default: null },
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    usedBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        usedAt: { type: Date, default: Date.now },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      },
    ],
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    stackable: { type: Boolean, default: false },
    firstOrderOnly: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Virtual: check if coupon is currently valid
couponSchema.virtual("isValid").get(function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (this.usageLimit === null || this.usageCount < this.usageLimit)
  );
});

couponSchema.set("toJSON", { virtuals: true });
couponSchema.set("toObject", { virtuals: true });

couponSchema.index({ code: 1 });
couponSchema.index({ endDate: 1 });
couponSchema.index({ isActive: 1 });

module.exports = mongoose.model("Coupon", couponSchema);
