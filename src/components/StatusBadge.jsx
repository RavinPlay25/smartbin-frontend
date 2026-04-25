export default function StatusBadge({ value }) {
  const label = String(value || "unknown").toLowerCase();

  let tone = "neutral";
  if (["online", "stable", "granted", "resolved"].includes(label)) tone = "success";
  if (["service", "tilted", "warning"].includes(label)) tone = "warning";
  if (["tamper", "tampered", "denied", "critical", "unresolved", "offline"].includes(label)) tone = "danger";

  return <span className={`status-badge ${tone}`}>{value}</span>;
}