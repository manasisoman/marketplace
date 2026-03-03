import ProductCard from "./ProductCard";

function ProductGrid({ products, loading, searchQuery, onAddToCart, onDelete }) {
  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="product-section">
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductGrid;
