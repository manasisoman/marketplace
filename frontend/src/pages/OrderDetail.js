import { useState, useEffect } from "react";
import axios from "axios";
import OrderTimeline from "../components/OrderTimeline";
import TrackingInfo from "../components/TrackingInfo";
import RefundRequest from "../components/RefundRequest";

const API = "";

function OrderDetail({ orderId, currentUserId, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");

  const headers = { "x-user-id": currentUserId };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/orders/${orderId}`, { headers });
      setOrder(res.data);
    } catch (err) {
      console.error("Error fetching order:", err);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      const body = { status: updateStatus, note: updateNote };
      if (updateStatus === "shipped") {
        body.trackingNumber = trackingNumber;
        body.carrier = carrier;
      }
      await axios.put(`${API}/api/orders/${orderId}/status`, body, { headers });
      setUpdateStatus("");
      setUpdateNote("");
      setTrackingNumber("");
      setCarrier("");
      fetchOrder();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleRequestRefund = async (id, reason) => {
    await axios.post(`${API}/api/orders/${id}/refund`, { reason }, { headers });
    fetchOrder();
  };

  const handleProcessRefund = async (id, action, amount) => {
    await axios.put(`${API}/api/orders/${id}/refund`, { action, amount }, { headers });
    fetchOrder();
  };

  if (loading) return <p>Loading order...</p>;
  if (!order) return <p>Order not found</p>;

  const isSeller =
    order.sellerId && order.sellerId.toString() === currentUserId;

  // Determine allowed next statuses for seller controls
  const statusTransitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
  };
  const allowedStatuses = statusTransitions[order.status] || [];

  return (
    <div className="order-detail">
      <button className="btn back-btn" onClick={onBack}>
        &larr; Back to Orders
      </button>

      <div className="order-header">
        <h1>Order #{order._id.slice(-8).toUpperCase()}</h1>
        <span className={`status-badge status-${order.status}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="order-summary">
        <div className="order-info">
          <p>
            <strong>Date:</strong>{" "}
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
          <p>
            <strong>Total:</strong> ${order.totalAmount.toFixed(2)}
          </p>
          <p>
            <strong>Items:</strong> {order.items.length}
          </p>
        </div>

        <div className="order-items">
          <h3>Items</h3>
          {order.items.map((item, index) => (
            <div key={index} className="order-item">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="order-item-image"
                />
              )}
              <div className="order-item-details">
                <span className="item-name">{item.name}</span>
                <span className="item-qty">x{item.quantity}</span>
                <span className="item-price">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <OrderTimeline
        statusHistory={order.statusHistory}
        currentStatus={order.status}
      />

      <TrackingInfo
        trackingNumber={order.trackingNumber}
        carrier={order.carrier}
        currentStatus={order.status}
      />

      {/* Seller controls: update status */}
      {isSeller && allowedStatuses.length > 0 && (
        <div className="seller-controls">
          <h3>Update Order Status</h3>
          <form onSubmit={handleStatusUpdate}>
            <div className="form-group">
              <label htmlFor="statusSelect">New Status:</label>
              <select
                id="statusSelect"
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
                required
              >
                <option value="">Select status...</option>
                {allowedStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {updateStatus === "shipped" && (
              <>
                <div className="form-group">
                  <label htmlFor="trackingInput">Tracking Number:</label>
                  <input
                    id="trackingInput"
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="carrierSelect">Carrier:</label>
                  <select
                    id="carrierSelect"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    required
                  >
                    <option value="">Select carrier...</option>
                    <option value="UPS">UPS</option>
                    <option value="FedEx">FedEx</option>
                    <option value="USPS">USPS</option>
                    <option value="DHL">DHL</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="noteInput">Note (optional):</label>
              <input
                id="noteInput"
                type="text"
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                placeholder="Add a note about this update..."
              />
            </div>

            <button type="submit" className="btn submit-btn">
              Update Status
            </button>
          </form>
        </div>
      )}

      <RefundRequest
        order={order}
        onRequestRefund={handleRequestRefund}
        onProcessRefund={handleProcessRefund}
        isSeller={isSeller}
      />
    </div>
  );
}

export default OrderDetail;
