function ConversationList({ conversations, selectedId, onSelect, currentUserId }) {
  if (conversations.length === 0) {
    return (
      <div className="conversation-list-empty">
        <p>No conversations yet</p>
        <p className="text-muted">Start a conversation from a product page</p>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      {conversations.map((conv) => {
        const otherParticipant = conv.participants.find(
          (p) => p._id !== currentUserId
        );
        const isSelected = conv._id === selectedId;
        const lastMessagePreview = conv.lastMessage
          ? conv.lastMessage.content.slice(0, 50) + (conv.lastMessage.content.length > 50 ? "..." : "")
          : "No messages yet";
        const timeStr = conv.lastMessageAt
          ? new Date(conv.lastMessageAt).toLocaleDateString()
          : "";

        return (
          <div
            key={conv._id}
            className={`conversation-item ${isSelected ? "conversation-item-selected" : ""}`}
            onClick={() => onSelect(conv._id)}
          >
            <div className="conversation-avatar">
              {otherParticipant?.avatar ? (
                <img src={otherParticipant.avatar} alt={otherParticipant.name} />
              ) : (
                <div className="avatar-placeholder">
                  {otherParticipant?.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>
            <div className="conversation-details">
              <div className="conversation-header">
                <span className="conversation-name">
                  {otherParticipant?.name || "Unknown User"}
                </span>
                <span className="conversation-time">{timeStr}</span>
              </div>
              <p className="conversation-preview">{lastMessagePreview}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ConversationList;
