function OrderTimeline({ statusHistory, currentStatus }) {
  const allStatuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ];

  const currentIndex = allStatuses.indexOf(currentStatus);

  return (
    <div className="order-timeline">
      <h3>Order Progress</h3>
      <div className="timeline-steps">
        {allStatuses.map((status, index) => {
          let stepClass = "timeline-step";
          if (index < currentIndex) stepClass += " completed";
          else if (index === currentIndex) stepClass += " current";
          else stepClass += " upcoming";

          // Check if order was cancelled or refunded
          if (currentStatus === "cancelled" || currentStatus === "refunded") {
            if (index === currentIndex) stepClass = "timeline-step current cancelled";
          }

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
