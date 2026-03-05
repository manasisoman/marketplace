function WishlistCard({ wishlist, onDelete, onTogglePublic }) {
  const itemCount = wishlist.items?.length || 0;
  const previewItems = (wishlist.items || []).slice(0, 4);
  const totalValue = (wishlist.items || []).reduce((sum, item) => {
    return sum + (item.productId?.price || item.priceAtAdd || 0);
  }, 0);

  const copyShareLink = () => {
    if (wishlist.shareToken) {
      const url = `${window.location.origin}/wishlists/shared/${wishlist.shareToken}`;
      navigator.clipboard.writeText(url);
      alert("Share link copied to clipboard!");
    }
  };

  return (
    <div className="wishlist-card">
      <div className="wishlist-card-header">
        <h3>{wishlist.name}</h3>
        <div className="wishlist-card-badges">
          {wishlist.isPublic && <span className="badge badge-public">Public</span>}
          {wishlist.collaborators?.length > 0 && (
            <span className="badge badge-collab">
              {wishlist.collaborators.length} collaborator{wishlist.collaborators.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {wishlist.description && (
        <p className="wishlist-card-desc">{wishlist.description}</p>
      )}

      {wishlist.tags?.length > 0 && (
        <div className="wishlist-tags">
          {wishlist.tags.map((tag, i) => (
            <span key={i} className="tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="wishlist-preview">
        {previewItems.map((item, i) => (
          <div key={i} className="wishlist-preview-item">
            <img
              src={item.productId?.image || `https://placehold.co/60x60/e8f0fe/4285f4?text=Item`}
              alt={item.productId?.name || "Product"}
              onError={(e) => {
                e.target.src = "https://placehold.co/60x60/e8f0fe/4285f4?text=Item";
              }}
            />
          </div>
        ))}
        {itemCount > 4 && (
          <div className="wishlist-preview-more">+{itemCount - 4}</div>
        )}
      </div>

      <div className="wishlist-card-footer">
        <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
        <span>Total: ${totalValue.toFixed(2)}</span>
      </div>

      <div className="wishlist-card-actions">
        <button className="btn btn-sm" onClick={() => onTogglePublic(wishlist)}>
          {wishlist.isPublic ? "Make Private" : "Make Public"}
        </button>
        {wishlist.isPublic && wishlist.shareToken && (
          <button className="btn btn-sm" onClick={copyShareLink}>
            Copy Link
          </button>
        )}
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(wishlist._id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default WishlistCard;
