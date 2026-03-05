function ConversionFunnel({ data }) {
  if (!data) return null;

  const { views, cartAdds, purchases, viewToCartRate, cartToPurchaseRate } = data;
  const maxVal = Math.max(views, 1);

  return (
    <div className="conversion-funnel">
      <h3 className="funnel-title">Conversion Funnel</h3>
      <div className="funnel-stages">
        <div className="funnel-stage">
          <div className="funnel-bar-wrapper">
            <div
              className="funnel-bar funnel-bar-views"
              style={{ width: "100%" }}
            />
          </div>
          <div className="funnel-label">
            <span className="funnel-stage-name">Views</span>
            <span className="funnel-stage-value">{views.toLocaleString()}</span>
          </div>
        </div>

        <div className="funnel-stage">
          <div className="funnel-bar-wrapper">
            <div
              className="funnel-bar funnel-bar-cart"
              style={{ width: `${Math.max((cartAdds / maxVal) * 100, 2)}%` }}
            />
          </div>
          <div className="funnel-label">
            <span className="funnel-stage-name">Cart Adds</span>
            <span className="funnel-stage-value">
              {cartAdds.toLocaleString()} ({viewToCartRate}%)
            </span>
          </div>
        </div>

        <div className="funnel-stage">
          <div className="funnel-bar-wrapper">
            <div
              className="funnel-bar funnel-bar-purchase"
              style={{ width: `${Math.max((purchases / maxVal) * 100, 2)}%` }}
            />
          </div>
          <div className="funnel-label">
            <span className="funnel-stage-name">Purchases</span>
            <span className="funnel-stage-value">
              {purchases.toLocaleString()} ({cartToPurchaseRate}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConversionFunnel;
