import { useState } from "react";
import axios from "axios";

const API = "";

function CouponInput({ cartTotal, cartItems, currentUserId, onCouponApplied }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const handleValidate = async () => {
    if (!code.trim()) {
      setError("Enter a coupon code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${API}/api/coupons/validate`,
        { code: code.trim(), cartTotal, cartItems },
        { headers: { "x-user-id": currentUserId } }
      );
      setAppliedCoupon(res.data);
      if (onCouponApplied) {
        onCouponApplied(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Invalid coupon code");
      setAppliedCoupon(null);
      if (onCouponApplied) {
        onCouponApplied(null);
      }
    }
    setLoading(false);
  };

  const handleRemove = () => {
    setCode("");
    setAppliedCoupon(null);
    setError("");
    if (onCouponApplied) {
      onCouponApplied(null);
    }
  };

  return (
    <div className="coupon-input">
      {appliedCoupon ? (
        <div className="coupon-applied">
          <div className="coupon-applied-info">
            <span className="coupon-code-badge">{appliedCoupon.coupon.code}</span>
            <span className="coupon-description">{appliedCoupon.coupon.description}</span>
            <span className="coupon-discount">-${appliedCoupon.discount.toFixed(2)}</span>
            {appliedCoupon.freeShipping && (
              <span className="coupon-free-shipping">+ Free Shipping</span>
            )}
          </div>
          <button className="btn btn-sm btn-danger" onClick={handleRemove}>
            Remove
          </button>
        </div>
      ) : (
        <div className="coupon-form">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleValidate();
            }}
            placeholder="Enter coupon code"
            className="coupon-code-input"
            disabled={loading}
          />
          <button
            className="btn btn-secondary"
            onClick={handleValidate}
            disabled={loading || !code.trim()}
          >
            {loading ? "Checking..." : "Apply"}
          </button>
        </div>
      )}
      {error && <div className="coupon-error">{error}</div>}

      {appliedCoupon && (
        <div className="coupon-summary">
          <div className="coupon-summary-row">
            <span>Subtotal:</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="coupon-summary-row discount">
            <span>Discount ({appliedCoupon.coupon.code}):</span>
            <span>-${appliedCoupon.discount.toFixed(2)}</span>
          </div>
          <div className="coupon-summary-row total">
            <span>New Total:</span>
            <span>${appliedCoupon.newTotal.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CouponInput;
