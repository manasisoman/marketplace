import { useState } from "react";
import axios from "axios";
import StarRating from "./StarRating";

const API = "";

function ReviewForm({ productId, currentUserId, onReviewSubmitted }) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API}/api/products/${productId}/reviews`,
        { rating, title, body },
        { headers: { "x-user-id": currentUserId } }
      );
      setShowForm(false);
      setRating(0);
      setTitle("");
      setBody("");
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      const message =
        err.response?.data?.error || "Failed to submit review";
      setError(message);
    }
    setSubmitting(false);
  };

  if (!currentUserId) {
    return null; // Don't show form if not logged in
  }

  return (
    <div className="review-form-section">
      {!showForm ? (
        <button
          className="btn write-review-btn"
          onClick={() => setShowForm(true)}
        >
          Write a Review
        </button>
      ) : (
        <form className="review-form" onSubmit={handleSubmit}>
          <h3>Write a Review</h3>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Rating:</label>
            <StarRating
              rating={rating}
              interactive={true}
              onRate={setRating}
              size="large"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reviewTitle">Title:</label>
            <input
              id="reviewTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your review"
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reviewBody">Review:</label>
            <textarea
              id="reviewBody"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your experience with this product..."
              maxLength={2000}
              rows={5}
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn submit-btn"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button
              type="button"
              className="btn cancel-btn"
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ReviewForm;
