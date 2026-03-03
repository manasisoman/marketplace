import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./components/Navbar";
import ProductGrid from "./components/ProductGrid";
import AddProductForm from "./components/AddProductForm";
import Cart from "./components/Cart";
import "./App.css";

const API = "http://localhost:5000";

function App() {
  // State = data that React tracks and re-renders when changed
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [view, setView] = useState("home"); // "home" | "sell" | "cart"
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Load products when app first opens
  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  // Re-run search whenever searchQuery changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      fetchProducts();
    } else {
      searchProducts(searchQuery);
    }
  }, [searchQuery]);

  // USES ENDPOINT 2: GET all products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/products`);
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
    setLoading(false);
  };

  // USES ENDPOINT 3: SEARCH products
  const searchProducts = async (query) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/products/search?q=${query}`);
      setProducts(res.data);
    } catch (err) {
      console.error("Search error:", err);
    }
    setLoading(false);
  };

  // USES ENDPOINT 5: CREATE product
  const addProduct = async (productData) => {
    await axios.post(`${API}/products`, productData); // let errors bubble up to the form
    fetchProducts();
    setView("home");
  };

  // USES ENDPOINT 7: DELETE product
  const deleteProduct = async (id) => {
    try {
      await axios.delete(`${API}/products/${id}`);
      fetchProducts();
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

  // USES ENDPOINT 10: REMOVE from cart
  const removeFromCart = async (itemId) => {
    try {
      await axios.delete(`${API}/cart/${itemId}`);
      fetchCart();
    } catch (err) {
      console.error("Error removing from cart:", err);
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
          <ProductGrid
            products={products}
            loading={loading}
            searchQuery={searchQuery}
            onAddToCart={addToCart}
            onDelete={deleteProduct}
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
            onBack={() => setView("home")}
          />
        )}
      </main>
    </div>
  );
}

export default App;
