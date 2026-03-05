import { useState, useEffect } from "react";
import axios from "axios";
import WishlistCard from "../components/WishlistCard";
import CreateWishlistForm from "../components/CreateWishlistForm";

const API = "";

function Wishlists({ currentUserId }) {
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");

  const fetchWishlists = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/wishlists`, {
        headers: { "x-user-id": currentUserId },
      });
      setWishlists(res.data);
    } catch (err) {
      setError("Failed to load wishlists");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUserId) fetchWishlists();
    else setLoading(false);
  }, [currentUserId]);

  const handleCreate = async (data) => {
    try {
      await axios.post(`${API}/api/wishlists`, data, {
        headers: { "x-user-id": currentUserId },
      });
      setShowCreate(false);
      fetchWishlists();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create wishlist");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this wishlist?")) return;
    try {
      await axios.delete(`${API}/api/wishlists/${id}`, {
        headers: { "x-user-id": currentUserId },
      });
      fetchWishlists();
    } catch (err) {
      setError("Failed to delete wishlist");
    }
  };

  const handleTogglePublic = async (wishlist) => {
    try {
      await axios.put(
        `${API}/api/wishlists/${wishlist._id}`,
        { isPublic: !wishlist.isPublic },
        { headers: { "x-user-id": currentUserId } }
      );
      fetchWishlists();
    } catch (err) {
      setError("Failed to update wishlist");
    }
  };

  if (!currentUserId) {
    return (
      <div className="wishlists-page">
        <h2>Wishlists</h2>
        <p className="empty-state">Sign in to create and manage wishlists.</p>
      </div>
    );
  }

  return (
    <div className="wishlists-page">
      <div className="wishlists-header">
        <h2>My Wishlists</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ New Wishlist"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreate && (
        <CreateWishlistForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      )}

      {loading ? (
        <p>Loading wishlists...</p>
      ) : wishlists.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any wishlists yet.</p>
          <p>Create one to start saving products you love!</p>
        </div>
      ) : (
        <div className="wishlists-grid">
          {wishlists.map((wl) => (
            <WishlistCard
              key={wl._id}
              wishlist={wl}
              onDelete={handleDelete}
              onTogglePublic={handleTogglePublic}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlists;
