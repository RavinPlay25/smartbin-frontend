export default function PageCard({ title, action, children, className = "" }) {
  return (
    <section className={`page-card ${className}`.trim()}>
      <header className="page-card-header">
        <h3>{title}</h3>
        {action}
      </header>
      <div className="page-card-content">{children}</div>
    </section>
  );
}