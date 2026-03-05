import { useState, useEffect } from "react";
import axios from "axios";

const API = "";

function CouponManager({ currentUserId }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "active" | "expired"
  const [error, setError] = useState("");

  // Create form state
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("percentage");
  const [formValue, setFormValue] = useState("");
  const [formMinOrder, setFormMinOrder] = useState("");
  const [formMaxDiscount, setFormMaxDiscount] = useState("");
  const [formUsageLimit, setFormUsageLimit] = useState("");
  const [formPerUserLimit, setFormPerUserLimit] = useState("1");
  const [formEndDate, setFormEndDate] = useState("");
  const [formStackable, setFormStackable] = useState(false);
  const [formFirstOrderOnly, setFormFirstOrderOnly] = useState(false);
  const [formCategories, setFormCategories] = useState("");

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "active") params.set("active", "true");
      if (filter === "expired") params.set("expired", "true");
      const queryStr = params.toString();
      const res = await axios.get(`${API}/api/coupons${queryStr ? "?" + queryStr : ""}`, {
        headers: { "x-user-id": currentUserId },
      });
      setCoupons(res.data);
    } catch (err) {
      setError("Failed to load coupons");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUserId) fetchCoupons();
    else setLoading(false);
  }, [currentUserId, filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formCode.trim() || !formValue || !formEndDate) {
      setError("Code, discount value, and end date are required");
      return;
    }
    try {
      await axios.post(
        `${API}/api/coupons`,
        {
          code: formCode.trim(),
          description: formDescription,
          discountType: formType,
          discountValue: parseFloat(formValue),
          minimumOrderAmount: parseFloat(formMinOrder) || 0,
          maximumDiscount: formMaxDiscount ? parseFloat(formMaxDiscount) : null,
          usageLimit: formUsageLimit ? parseInt(formUsageLimit) : null,
          perUserLimit: parseInt(formPerUserLimit) || 1,
          endDate: formEndDate,
          stackable: formStackable,
          firstOrderOnly: formFirstOrderOnly,
          applicableCategories: formCategories ? formCategories.split(",").map((c) => c.trim()) : [],
        },
        { headers: { "x-user-id": currentUserId } }
      );
      setShowCreate(false);
      resetForm();
      fetchCoupons();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create coupon");
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      await axios.put(
        `${API}/api/coupons/${coupon._id}`,
        { isActive: !coupon.isActive },
        { headers: { "x-user-id": currentUserId } }
      );
      fetchCoupons();
    } catch (err) {
      setError("Failed to update coupon");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deactivate this coupon?")) return;
    try {
      await axios.delete(`${API}/api/coupons/${id}`, {
        headers: { "x-user-id": currentUserId },
      });
      fetchCoupons();
    } catch (err) {
      setError("Failed to delete coupon");
    }
  };

  const resetForm = () => {
    setFormCode("");
    setFormDescription("");
    setFormType("percentage");
    setFormValue("");
    setFormMinOrder("");
    setFormMaxDiscount("");
    setFormUsageLimit("");
    setFormPerUserLimit("1");
    setFormEndDate("");
    setFormStackable(false);
    setFormFirstOrderOnly(false);
    setFormCategories("");
    setError("");
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const isExpired = (coupon) => new Date(coupon.endDate) < new Date();

  if (!currentUserId) {
    return (
      <div className="coupon-manager">
        <h2>Coupon Management</h2>
        <p className="empty-state">Sign in to manage coupons.</p>
      </div>
    );
  }

  return (
    <div className="coupon-manager">
      <div className="coupon-manager-header">
        <h2>Coupon Management</h2>
        <div className="coupon-filters">
          <button className={`btn btn-sm ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
          <button className={`btn btn-sm ${filter === "active" ? "active" : ""}`} onClick={() => setFilter("active")}>Active</button>
          <button className={`btn btn-sm ${filter === "expired" ? "active" : ""}`} onClick={() => setFilter("expired")}>Expired</button>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ Create Coupon"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreate && (
        <form className="coupon-create-form" onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-group">
              <label>Coupon Code *</label>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER25"
                maxLength={20}
              />
            </div>
            <div className="form-group">
              <label>Discount Type *</label>
              <select value={formType} onChange={(e) => setFormType(e.target.value)}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div className="form-group">
              <label>Discount Value *</label>
              <input
                type="number"
                min="0"
                step={formType === "percentage" ? "1" : "0.01"}
                max={formType === "percentage" ? "100" : undefined}
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                placeholder={formType === "percentage" ? "0-100" : "0.00"}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="e.g. Summer sale - 25% off everything"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Min Order Amount ($)</label>
              <input type="number" min="0" step="0.01" value={formMinOrder} onChange={(e) => setFormMinOrder(e.target.value)} placeholder="No minimum" />
            </div>
            <div className="form-group">
              <label>Max Discount ($)</label>
              <input type="number" min="0" step="0.01" value={formMaxDiscount} onChange={(e) => setFormMaxDiscount(e.target.value)} placeholder="No cap" />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Usage Limit (total)</label>
              <input type="number" min="1" value={formUsageLimit} onChange={(e) => setFormUsageLimit(e.target.value)} placeholder="Unlimited" />
            </div>
            <div className="form-group">
              <label>Per User Limit</label>
              <input type="number" min="1" value={formPerUserLimit} onChange={(e) => setFormPerUserLimit(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Categories (comma-separated)</label>
              <input type="text" value={formCategories} onChange={(e) => setFormCategories(e.target.value)} placeholder="e.g. Electronics, Clothing" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={formStackable} onChange={(e) => setFormStackable(e.target.checked)} />
                Stackable with other coupons
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={formFirstOrderOnly} onChange={(e) => setFormFirstOrderOnly(e.target.checked)} />
                First order only
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Coupon</button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading coupons...</p>
      ) : coupons.length === 0 ? (
        <div className="empty-state">
          <p>No coupons found. Create your first coupon to start offering discounts!</p>
        </div>
      ) : (
        <div className="coupon-list">
          {coupons.map((coupon) => (
            <div key={coupon._id} className={`coupon-card ${isExpired(coupon) ? "expired" : ""} ${!coupon.isActive ? "inactive" : ""}`}>
              <div className="coupon-card-header">
                <span className="coupon-code">{coupon.code}</span>
                <div className="coupon-badges">
                  {coupon.isActive && !isExpired(coupon) && <span className="badge badge-success">Active</span>}
                  {!coupon.isActive && <span className="badge badge-danger">Inactive</span>}
                  {isExpired(coupon) && <span className="badge badge-warning">Expired</span>}
                  {coupon.stackable && <span className="badge badge-info">Stackable</span>}
                  {coupon.firstOrderOnly && <span className="badge badge-info">First Order</span>}
                </div>
              </div>

              <div className="coupon-card-body">
                <div className="coupon-discount-display">
                  {coupon.discountType === "percentage" && <span>{coupon.discountValue}% off</span>}
                  {coupon.discountType === "fixed" && <span>${coupon.discountValue.toFixed(2)} off</span>}
                  {coupon.discountType === "free_shipping" && <span>Free Shipping</span>}
                  {coupon.maximumDiscount && <span className="max-discount">(max ${coupon.maximumDiscount})</span>}
                </div>
                {coupon.description && <p className="coupon-desc">{coupon.description}</p>}
                <div className="coupon-meta">
                  {coupon.minimumOrderAmount > 0 && <span>Min: ${coupon.minimumOrderAmount.toFixed(2)}</span>}
                  <span>Expires: {formatDate(coupon.endDate)}</span>
                  <span>Used: {coupon.usageCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ""}</span>
                </div>
                {coupon.applicableCategories?.length > 0 && (
                  <div className="coupon-categories">
                    Categories: {coupon.applicableCategories.join(", ")}
                  </div>
                )}
              </div>

              <div className="coupon-card-actions">
                <button className="btn btn-sm" onClick={() => handleToggleActive(coupon)}>
                  {coupon.isActive ? "Deactivate" : "Activate"}
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(coupon._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CouponManager;
