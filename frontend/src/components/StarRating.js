function StarRating({ rating, maxStars = 5, size = "medium", interactive = false, onRate }) {
  const stars = [];

  for (let i = 1; i <= maxStars; i++) {
    const filled = i <= Math.round(rating);
    stars.push(
      <span
        key={i}
        className={`star ${filled ? "star-filled" : "star-empty"} star-${size}`}
        onClick={interactive ? () => onRate(i) : undefined}
        style={{ cursor: interactive ? "pointer" : "default" }}
      >
        {filled ? "\u2605" : "\u2606"}
      </span>
    );
  }

  return <span className="star-rating">{stars}</span>;
}

export default StarRating;
