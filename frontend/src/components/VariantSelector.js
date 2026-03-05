import { useState, useEffect } from "react";
import axios from "axios";

const API = "";

function VariantSelector({ productId, onVariantSelect }) {
  const [inventory, setInventory] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await axios.get(`${API}/api/inventory/product/${productId}`);
        setInventory(res.data);
        // Auto-select first available size/color
        if (res.data.availableSizes?.length > 0) {
          setSelectedSize(res.data.availableSizes[0]);
        }
        if (res.data.availableColors?.length > 0) {
          setSelectedColor(res.data.availableColors[0]);
        }
      } catch (err) {
        console.error("Failed to fetch inventory:", err);
      }
      setLoading(false);
    };
    fetchInventory();
  }, [productId]);

  useEffect(() => {
    if (!inventory) return;
    // Find the variant matching selected size + color
    const match = inventory.variants.find((v) => {
      const sizeMatch = !selectedSize || v.variant.size === selectedSize;
      const colorMatch = !selectedColor || v.variant.color === selectedColor;
      return sizeMatch && colorMatch;
    });
    if (onVariantSelect) {
      onVariantSelect(match || null);
    }
  }, [selectedSize, selectedColor, inventory, onVariantSelect]);

  if (loading) return <div className="variant-loading">Loading options...</div>;
  if (!inventory || inventory.variants.length === 0) return null;

  const getStockForVariant = (size, color) => {
    const match = inventory.variants.find((v) => {
      const sizeMatch = !size || v.variant.size === size;
      const colorMatch = !color || v.variant.color === color;
      return sizeMatch && colorMatch;
    });
    return match ? match.available : 0;
  };

  return (
    <div className="variant-selector">
      {inventory.availableSizes.length > 0 && (
        <div className="variant-group">
          <label className="variant-label">Size</label>
          <div className="variant-options">
            {inventory.availableSizes.map((size) => {
              const stock = getStockForVariant(size, selectedColor);
              return (
                <button
                  key={size}
                  className={`variant-option ${selectedSize === size ? "selected" : ""} ${stock === 0 ? "out-of-stock" : ""}`}
                  onClick={() => setSelectedSize(size)}
                  disabled={stock === 0}
                >
                  {size}
                  {stock <= 3 && stock > 0 && <span className="stock-warning">Only {stock} left</span>}
                  {stock === 0 && <span className="stock-warning">Sold out</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {inventory.availableColors.length > 0 && (
        <div className="variant-group">
          <label className="variant-label">Color</label>
          <div className="variant-options color-options">
            {inventory.availableColors.map((color) => {
              const stock = getStockForVariant(selectedSize, color);
              return (
                <button
                  key={color}
                  className={`variant-option color-swatch ${selectedColor === color ? "selected" : ""} ${stock === 0 ? "out-of-stock" : ""}`}
                  onClick={() => setSelectedColor(color)}
                  disabled={stock === 0}
                  title={color}
                >
                  <span className="color-dot" style={{ backgroundColor: color.toLowerCase() }} />
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="variant-stock-info">
        <StockBadge totalStock={inventory.totalStock} lowStockCount={inventory.lowStockCount} />
      </div>
    </div>
  );
}

function StockBadge({ totalStock, lowStockCount }) {
  if (totalStock === 0) {
    return <span className="stock-badge out-of-stock-badge">Out of Stock</span>;
  }
  if (lowStockCount > 0) {
    return <span className="stock-badge low-stock-badge">Low Stock — {lowStockCount} variant{lowStockCount !== 1 ? "s" : ""} running low</span>;
  }
  return <span className="stock-badge in-stock-badge">In Stock ({totalStock} available)</span>;
}

export { StockBadge };
export default VariantSelector;
