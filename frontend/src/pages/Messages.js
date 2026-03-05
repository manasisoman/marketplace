import { useState, useEffect } from "react";
import axios from "axios";
import ConversationList from "../components/ConversationList";
import MessageThread from "../components/MessageThread";
import MessageInput from "../components/MessageInput";

const API = "";

function Messages({ currentUserId }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
    }
  }, [selectedConversationId]);

  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const res = await axios.get(`${API}/api/conversations`, {
        headers: { "x-user-id": currentUserId },
      });
      setConversations(res.data);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
    setLoadingConversations(false);
  };

  const fetchMessages = async (conversationId) => {
    setLoadingMessages(true);
    try {
      const res = await axios.get(`${API}/api/messages/${conversationId}`, {
        headers: { "x-user-id": currentUserId },
      });
      setMessages(res.data.messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
    setLoadingMessages(false);
  };

  const sendMessage = async (content) => {
    try {
      await axios.post(
        `${API}/api/messages`,
        { conversationId: selectedConversationId, content },
        { headers: { "x-user-id": currentUserId } }
      );
      // Re-fetch messages and conversations to update preview
      fetchMessages(selectedConversationId);
      fetchConversations();
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="messages-page">
      <div className="messages-sidebar">
        <h2 className="messages-sidebar-title">Messages</h2>
        {loadingConversations ? (
          <p className="text-muted">Loading...</p>
        ) : (
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
            currentUserId={currentUserId}
          />
        )}
      </div>

      <div className="messages-main">
        {selectedConversationId ? (
          <>
            <MessageThread
              messages={messages}
              currentUserId={currentUserId}
              loading={loadingMessages}
            />
            <MessageInput onSend={sendMessage} disabled={!selectedConversationId} />
          </>
        ) : (
          <div className="messages-placeholder">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;
