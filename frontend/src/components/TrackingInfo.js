function TrackingInfo({ trackingNumber, carrier, currentStatus }) {
  if (!trackingNumber) {
    return (
      <div className="tracking-info">
        <h3>Tracking Information</h3>
        <p className="text-muted">
          No tracking information available yet. Tracking details will appear
          here once the order has been shipped.
        </p>
      </div>
    );
  }

  // Generate tracking URL based on carrier
  const getTrackingUrl = (carrier, trackingNumber) => {
    const urls = {
      UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      FedEx: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      DHL: `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${trackingNumber}`,
    };
    return urls[carrier] || null;
  };

  const trackingUrl = getTrackingUrl(carrier, trackingNumber);

  return (
    <div className="tracking-info">
      <h3>Tracking Information</h3>
      <div className="tracking-details">
        <div className="tracking-field">
          <span className="tracking-label">Carrier:</span>
          <span className="tracking-value">{carrier}</span>
        </div>
        <div className="tracking-field">
          <span className="tracking-label">Tracking Number:</span>
          <span className="tracking-value">{trackingNumber}</span>
        </div>
        <div className="tracking-field">
          <span className="tracking-label">Status:</span>
          <span className={`status-badge status-${currentStatus}`}>
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </span>
        </div>
        {trackingUrl && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn track-btn"
          >
            Track on {carrier} Website
          </a>
        )}
      </div>
    </div>
  );
}

export default TrackingInfo;
