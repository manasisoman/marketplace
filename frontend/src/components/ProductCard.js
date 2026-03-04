function ProductCard({ product, onAddToCart, onDelete, onViewProduct, favorites, onFavorite, onUnfavorite }) {
  // Fallback image if no image URL is provided
  const imageUrl = product.image || `https://placehold.co/300x200/e8f0fe/4285f4?text=${encodeURIComponent(product.name)}`;

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
        <p className="product-description">{product.description || "No description provided."}</p>
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
