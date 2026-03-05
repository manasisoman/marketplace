const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const Review = require("../models/Review");
const Product = require("../models/Product");

/**
 * Helper: recalculate and update a product's averageRating and reviewCount
 */
async function recalculateProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: parseFloat(stats[0].averageRating.toFixed(2)),
      reviewCount: stats[0].reviewCount,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      reviewCount: 0,
    });
  }
}

// POST /api/products/:id/reviews — submit a review (requires auth)
router.post("/products/:id/reviews", auth, async (req, res) => {
  try {
    const { rating, title, body } = req.body;

    if (!rating || !title || !body) {
      return res.status(400).json({ error: "Rating, title, and body are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Check product exists
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check for existing review by this user
    const existingReview = await Review.findOne({
      productId: req.params.id,
      userId: req.user._id,
    });
    if (existingReview) {
      return res.status(409).json({ error: "You have already reviewed this product" });
    }

    const review = new Review({
      productId: req.params.id,
      userId: req.user._id,
      rating,
      title,
      body,
    });
    await review.save();

    // Recalculate product rating
    await recalculateProductRating(req.params.id);

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "You have already reviewed this product" });
    }
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// GET /api/products/:id/reviews — get reviews for a product (public)
router.get("/products/:id/reviews", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Sort: "helpful" or "recent" (default)
    const sortField = req.query.sort === "helpful" ? { helpful: -1 } : { createdAt: -1 };

    const filter = { productId: req.params.id };
    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .sort(sortField)
      .skip(skip)
      .limit(limit)
      .populate("userId", "name avatar");

    res.json({
      reviews,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// PUT /api/reviews/:id/helpful — toggle helpful vote (requires auth)
// Uses atomic MongoDB operations to prevent race conditions under concurrent votes
router.put("/reviews/:id/helpful", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if user already voted (atomic check)
    const existingVote = await Review.findOne({
      _id: req.params.id,
      helpfulVoters: userId,
    });

    if (existingVote) {
      // Atomically remove vote
      const updated = await Review.findByIdAndUpdate(
        req.params.id,
        {
          $pull: { helpfulVoters: userId },
          $inc: { helpful: -1 },
        },
        { new: true }
      );
      if (!updated) {
        return res.status(404).json({ error: "Review not found" });
      }
      // Ensure helpful count doesn't go below 0
      if (updated.helpful < 0) {
        await Review.findByIdAndUpdate(req.params.id, { helpful: 0 });
        return res.json({ helpful: 0, voted: false });
      }
      res.json({ helpful: updated.helpful, voted: false });
    } else {
      // Atomically add vote
      const updated = await Review.findByIdAndUpdate(
        req.params.id,
        {
          $addToSet: { helpfulVoters: userId },
          $inc: { helpful: 1 },
        },
        { new: true }
      );
      if (!updated) {
        return res.status(404).json({ error: "Review not found" });
      }
      res.json({ helpful: updated.helpful, voted: true });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle helpful vote" });
  }
});

// DELETE /api/reviews/:id — delete a review (requires auth, must be author)
router.delete("/reviews/:id", auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Only the review author can delete
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this review" });
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(req.params.id);

    // Recalculate product rating after deletion
    await recalculateProductRating(productId);

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete review" });
  }
});

module.exports = router;
