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
router.put("/reviews/:id/helpful", auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    const userIdStr = req.user._id.toString();
    const alreadyVoted = review.helpfulVoters.some(
      (voter) => voter.toString() === userIdStr
    );

    if (alreadyVoted) {
      // Remove vote
      review.helpfulVoters = review.helpfulVoters.filter(
        (voter) => voter.toString() !== userIdStr
      );
      review.helpful = Math.max(0, review.helpful - 1);
    } else {
      // Add vote
      review.helpfulVoters.push(req.user._id);
      review.helpful += 1;
    }

    await review.save();
    res.json({ helpful: review.helpful, voted: !alreadyVoted });
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
