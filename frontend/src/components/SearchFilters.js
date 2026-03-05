import { useState, useEffect } from "react";
import axios from "axios";

const API = "";

function SearchFilters({ onFilterChange }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API}/categories`);
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Notify parent whenever any filter changes
  useEffect(() => {
    onFilterChange({
      category: selectedCategory,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sortBy,
      order,
    });
  }, [selectedCategory, minPrice, maxPrice, sortBy, order]);

  const handleSortChange = (e) => {
    const value = e.target.value;
    switch (value) {
      case "price_asc":
        setSortBy("price");
        setOrder("asc");
        break;
      case "price_desc":
        setSortBy("price");
        setOrder("desc");
        break;
      case "newest":
        setSortBy("createdAt");
        setOrder("desc");
        break;
      case "name_asc":
        setSortBy("name");
        setOrder("asc");
        break;
      default:
        setSortBy("createdAt");
        setOrder("desc");
    }
  };

  const handleReset = () => {
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("createdAt");
    setOrder("desc");
  };

  return (
    <div className="search-filters">
      <div className="filter-group">
        <label className="filter-label">Category</label>
        <select
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Price Range</label>
        <div className="price-range-inputs">
          <input
            type="number"
            className="filter-input"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            min="0"
          />
          <span className="price-separator">-</span>
          <input
            type="number"
            className="filter-input"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            min="0"
          />
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">Sort By</label>
        <select
          className="filter-select"
          value={
            sortBy === "price" && order === "asc"
              ? "price_asc"
              : sortBy === "price" && order === "desc"
              ? "price_desc"
              : sortBy === "name"
              ? "name_asc"
              : "newest"
          }
          onChange={handleSortChange}
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
        </select>
      </div>

      <button className="btn filter-reset-btn" onClick={handleReset}>
        Reset Filters
      </button>
    </div>
  );
}

export default SearchFilters;
