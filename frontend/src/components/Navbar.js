function Navbar({ view, setView, cartCount, searchQuery, setSearchQuery }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => setView("home")}>
        TradeHub
      </div>

      {/* Search bar — only shows on home view */}
      {view === "home" && (
        <input
          className="search-input"
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      )}

      <div className="navbar-actions">
        <button
          className={`nav-btn ${view === "home" ? "active" : ""}`}
          onClick={() => setView("home")}
        >
          Browse
        </button>
        <button
          className={`nav-btn ${view === "sell" ? "active" : ""}`}
          onClick={() => setView("sell")}
        >
          + Sell
        </button>
        <button
          className={`nav-btn cart-btn ${view === "cart" ? "active" : ""}`}
          onClick={() => setView("cart")}
        >
          Cart
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
