function RecentlyViewed({ items, onViewProduct, onClear }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="recently-viewed-section">
      <div className="recently-viewed-header">
        <h2>Recently Viewed</h2>
        <button className="btn btn-secondary btn-sm" onClick={onClear}>
          Clear History
        </button>
      </div>
      <div className="recently-viewed-grid">
        {items.map((item) => {
          const imageUrl =
            item.image ||
            `https://placehold.co/300x200/e8f0fe/4285f4?text=${encodeURIComponent(item.name)}`;
          return (
            <div
              key={item._id}
              className="recently-viewed-card"
              onClick={() => onViewProduct(item.productId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") onViewProduct(item.productId);
              }}
            >
              <img
                src={imageUrl}
                alt={item.name}
                className="recently-viewed-image"
                onError={(e) => {
                  e.target.src = `https://placehold.co/300x200/e8f0fe/4285f4?text=${encodeURIComponent(item.name)}`;
                }}
              />
              {item.category && (
                <span className="recently-viewed-category">{item.category}</span>
              )}
              <div className="recently-viewed-info">
                <span className="recently-viewed-name">{item.name}</span>
                <span className="recently-viewed-price">
                  ${Number(item.price).toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RecentlyViewed;
