function OrderTimeline({ statusHistory, currentStatus }) {
  const allStatuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ];

  // For cancelled/refunded orders, determine the last normal status reached
  // by looking at statusHistory
  let effectiveIndex = allStatuses.indexOf(currentStatus);
  if (effectiveIndex === -1 && statusHistory && statusHistory.length > 0) {
    // Find the furthest normal status reached before cancellation/refund
    for (let i = statusHistory.length - 1; i >= 0; i--) {
      const idx = allStatuses.indexOf(statusHistory[i].status);
      if (idx !== -1) {
        effectiveIndex = idx;
        break;
      }
    }
  }
  const currentIndex = effectiveIndex;
  const isCancelledOrRefunded = currentStatus === "cancelled" || currentStatus === "refunded";

  return (
    <div className="order-timeline">
      <h3>Order Progress</h3>
      {isCancelledOrRefunded && (
        <div className={`timeline-terminal-status status-${currentStatus}`}>
          Order {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
        </div>
      )}
      <div className="timeline-steps">
        {allStatuses.map((status, index) => {
          let stepClass = "timeline-step";
          if (index < currentIndex) stepClass += " completed";
          else if (index === currentIndex) stepClass += isCancelledOrRefunded ? " completed" : " current";
          else stepClass += " upcoming";

          return (
            <div key={status} className={stepClass}>
              <div className="timeline-dot" />
              <div className="timeline-label">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
              {index < allStatuses.length - 1 && (
                <div className="timeline-line" />
              )}
            </div>
          );
        })}
      </div>

      {statusHistory && statusHistory.length > 0 && (
        <div className="status-history">
          <h4>Status History</h4>
          <ul className="history-list">
            {statusHistory.map((entry, index) => (
              <li key={index} className="history-item">
                <span className="history-status">
                  {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                </span>
                <span className="history-time">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                {entry.note && (
                  <span className="history-note">{entry.note}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default OrderTimeline;
