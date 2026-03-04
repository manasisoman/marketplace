import { useState } from "react";

const CATEGORIES = ["General", "Electronics", "Clothing", "Books", "Home and Garden", "Sports", "Toys", "Food"];

function AddProductForm({ onSubmit, onCancel }) {
  // Each field in the form has its own piece of state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("General");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the page from reloading (default form behavior)
    setError("");

    if (!name.trim()) return setError("Product name is required.");
    if (!price || isNaN(price) || Number(price) <= 0) return setError("Enter a valid price.");

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        price: Number(price),
        description: description.trim(),
        image: image.trim(),
        category,
      });
    } catch (err) {
      // Show a helpful error message — most likely the backend isn't running
      if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
        setError("Cannot reach the server. Make sure the backend is running on port 5000.");
      } else {
        setError(err.response?.data?.error || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>List a Product for Sale</h2>
      <p className="form-subtitle">Fill in the details below to add your item to the marketplace.</p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="product-form">
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
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Listing..." : "List Item"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProductForm;
