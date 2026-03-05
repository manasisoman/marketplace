import { useState } from "react";

function RefundRequest({ order, onRequestRefund, onProcessRefund, isSeller }) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [refundAmount, setRefundAmount] = useState(order.totalAmount);
  const [submitting, setSubmitting] = useState(false);

  const canRequestRefund =
    !isSeller &&
    ["delivered", "shipped"].includes(order.status) &&
    order.refundStatus === "none";

  const canProcessRefund = isSeller && order.refundStatus === "requested";

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await onRequestRefund(order._id, reason);
      setShowForm(false);
      setReason("");
    } catch (err) {
      console.error("Refund request failed:", err);
    }
    setSubmitting(false);
  };

  const handleProcessRefund = async (action) => {
    setSubmitting(true);
    try {
      await onProcessRefund(order._id, action, refundAmount);
    } catch (err) {
      console.error("Refund processing failed:", err);
    }
    setSubmitting(false);
  };

  return (
    <div className="refund-section">
      <h3>Refund</h3>

      {order.refundStatus === "none" && canRequestRefund && !showForm && (
        <button className="btn refund-btn" onClick={() => setShowForm(true)}>
          Request Refund
        </button>
      )}

      {order.refundStatus !== "none" && (
        <div className="refund-status">
          <div className="refund-status-badge">
            <span className="refund-label">Refund Status:</span>
            <span className={`status-badge refund-${order.refundStatus}`}>
              {order.refundStatus.charAt(0).toUpperCase() +
                order.refundStatus.slice(1)}
            </span>
          </div>
          {order.refundReason && (
            <p className="refund-reason">
              <strong>Reason:</strong> {order.refundReason}
            </p>
          )}
          {order.refundAmount > 0 && (
            <p className="refund-amount">
              <strong>Amount:</strong> ${order.refundAmount.toFixed(2)}
            </p>
          )}
        </div>
      )}

      {showForm && (
        <form className="refund-form" onSubmit={handleSubmitRequest}>
          <div className="form-group">
            <label htmlFor="refundReason">Reason for refund:</label>
            <textarea
              id="refundReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe why you would like a refund..."
              rows={4}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn submit-btn" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
            <button
              type="button"
              className="btn cancel-btn"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {canProcessRefund && (
        <div className="refund-process">
          <p>
            <strong>Refund requested:</strong> {order.refundReason}
          </p>
          <div className="form-group">
            <label htmlFor="refundAmount">Refund Amount ($):</label>
            <input
              id="refundAmount"
              type="number"
              min="0"
              max={order.totalAmount}
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
            />
          </div>
          <div className="form-actions">
            <button
              className="btn approve-btn"
              onClick={() => handleProcessRefund("approve")}
              disabled={submitting}
            >
              Approve Refund
            </button>
            <button
              className="btn reject-btn"
              onClick={() => handleProcessRefund("reject")}
              disabled={submitting}
            >
              Reject Refund
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RefundRequest;
