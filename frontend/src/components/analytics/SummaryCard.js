function SummaryCard({ title, value, subtitle }) {
  return (
    <div className="summary-card">
      <h3 className="summary-card-title">{title}</h3>
      <div className="summary-card-value">{value}</div>
      {subtitle && <p className="summary-card-subtitle">{subtitle}</p>}
    </div>
  );
}

export default SummaryCard;
