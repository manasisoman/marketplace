const mongoose = require("mongoose");

// Simple auth middleware that looks up user by x-user-id header
// In a real app this would verify a JWT or session token
const auth = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Validate that userId is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: "Invalid user ID" });
    }

    // Attach user info to request — in a real app we'd look up the full user document
    req.user = { _id: new mongoose.Types.ObjectId(userId) };
    next();
  } catch (err) {
    res.status(401).json({ error: "Authentication failed" });
  }
};

module.exports = auth;
