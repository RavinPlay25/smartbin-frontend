const toDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const toHourLabel = (hour) => `${String(hour).padStart(2, "0")}:00`;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const groupLogsByHour = (logs, filterFn = () => true) => {
  const grouped = Array.from({ length: 24 }).map((_, hour) => ({
    hour: toHourLabel(hour),
    count: 0
  }));

  logs.forEach((log) => {
    if (!filterFn(log)) return;
    const date = toDate(log?.timestamp);
    if (!date) return;
    grouped[date.getHours()].count += 1;
  });

  return grouped;
};

export const countByField = (items, field) => {
  return items.reduce((acc, item) => {
    const key = item?.[field] ?? "Unassigned";
    const label = String(key).trim() || "Unassigned";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
};

export const getTopBinsByEvent = (logs, eventName, limit = 5) => {
  const counts = logs.reduce((acc, log) => {
    if (log?.event !== eventName) return acc;
    const binId = log?.bin_id || "UNKNOWN";
    acc[binId] = (acc[binId] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([bin_id, count]) => ({ bin_id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

export const buildEventBreakdown = (logs) => {
  const tamper = logs.filter((log) => log?.event === "tamper_detected").length;
  const rfidGranted = logs.filter((log) => log?.topic === "smartbin/rfid" && log?.status === "granted").length;
  const rfidDenied = logs.filter((log) => log?.topic === "smartbin/rfid" && log?.status === "denied").length;
  const serviceMode = logs.filter((log) => String(log?.event || "").includes("service_mode")).length;
  const stable = logs.filter((log) => log?.event === "bin_stable").length;

  return [
    { name: "Tamper Events", value: tamper, color: "#ef4444" },
    { name: "RFID Granted", value: rfidGranted, color: "#22c55e" },
    { name: "RFID Denied", value: rfidDenied, color: "#f59e0b" },
    { name: "Service Mode Events", value: serviceMode, color: "#facc15" },
    { name: "Bin Stable Events", value: stable, color: "#0ea5a8" }
  ];
};

export const buildRfidHourlyTrend = (logs) => {
  const trend = Array.from({ length: 24 }).map((_, hour) => ({
    hour: toHourLabel(hour),
    granted: 0,
    denied: 0,
    total: 0
  }));

  logs.forEach((log) => {
    if (log?.topic !== "smartbin/rfid") return;
    const date = toDate(log?.timestamp);
    if (!date) return;

    const hour = date.getHours();
    const status = String(log?.status || "").toLowerCase();

    trend[hour].total += 1;
    if (status === "granted") trend[hour].granted += 1;
    if (status === "denied") trend[hour].denied += 1;
  });

  return trend;
};

export const buildSystemHealthTrend = (logs) => {
  const now = new Date();
  const points = [];
  let score = 100;

  for (let i = 23; i >= 0; i -= 1) {
    const start = new Date(now.getTime() - i * 60 * 60 * 1000);
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const hourLogs = logs.filter((log) => {
      const d = toDate(log?.timestamp);
      return d && d >= start && d < end;
    });

    const tamper = hourLogs.filter((log) => log?.event === "tamper_detected").length;
    const denied = hourLogs.filter((log) => log?.topic === "smartbin/rfid" && log?.status === "denied").length;
    const stable = hourLogs.filter((log) => log?.event === "bin_stable").length;

    const penalty = tamper * 12 + denied * 4;
    const recovery = stable * 2 + (tamper === 0 && denied === 0 ? 1 : 0);
    score = clamp(score - penalty + recovery, 0, 100);

    let note = "Stable hour";
    if (tamper > 0 || denied > 0) {
      note = `${tamper} tamper, ${denied} denied`;
    } else if (stable > 0) {
      note = `${stable} stable events`;
    }

    points.push({
      time: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      score: Number(score.toFixed(1)),
      note
    });
  }

  if (points.length === 0) {
    return Array.from({ length: 24 }).map((_, index) => ({
      time: `${String(index).padStart(2, "0")}:00`,
      score: 100,
      note: "No recent events"
    }));
  }

  return points;
};

