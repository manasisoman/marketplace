const User = require("../models/User");

/**
 * Simple auth middleware — expects an x-user-id header.
 * In production this would verify a JWT or session token.
 */
const auth = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Authentication failed" });
  }
};

module.exports = auth;
