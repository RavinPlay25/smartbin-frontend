import React from "react";

export default function AppHeader({ title, subtitle = null, compact = false, className = "" }) {
  return (
    <div className={`app-header-block ${compact ? "compact" : ""} ${className}`.trim()}>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}
