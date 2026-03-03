function ProductCard({ product, onAddToCart, onDelete }) {
  // Fallback image if no image URL is provided
  const imageUrl = product.image || `https://placehold.co/300x200/e8f0fe/4285f4?text=${encodeURIComponent(product.name)}`;

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
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
        <h3 className="product-name">{product.name}</h3>
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
