import { useState, useEffect } from "react";
import axios from "axios";

const API = "";

function OrdersList({ currentUserId, onViewOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const headers = { "x-user-id": currentUserId };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.set("status", statusFilter);
      const res = await axios.get(`${API}/api/orders?${params.toString()}`, {
        headers,
      });
      setOrders(res.data.orders);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
    setLoading(false);
  };

  const statusColors = {
    pending: "#f0ad4e",
    confirmed: "#5bc0de",
    processing: "#337ab7",
    shipped: "#5cb85c",
    delivered: "#22863a",
    cancelled: "#d9534f",
    refunded: "#8b5cf6",
  };

  const statuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ];

  return (
    <div className="orders-list-page">
      <h1>My Orders</h1>

      <div className="orders-filters">
        <label htmlFor="statusFilter">Filter by status:</label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-muted">No orders found.</p>
      ) : (
        <>
          <div className="orders-grid">
            {orders.map((order) => (
              <div
                key={order._id}
                className="order-card"
                onClick={() => onViewOrder(order._id)}
              >
                <div className="order-card-header">
                  <span className="order-id">
                    #{order._id.slice(-8).toUpperCase()}
                  </span>
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: statusColors[order.status] || "#999",
                    }}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                </div>
                <div className="order-card-body">
                  <p className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p className="order-total">
                    ${order.totalAmount.toFixed(2)}
                  </p>
                  <p className="order-items-count">
                    {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {order.refundStatus !== "none" && (
                  <div className="order-card-refund">
                    Refund: {order.refundStatus}
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn page-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span className="page-info">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default OrdersList;
