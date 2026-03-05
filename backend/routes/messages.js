const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

// POST /api/messages — send a message
router.post("/", auth, async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    if (!conversationId || !content) {
      return res.status(400).json({ error: "conversationId and content are required" });
    }

    // Verify user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: "Not a participant in this conversation" });
    }

    const message = new Message({
      conversationId,
      senderId: req.user._id,
      content,
    });
    await message.save();

    // Update conversation with last message info
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// GET /api/messages/:conversationId — get messages in a conversation
router.get("/:conversationId", auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: "Not a participant in this conversation" });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const total = await Message.countDocuments({ conversationId: req.params.conversationId });
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate("senderId", "name avatar")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    res.json({ messages, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// PUT /api/messages/:id/read — mark a message as read
router.put("/:id/read", auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only the recipient (non-sender participant) can mark as read
    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant || message.senderId.toString() === req.user._id.toString()) {
      return res.status(403).json({ error: "Only the recipient can mark a message as read" });
    }

    message.read = true;
    await message.save();
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: "Failed to mark message as read" });
  }
});

module.exports = router;
