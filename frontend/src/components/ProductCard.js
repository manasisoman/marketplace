import StarRating from "./StarRating";

const MAX_DESCRIPTION_LENGTH = 100;

function ProductCard({ product, onAddToCart, onDelete, onViewProduct, favorites, onFavorite, onUnfavorite }) {
  // Fallback image if no image URL is provided
  const imageUrl = product.image || `https://placehold.co/300x200/e8f0fe/4285f4?text=${encodeURIComponent(product.name)}`;

  // Truncate long descriptions for a cleaner card layout
  const fullDescription = product.description || "No description provided.";
  const truncatedDescription = fullDescription.length > MAX_DESCRIPTION_LENGTH
    ? fullDescription.slice(0, MAX_DESCRIPTION_LENGTH).trimEnd() + "…"
    : fullDescription;

  const favEntry = favorites.find(f => f.productId === product._id);
  const isFav = Boolean(favEntry);

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
      </div>
    </div>
  );
}

export default ProductCard;
