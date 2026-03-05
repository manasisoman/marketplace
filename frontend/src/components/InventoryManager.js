import { useState, useEffect } from "react";
import axios from "axios";

const API = "";

function InventoryManager({ productId, currentUserId }) {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [restockingId, setRestockingId] = useState(null);
  const [restockQty, setRestockQty] = useState("");
  const [restockNote, setRestockNote] = useState("");
  const [restockSupplier, setRestockSupplier] = useState("");
  const [error, setError] = useState("");

  // New variant form state
  const [newSku, setNewSku] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newMaterial, setNewMaterial] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [newThreshold, setNewThreshold] = useState("5");
  const [newWarehouse, setNewWarehouse] = useState("");

  const fetchInventory = async () => {
    try {
      const res = await axios.get(`${API}/api/inventory/product/${productId}`);
      setInventory(res.data);
    } catch (err) {
      setError("Failed to load inventory");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, [productId]);

  const handleAddVariant = async (e) => {
    e.preventDefault();
    if (!newSku.trim()) {
      setError("SKU is required");
      return;
    }
    try {
      await axios.post(
        `${API}/api/inventory`,
        {
          productId,
          sku: newSku.trim(),
          variant: {
            size: newSize || null,
            color: newColor || null,
            material: newMaterial || null,
          },
          quantity: parseInt(newQuantity) || 0,
          costPrice: parseFloat(newCostPrice) || 0,
          lowStockThreshold: parseInt(newThreshold) || 5,
          warehouseLocation: newWarehouse,
        },
        { headers: { "x-user-id": currentUserId } }
      );
      setShowAddForm(false);
      resetForm();
      fetchInventory();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add variant");
    }
  };

  const handleRestock = async (entryId) => {
    const qty = parseInt(restockQty);
    if (!qty || qty <= 0) {
      setError("Enter a positive quantity");
      return;
    }
    try {
      await axios.post(
        `${API}/api/inventory/${entryId}/restock`,
        { quantity: qty, note: restockNote, supplier: restockSupplier },
        { headers: { "x-user-id": currentUserId } }
      );
      setRestockingId(null);
      setRestockQty("");
      setRestockNote("");
      setRestockSupplier("");
      fetchInventory();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to restock");
    }
  };

  const handleDeactivate = async (entryId) => {
    if (!window.confirm("Deactivate this variant?")) return;
    try {
      await axios.delete(`${API}/api/inventory/${entryId}`, {
        headers: { "x-user-id": currentUserId },
      });
      fetchInventory();
    } catch (err) {
      setError("Failed to deactivate variant");
    }
  };

  const resetForm = () => {
    setNewSku("");
    setNewSize("");
    setNewColor("");
    setNewMaterial("");
    setNewQuantity("");
    setNewCostPrice("");
    setNewThreshold("5");
    setNewWarehouse("");
    setError("");
  };

  if (loading) return <p>Loading inventory...</p>;

  return (
    <div className="inventory-manager">
      <div className="inventory-header">
        <h3>Inventory Management</h3>
        <div className="inventory-summary">
          <span>Total Stock: {inventory?.totalStock || 0}</span>
          <span>Variants: {inventory?.variants?.length || 0}</span>
          {inventory?.lowStockCount > 0 && (
            <span className="low-stock-warning">{inventory.lowStockCount} low stock</span>
          )}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "+ Add Variant"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showAddForm && (
        <form className="add-variant-form" onSubmit={handleAddVariant}>
          <div className="form-row">
            <div className="form-group">
              <label>SKU *</label>
              <input type="text" value={newSku} onChange={(e) => setNewSku(e.target.value)} placeholder="e.g. PROD-001-BLK-M" />
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input type="number" min="0" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Size</label>
              <input type="text" value={newSize} onChange={(e) => setNewSize(e.target.value)} placeholder="e.g. M, L, XL" />
            </div>
            <div className="form-group">
              <label>Color</label>
              <input type="text" value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="e.g. Black, Blue" />
            </div>
            <div className="form-group">
              <label>Material</label>
              <input type="text" value={newMaterial} onChange={(e) => setNewMaterial(e.target.value)} placeholder="e.g. Cotton, Leather" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Cost Price</label>
              <input type="number" min="0" step="0.01" value={newCostPrice} onChange={(e) => setNewCostPrice(e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label>Low Stock Threshold</label>
              <input type="number" min="0" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Warehouse</label>
              <input type="text" value={newWarehouse} onChange={(e) => setNewWarehouse(e.target.value)} placeholder="e.g. WH-A" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Add Variant</button>
        </form>
      )}

      <table className="inventory-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Size</th>
            <th>Color</th>
            <th>Material</th>
            <th>Stock</th>
            <th>Reserved</th>
            <th>Available</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(inventory?.variants || []).map((entry) => (
            <tr key={entry._id} className={entry.isLowStock ? "low-stock-row" : ""}>
              <td>{entry.sku}</td>
              <td>{entry.variant.size || "—"}</td>
              <td>{entry.variant.color || "—"}</td>
              <td>{entry.variant.material || "—"}</td>
              <td>{entry.quantity}</td>
              <td>{entry.reserved}</td>
              <td>{entry.available}</td>
              <td>
                {entry.available === 0 ? (
                  <span className="badge badge-danger">Out of Stock</span>
                ) : entry.isLowStock ? (
                  <span className="badge badge-warning">Low Stock</span>
                ) : (
                  <span className="badge badge-success">In Stock</span>
                )}
              </td>
              <td>
                {restockingId === entry._id ? (
                  <div className="restock-form">
                    <input
                      type="number"
                      min="1"
                      value={restockQty}
                      onChange={(e) => setRestockQty(e.target.value)}
                      placeholder="Qty"
                      className="restock-input"
                    />
                    <input
                      type="text"
                      value={restockSupplier}
                      onChange={(e) => setRestockSupplier(e.target.value)}
                      placeholder="Supplier"
                      className="restock-input"
                    />
                    <input
                      type="text"
                      value={restockNote}
                      onChange={(e) => setRestockNote(e.target.value)}
                      placeholder="Note"
                      className="restock-input"
                    />
                    <button className="btn btn-sm btn-primary" onClick={() => handleRestock(entry._id)}>
                      Confirm
                    </button>
                    <button className="btn btn-sm" onClick={() => setRestockingId(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="inventory-actions">
                    <button className="btn btn-sm" onClick={() => setRestockingId(entry._id)}>
                      Restock
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeactivate(entry._id)}>
                      Remove
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {(inventory?.variants || []).length === 0 && (
        <p className="empty-state">No inventory entries yet. Add a variant to start tracking stock.</p>
      )}
    </div>
  );
}

export default InventoryManager;
