import { useState } from "react";
import StarRating from "./StarRating";

const MAX_DESCRIPTION_LENGTH = 100;

function ProductCard({ product, onAddToCart, onDelete, onViewProduct, favorites, onFavorite, onUnfavorite }) {
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteQuantity, setQuoteQuantity] = useState(100);
  const [quoteEmail, setQuoteEmail] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);

  // Fallback image if no image URL is provided
  const imageUrl = product.image || `https://placehold.co/300x200/e8f0fe/4285f4?text=${encodeURIComponent(product.name)}`;

  // Truncate long descriptions for a cleaner card layout
  const fullDescription = product.description || "No description provided.";
  const truncatedDescription = fullDescription.length > MAX_DESCRIPTION_LENGTH
    ? fullDescription.slice(0, MAX_DESCRIPTION_LENGTH).trimEnd() + "…"
    : fullDescription;

  const favEntry = favorites.find(f => f.productId === product._id);
  const isFav = Boolean(favEntry);

  const handleQuoteSubmit = (e) => {
    e.preventDefault();
    // In a real implementation, this would POST to an API endpoint
    setQuoteSubmitted(true);
    setTimeout(() => {
      setShowQuoteForm(false);
      setQuoteSubmitted(false);
      setQuoteQuantity(100);
      setQuoteEmail("");
      setQuoteNotes("");
    }, 2000);
  };

  return (
    <div className="product-card">
      <div className="product-image-wrapper" onClick={() => onViewProduct(product._id)} style={{ cursor: "pointer" }}>
        <img
          src={imageUrl}
          alt={product.name}
          className="product-image"
          onError={(e) => {
            // If image fails to load, show a colored placeholder
            e.target.src = `https://placehold.co/300x200/e8f0fe/4285f4?text=${encodeURIComponent(product.name)}`;
          }}
        />
        {product.category && (
          <span className="product-category">{product.category}</span>
        )}
        <span className="bulk-discount-badge">Bulk Discounts</span>
      </div>

      <div className="product-info">
        <h3 className="product-name" onClick={() => onViewProduct(product._id)} style={{ cursor: "pointer" }}>{product.name}</h3>
        {product.reviewCount > 0 && (
          <div className="product-card-rating">
            <StarRating rating={product.averageRating} size="small" />
            <span className="rating-count">({product.reviewCount})</span>
          </div>
        )}
        <p className="product-description">{truncatedDescription}</p>
        <div className="product-footer">
          <span className="product-price">${Number(product.price).toFixed(2)}</span>
          <div className="product-actions">
            <button
              className="btn btn-primary"
              onClick={() => onAddToCart(product)}
            >
              Add to Cart
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowQuoteForm(!showQuoteForm)}
              title="Request a custom quote for bulk orders"
            >
              Request Quote
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (window.confirm(`Delete "${product.name}"?`)) {
                  onDelete(product._id);
                }
              }}
            >
              Delete
            </button>
            <button
              className="btn"
              onClick={() => isFav ? onUnfavorite(favEntry._id) : onFavorite(product)}
            >
              {isFav ? "\u2665 Unfavorite" : "\u2661 Favorite"}
            </button>
          </div>
        </div>

        {showQuoteForm && (
          <div className="quote-form-container">
            {quoteSubmitted ? (
              <div className="quote-success">
                Quote request submitted! We'll be in touch soon.
              </div>
            ) : (
              <form className="quote-form" onSubmit={handleQuoteSubmit}>
                <h4 className="quote-form-title">Request a Bulk Quote</h4>
                <p className="quote-form-subtitle">Get custom pricing for large orders of {product.name}</p>
                <div className="quote-form-fields">
                  <div className="form-group">
                    <label>Quantity Needed</label>
                    <input
                      type="number"
                      min="10"
                      value={quoteQuantity}
                      onChange={(e) => setQuoteQuantity(parseInt(e.target.value) || 10)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Your Email</label>
                    <input
                      type="email"
                      value={quoteEmail}
                      onChange={(e) => setQuoteEmail(e.target.value)}
                      placeholder="buyer@company.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Notes (optional)</label>
                    <textarea
                      value={quoteNotes}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                      placeholder="Delivery timeline, customization needs, etc."
                      rows="2"
                    />
                  </div>
                </div>
                <div className="quote-form-actions">
                  <button type="submit" className="btn btn-primary">Submit Quote Request</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowQuoteForm(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
