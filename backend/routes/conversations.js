const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// POST /api/conversations — start a new conversation
router.post("/", auth, async (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId) {
      return res.status(400).json({ error: "participantId is required" });
    }

    // Check if conversation between the two users already exists
    const existing = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId] },
    });
    if (existing) {
      return res.json(existing);
    }

    const conversation = new Conversation({
      participants: [req.user._id, participantId],
    });
    await conversation.save();
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// GET /api/conversations — list all conversations for the authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "name avatar")
      .populate("lastMessage", "content createdAt")
      .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

module.exports = router;
