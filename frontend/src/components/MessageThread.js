import { useEffect, useRef } from "react";

function MessageThread({ messages, currentUserId, loading }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="message-thread-loading">
        <p>Loading messages...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="message-thread-empty">
        <p>No messages yet. Say hello!</p>
      </div>
    );
  }

  return (
    <div className="message-thread">
      {messages.map((msg) => {
        const isMine =
          (msg.senderId?._id || msg.senderId) === currentUserId;
        const senderName = msg.senderId?.name || "Unknown";
        const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div
            key={msg._id}
            className={`message-bubble ${isMine ? "message-mine" : "message-theirs"}`}
          >
            {!isMine && (
              <span className="message-sender">{senderName}</span>
            )}
            <p className="message-content">{msg.content}</p>
            <span className="message-time">
              {timeStr}
              {isMine && msg.read && " \u2713\u2713"}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageThread;
