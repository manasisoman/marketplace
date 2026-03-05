import { useState } from "react";
import axios from "axios";

const API = "";

function HelpfulButton({ reviewId, initialCount, currentUserId }) {
  const [count, setCount] = useState(initialCount || 0);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const res = await axios.put(
        `${API}/api/reviews/${reviewId}/helpful`,
        {},
        { headers: { "x-user-id": currentUserId } }
      );
      setCount(res.data.helpful);
      setVoted(res.data.voted);
    } catch (err) {
      console.error("Error toggling helpful:", err);
    }
    setLoading(false);
  };

  return (
    <button
      className={`helpful-btn ${voted ? "voted" : ""}`}
      onClick={handleToggle}
      disabled={loading || !currentUserId}
    >
      {voted ? "Helpful" : "Helpful?"} ({count})
    </button>
  );
}

export default HelpfulButton;
