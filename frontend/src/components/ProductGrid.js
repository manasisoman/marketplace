import ProductCard from "./ProductCard";

function ProductGrid({ products, loading, searchQuery, onAddToCart, onDelete, onViewProduct, favorites, onFavorite, onUnfavorite }) {
  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  // Derive category count from current product list
  const categoryCount = new Set(products.map((p) => p.category).filter(Boolean)).size;

  return (
    <div className="product-section">
      {/* Stats banner — only shown on the main (non-search) view */}
      {!searchQuery && products.length > 0 && (
        <div className="marketplace-stats">
          <div className="stat-item">
            <span className="stat-number">{products.length}</span>
            <span className="stat-label">Active Listings</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">{categoryCount}</span>
            <span className="stat-label">Categories</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">B2B</span>
            <span className="stat-label">Verified Vendors</span>
          </div>
        </div>
      )}

      <div className="section-header">
        <h2>
          {searchQuery
            ? `Results for "${searchQuery}" (${products.length})`
            : `All Products (${products.length})`}
        </h2>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>{searchQuery ? "No products match your search." : "No products yet. Be the first to sell something!"}</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onAddToCart={onAddToCart}
              onDelete={onDelete}
              onViewProduct={onViewProduct}
              favorites={favorites}
              onFavorite={onFavorite}
              onUnfavorite={onUnfavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductGrid;
