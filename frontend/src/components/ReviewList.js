import { useState, useEffect } from "react";
import axios from "axios";
import StarRating from "./StarRating";
import HelpfulButton from "./HelpfulButton";

const API = "";

function ReviewList({ productId, currentUserId }) {
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId, page, sort]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API}/api/products/${productId}/reviews?page=${page}&limit=10&sort=${sort}`
      );
      setReviews(res.data.reviews);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
    setLoading(false);
  };

  return (
    <div className="review-list">
      <div className="review-list-header">
        <h3>Reviews ({total})</h3>
        <div className="review-sort">
          <label htmlFor="reviewSort">Sort by: </label>
          <select
            id="reviewSort"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-muted">No reviews yet. Be the first to review!</p>
      ) : (
        <>
          {reviews.map((review) => (
            <div key={review._id} className="review-item">
              <div className="review-header">
                <StarRating rating={review.rating} size="small" />
                <h4 className="review-title">{review.title}</h4>
              </div>
              <p className="review-body">{review.body}</p>
              <div className="review-meta">
                <span className="review-author">
                  By {review.userId?.name || "Anonymous"}
                </span>
                <span className="review-date">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
                <HelpfulButton
                  reviewId={review._id}
                  initialCount={review.helpful}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn page-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span className="page-info">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ReviewList;
