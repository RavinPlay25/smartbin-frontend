export default function StatCard({ icon: Icon, label, value, trend, tone = "default", subtitle }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-head">
        <div className={`stat-icon ${tone}`}>
          <Icon style={{ fontSize: 24 }} />
        </div>
        {trend ? <span className={`trend-badge ${trend.startsWith("-") ? "down" : "up"}`}>{trend}</span> : null}
      </div>

      <p className="stat-label">{label}</p>
      <h3 className="stat-value">{value}</h3>
      {subtitle ? <p className="stat-subtitle">{subtitle}</p> : null}
    </div>
  );
}
