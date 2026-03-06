import { useState, useEffect, useRef } from "react";
import axios from "axios";
import CouponInput from "./CouponInput";

const API = "";

function Cart({ items, total, onRemove, onUpdateQuantity, onBack, currentUserId }) {
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const prevTotalRef = useRef(total);
  const [poNumber, setPoNumber] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  // Fetch saved PO number and order notes
  useEffect(() => {
    axios.get(`${API}/cart/notes`)
      .then((res) => {
        setPoNumber(res.data.poNumber || "");
        setOrderNotes(res.data.orderNotes || "");
      })
      .catch(() => {});
  }, []);

  // Reset applied coupon when cart total changes (items added/removed/quantity changed)
  useEffect(() => {
    if (prevTotalRef.current !== total && appliedCoupon) {
      setAppliedCoupon(null);
    }
    prevTotalRef.current = total;
  }, [total, appliedCoupon]);

  const saveNotes = () => {
    axios.put(`${API}/cart/notes`, { poNumber, orderNotes })
      .then(() => {
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      })
      .catch(() => {});
  };

  const finalTotal = appliedCoupon ? appliedCoupon.newTotal : total;
  if (items.length === 0) {
    return (
      <div className="cart-container">
        <h2>Your Cart</h2>
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <button className="btn btn-primary" onClick={onBack}>
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2>Your Cart ({items.length} {items.length === 1 ? "item" : "items"})</h2>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Continue Shopping
        </button>
      </div>

      <div className="cart-items">
        {items.map((item) => {
          const imageUrl = item.image || `https://placehold.co/80x80/e8f0fe/4285f4?text=${encodeURIComponent(item.name)}`;
          return (
            <div key={item._id} className="cart-item">
              <img
                src={imageUrl}
                alt={item.name}
                className="cart-item-image"
                onError={(e) => {
                  e.target.src = `https://placehold.co/80x80/e8f0fe/4285f4?text=${encodeURIComponent(item.name)}`;
                }}
              />
              <div className="cart-item-info">
                <h4>{item.name}</h4>
                <div className="qty-controls">
                  <button
                    className="qty-btn"
                    onClick={() => onUpdateQuantity(item._id, item.quantity - 1)}
                    title={item.quantity === 1 ? "Remove item" : "Decrease quantity"}
                  >
                    −
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
                    title="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="cart-item-price">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onRemove(item._id)}
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div className="cart-coupon-section">
        <h3>Have a coupon code?</h3>
        <CouponInput
          cartTotal={total}
          cartItems={items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category || "",
          }))}
          currentUserId={currentUserId}
          onCouponApplied={setAppliedCoupon}
        />
      </div>

      <div className="cart-po-section">
        <h3>Purchase Order Details</h3>
        <div className="form-group">
          <label>PO Number</label>
          <input
            type="text"
            className="po-input"
            placeholder="e.g. PO-2026-00412"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            onBlur={saveNotes}
          />
        </div>
        <div className="form-group">
          <label>Order Notes</label>
          <textarea
            className="order-notes-input"
            placeholder="Delivery instructions, special requirements, etc."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            onBlur={saveNotes}
            rows={3}
          />
        </div>
        {notesSaved && <span className="notes-saved-indicator">Saved ✓</span>}
      </div>

      <div className="cart-summary">
        <div className="cart-total">
          <strong>Subtotal:</strong>
          <span>${total.toFixed(2)}</span>
        </div>
        {appliedCoupon && (
          <div className="cart-discount">
            <strong>Discount ({appliedCoupon.coupon.code}):</strong>
            <span className="discount-amount">-${appliedCoupon.discount.toFixed(2)}</span>
          </div>
        )}
        {appliedCoupon && appliedCoupon.freeShipping && (
          <div className="cart-free-shipping">
            <strong>Shipping:</strong>
            <span>FREE</span>
          </div>
        )}
        <div className="cart-final-total">
          <strong>Total:</strong>
          <span>${finalTotal.toFixed(2)}</span>
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => alert("Checkout coming soon! This is where you would integrate a payment processor like Stripe.")}
        >
          Checkout — ${finalTotal.toFixed(2)}
        </button>
      </div>
    </div>
  );
}

export default Cart;
