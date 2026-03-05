import { useState, useCallback } from "react";
import VariantSelector from "./VariantSelector";
import InventoryManager from "./InventoryManager";
import StarRating from "./StarRating";
import ReviewList from "./ReviewList";
import ReviewForm from "./ReviewForm";

const CATEGORIES = ["General", "Electronics", "Clothing", "Books", "Home & Garden", "Sports", "Toys", "Food"];

function ProductDetail({ product, onAddToCart, onDelete, onEdit, onBack }) {
  const [editing, setEditing] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price);
  const [description, setDescription] = useState(product.description || "");
  const [image, setImage] = useState(product.image || "");
  const [category, setCategory] = useState(product.category || "General");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);

  const handleReviewSubmitted = useCallback(() => {
    setReviewRefreshKey((k) => k + 1);
  }, []);

  const imageUrl = product.image || `https://placehold.co/600x400/e8f0fe/4285f4?text=${encodeURIComponent(product.name)}`;

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Product name is required.");
    if (!price || isNaN(price) || Number(price) <= 0) return setError("Enter a valid price.");

    setLoading(true);
    try {
      await onEdit(product._id, {
        name: name.trim(),
        price: Number(price),
        description: description.trim(),
        image: image.trim(),
        category,
      });
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(product.name);
    setPrice(product.price);
    setDescription(product.description || "");
    setImage(product.image || "");
    setCategory(product.category || "General");
    setError("");
    setEditing(false);
  };

  return (
    <div className="product-detail">
      <div className="product-detail-back">
        <button className="btn btn-secondary" onClick={onBack}>
          &larr; Back to Products
        </button>
      </div>

      <div className="product-detail-card">
        <img
          src={imageUrl}
          alt={product.name}
          className="product-detail-image"
          onError={(e) => {
            e.target.src = `https://placehold.co/600x400/e8f0fe/4285f4?text=${encodeURIComponent(product.name)}`;
          }}
        />

        <div className="product-detail-body">
          {product.category && (
            <span className="product-detail-category">{product.category}</span>
          )}

          <h1>{product.name}</h1>

          {product.reviewCount > 0 && (
            <div className="product-rating-summary">
              <StarRating rating={product.averageRating} size="medium" />
              <span className="rating-text">
                {product.averageRating.toFixed(1)} ({product.reviewCount} review{product.reviewCount !== 1 ? "s" : ""})
              </span>
            </div>
          )}

          <div className="product-detail-price">
            ${Number(product.price).toFixed(2)}
          </div>

          {product.brand && (
            <div className="product-detail-brand">Brand: {product.brand}</div>
          )}

          {product.tags?.length > 0 && (
            <div className="product-detail-tags">
              {product.tags.map((tag, i) => (
                <span key={i} className="tag">{tag}</span>
              ))}
            </div>
          )}

          <p className="product-detail-description">
            {product.description || "No description provided."}
          </p>

          {/* Variant selector for products with inventory */}
          <VariantSelector productId={product._id} onVariantSelect={setSelectedVariant} />

          {selectedVariant && (
            <div className="selected-variant-info">
              <span>SKU: {selectedVariant.sku}</span>
              {selectedVariant.variant?.size && <span>Size: {selectedVariant.variant.size}</span>}
              {selectedVariant.variant?.color && <span>Color: {selectedVariant.variant.color}</span>}
              <span>Available: {selectedVariant.available}</span>
            </div>
          )}

          {product.totalStock !== undefined && product.totalStock === 0 && (
            <div className="out-of-stock-banner">Out of Stock</div>
          )}

          {product.createdAt && (
            <div className="product-detail-meta">
              Listed on {new Date(product.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}

          <div className="product-detail-actions">
            <button className="btn btn-primary" onClick={() => onAddToCart(product)}>
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
            <button className="btn btn-secondary" onClick={() => { if (editing) { handleCancel(); } else { setEditing(true); } }}>
              {editing ? "Cancel Edit" : "Edit"}
            </button>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => setShowInventory(!showInventory)}
          >
            {showInventory ? "Hide Inventory" : "Manage Inventory"}
          </button>

          {editing && (
            <div className="product-detail-edit">
              <h3>Edit Product</h3>

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleSave} className="product-form">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vintage Leather Jacket"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price (USD) *</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your item..."
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label>Image URL (optional)</label>
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {showInventory && (
        <InventoryManager productId={product._id} currentUserId={null} />
      )}

      {/* Reviews section */}
      <div className="product-reviews-section">
        <ReviewForm
          productId={product._id}
          currentUserId={null}
          onReviewSubmitted={handleReviewSubmitted}
        />
        <ReviewList key={reviewRefreshKey} productId={product._id} currentUserId={null} />
      </div>
    </div>
  );
}

export default ProductDetail;
