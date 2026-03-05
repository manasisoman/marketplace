import { useState, useEffect } from "react";
import axios from "axios";

const API = "";

function LowStockAlert({ currentUserId }) {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const res = await axios.get(`${API}/api/inventory/low-stock`, {
          headers: { "x-user-id": currentUserId },
        });
        setLowStockItems(res.data.lowStockItems);
      } catch (err) {
        console.error("Failed to fetch low stock:", err);
      }
      setLoading(false);
    };

    if (currentUserId) fetchLowStock();
    else setLoading(false);
  }, [currentUserId]);

  if (loading || dismissed || lowStockItems.length === 0) return null;

  return (
    <div className="low-stock-alert">
      <div className="low-stock-alert-header">
        <h4>Low Stock Alert ({lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""})</h4>
        <button className="btn btn-sm" onClick={() => setDismissed(true)}>
          Dismiss
        </button>
      </div>
      <div className="low-stock-list">
        {lowStockItems.slice(0, 5).map((item) => (
          <div key={item._id} className="low-stock-item">
            <img
              src={item.productId?.image || "https://placehold.co/40x40/fef3cd/856404?text=!"}
              alt={item.productId?.name || "Product"}
              className="low-stock-thumb"
              onError={(e) => {
                e.target.src = "https://placehold.co/40x40/fef3cd/856404?text=!";
              }}
            />
            <div className="low-stock-info">
              <span className="low-stock-name">{item.productId?.name || "Unknown"}</span>
              <span className="low-stock-sku">SKU: {item.sku}</span>
              <span className="low-stock-qty">
                {item.variant?.size && `${item.variant.size} `}
                {item.variant?.color && `${item.variant.color} — `}
                {item.quantity - item.reserved} left
              </span>
            </div>
          </div>
        ))}
        {lowStockItems.length > 5 && (
          <p className="low-stock-more">...and {lowStockItems.length - 5} more items</p>
        )}
      </div>
    </div>
  );
}

export default LowStockAlert;
