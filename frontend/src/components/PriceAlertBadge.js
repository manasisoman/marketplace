function PriceAlertBadge({ priceAtAdd, currentPrice }) {
  if (priceAtAdd == null || currentPrice == null) return null;

  const diff = currentPrice - priceAtAdd;
  const percent = ((diff / priceAtAdd) * 100).toFixed(1);

  if (diff === 0) return null;

  const isDropped = diff < 0;

  return (
    <span className={`price-alert-badge ${isDropped ? "price-dropped" : "price-increased"}`}>
      {isDropped ? (
        <>Price dropped {Math.abs(percent)}% (save ${Math.abs(diff).toFixed(2)})</>
      ) : (
        <>Price up {percent}% (+${diff.toFixed(2)})</>
      )}
    </span>
  );
}

export default PriceAlertBadge;
