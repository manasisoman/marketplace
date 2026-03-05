import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./components/Navbar";
import ProductGrid from "./components/ProductGrid";
import AddProductForm from "./components/AddProductForm";
import Cart from "./components/Cart";
import ProductDetail from "./components/ProductDetail";
import SearchFilters from "./components/SearchFilters";
import "./App.css";

const API = "";

function App() {
  // State = data that React tracks and re-renders when changed
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [view, setView] = useState("home"); // "home" | "sell" | "cart"
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({});

  // Load products when app first opens
  useEffect(() => {
    fetchProducts();
    fetchCart();
    fetchFavorites();
  }, []);

  // Re-run search whenever searchQuery or filters change
  useEffect(() => {
    if (searchQuery.trim() === "") {
      fetchProducts();
    } else {
      searchProducts(searchQuery);
    }
  }, [searchQuery, filters]);

  // USES ENDPOINT 2: GET all products with filters
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set("category", filters.category);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.order) params.set("order", filters.order);
      const queryStr = params.toString();
      const res = await axios.get(`${API}/products${queryStr ? "?" + queryStr : ""}`);
      setProducts(res.data.products);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
    setLoading(false);
  };

  // USES ENDPOINT 3: SEARCH products with filters
  const searchProducts = async (query) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (filters.category) params.set("category", filters.category);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.order) params.set("order", filters.order);
      const res = await axios.get(`${API}/products/search?${params.toString()}`);
      setProducts(res.data.products);
    } catch (err) {
      console.error("Search error:", err);
    }
    setLoading(false);
  };

  // Handle filter changes from SearchFilters component
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // USES ENDPOINT 5: CREATE product
  const addProduct = async (productData) => {
    await axios.post(`${API}/products`, productData); // let errors bubble up to the form
    fetchProducts();
    setView("home");
  };

  // USES ENDPOINT 4: GET single product
  const viewProduct = async (productId) => {
    try {
      const res = await axios.get(`${API}/products/${productId}`);
      setSelectedProduct(res.data);
      setView("detail");
    } catch (err) {
      console.error("Error fetching product:", err);
    }
  };

  // USES ENDPOINT 6: UPDATE product
  const editProduct = async (id, updatedData) => {
    const res = await axios.put(`${API}/products/${id}`, updatedData);
    setSelectedProduct(res.data);
    fetchProducts();
  };

  // USES ENDPOINT 7: DELETE product
  const deleteProduct = async (id) => {
    try {
      await axios.delete(`${API}/products/${id}`);
      fetchProducts();
      if (view === "detail") setView("home");
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  // USES ENDPOINT 8: GET cart
  const fetchCart = async () => {
    try {
      const res = await axios.get(`${API}/cart`);
      setCartItems(res.data.items);
      setCartTotal(res.data.total);
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  // USES ENDPOINT 9: ADD to cart
  const addToCart = async (product) => {
    try {
      await axios.post(`${API}/cart`, {
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
      });
      fetchCart();
    } catch (err) {
      console.error("Error adding to cart:", err);
    }
  };

  // USES ENDPOINT 10: UPDATE cart item quantity
  const updateCartQuantity = async (itemId, newQuantity) => {
    try {
      if (newQuantity <= 0) {
        await axios.delete(`${API}/cart/${itemId}`);
      } else {
        await axios.put(`${API}/cart/${itemId}`, { quantity: newQuantity });
      }
      fetchCart();
    } catch (err) {
      console.error("Error updating cart quantity:", err);
    }
  };

  // USES ENDPOINT 11: REMOVE from cart
  const removeFromCart = async (itemId) => {
    try {
      await axios.delete(`${API}/cart/${itemId}`);
      fetchCart();
    } catch (err) {
      console.error("Error removing from cart:", err);
    }
  };

  // Favorites
  const fetchFavorites = async () => {
    try {
      const res = await axios.get(`${API}/favorites`);
      setFavorites(res.data);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  };

  const addFavorite = async (product) => {
    try {
      await axios.post(`${API}/favorites`, {
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
      });
      fetchFavorites();
    } catch (err) {
      console.error("Error adding favorite:", err);
    }
  };

  const removeFavorite = async (favId) => {
    try {
      await axios.delete(`${API}/favorites/${favId}`);
      fetchFavorites();
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  return (
    <div className="app">
      <Navbar
        view={view}
        setView={setView}
        cartCount={cartItems.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="main-content">
        {view === "home" && (
          <SearchFilters onFilterChange={handleFilterChange} />
        )}
        {view === "home" && (
          <ProductGrid
            products={products}
            loading={loading}
            searchQuery={searchQuery}
            onAddToCart={addToCart}
            onDelete={deleteProduct}
            onViewProduct={viewProduct}
            favorites={favorites}
            onFavorite={addFavorite}
            onUnfavorite={removeFavorite}
          />
        )}
        {view === "detail" && selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onAddToCart={addToCart}
            onDelete={deleteProduct}
            onEdit={editProduct}
            onBack={() => setView("home")}
          />
        )}
        {view === "sell" && (
          <AddProductForm onSubmit={addProduct} onCancel={() => setView("home")} />
        )}
        {view === "cart" && (
          <Cart
            items={cartItems}
            total={cartTotal}
            onRemove={removeFromCart}
            onUpdateQuantity={updateCartQuantity}
            onBack={() => setView("home")}
          />
        )}
      </main>
    </div>
  );
}

export default App;
