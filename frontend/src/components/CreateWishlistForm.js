import { useState } from "react";

function CreateWishlistForm({ onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [error, setError] = useState("");

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    onSubmit({ name: name.trim(), description: description.trim(), isPublic, tags });
  };

  return (
    <div className="create-wishlist-form">
      <h3>Create New Wishlist</h3>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Birthday Gift Ideas"
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this wishlist for?"
            rows={2}
            maxLength={500}
          />
        </div>

        <div className="form-group">
          <label>Tags</label>
          <div className="tag-input-row">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Add a tag and press Enter"
              maxLength={50}
            />
            <button type="button" className="btn btn-sm" onClick={handleAddTag}>
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="tag-list">
              {tags.map((tag, i) => (
                <span key={i} className="tag">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(i)}>&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Make this wishlist public (shareable via link)
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Create Wishlist
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateWishlistForm;
