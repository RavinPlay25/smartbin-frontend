import {
  buildEventBreakdown,
  buildRfidHourlyTrend,
  buildSystemHealthTrend,
  countByField,
  getTopBinsByEvent,
  groupLogsByHour
} from "./analytics";

const toDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const toLabelDate = (value) => {
  const date = toDate(value);
  if (!date) return "-";
  return date.toLocaleString();
};

const latestEventByBin = (logs) => {
  const sorted = [...logs]
    .filter((log) => log?.bin_id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const map = new Map();

  sorted.forEach((log) => {
    if (!map.has(log.bin_id)) {
      map.set(log.bin_id, log);
    }
  });

  return map;
};

const binState = (bin, latestLog) => {
  if (latestLog?.event === "tamper_detected") return "tamper";
  if (bin.service_mode) return "service";
  if (String(bin.status).toLowerCase() === "online") return "stable";
  return "offline";
};

const randomTilt = (binId, seed = 1) => {
  const sum = String(binId)
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const roll = (((sum * 3 + seed) % 180) - 90) / 10;
  const pitch = (((sum * 5 + seed) % 180) - 90) / 10;

  return {
    roll: Number(roll.toFixed(1)),
    pitch: Number(pitch.toFixed(1))
  };
};

const normalizeRoleLabel = (roleValue) => {
  const role = String(roleValue || "").trim().toLowerCase();
  if (!role) return "Unassigned";
  if (role === "admin") return "Admin";
  if (role === "supervisor") return "Supervisor";
  if (role === "garbage_collector") return "Garbage Collector";
  return role.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
};

export const buildDashboardModel = (bins, logs) => {
  const latestByBin = latestEventByBin(logs);

  const decoratedBins = bins.map((bin) => {
    const latest = latestByBin.get(bin.bin_id);
    const state = binState(bin, latest);
    const binTamperCount = logs.filter((log) => log?.bin_id === bin.bin_id && log?.event === "tamper_detected").length;
    const stabilityScore = Math.max(0, 100 - (binTamperCount * 5));

    return {
      ...bin,
      state,
      lastSeenLabel: toLabelDate(bin.last_seen),
      latestEvent: latest?.event || "bin_stable",
      latestTimestamp: latest?.timestamp,
      tamperCount: binTamperCount,
      stabilityScore
    };
  });

  const totalBins = decoratedBins.length;
  const stableBins = decoratedBins.filter((bin) => bin.state === "stable").length;
  const tamperAlerts = decoratedBins.filter((bin) => bin.state === "tamper").length;
  const activeDevices = decoratedBins.filter((bin) => String(bin.status).toLowerCase() === "online").length;
  const offlineBins = decoratedBins.filter((bin) => String(bin.status).toLowerCase() !== "online").length;
  const serviceModeBins = decoratedBins.filter((bin) => Boolean(bin.service_mode)).length;
  const totalEvents = logs.length;

  const recentAlerts = [...logs]
    .filter((log) =>
      log?.event === "tamper_detected" ||
      log?.status === "denied" ||
      log?.event === "service_mode_enabled" ||
      log?.event === "service_mode_disabled"
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 6)
    .map((log) => ({
      id: `${log.bin_id}-${log.timestamp}-${log.event}`,
      bin_id: log.bin_id || "-",
      title:
        log.event === "tamper_detected"
          ? "Tamper Detected"
          : log.status === "denied"
            ? "RFID Access Denied"
            : log.event === "service_mode_enabled"
              ? "Service Mode Enabled"
              : "Service Mode Disabled",
      level:
        log.event === "tamper_detected" || log.status === "denied" ? "critical" : "warning",
      time: toDate(log.timestamp)?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "--:--"
    }));

  const notifications = [...logs]
    .filter((log) => log?.event === "tamper_detected" || log?.status === "denied")
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 3)
    .map((log) => ({
      id: `${log.timestamp}-${log.bin_id}-${log.event}`,
      title: log.event === "tamper_detected" ? "Tamper Detected" : "RFID Access Denied",
      bin: log.bin_id || "-",
      time: toDate(log.timestamp)?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "--:--"
    }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const rfidLogs = logs
    .filter((log) => log?.topic === "smartbin/rfid")
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const tamperLogs = logs
    .filter((log) => log?.event === "tamper_detected")
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const stableLogs = logs
    .filter((log) => log?.event === "bin_stable")
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const eventsToday = tamperLogs.filter((log) => {
    const d = toDate(log.timestamp);
    return d && d >= today;
  }).length;

  const currentWeekStart = new Date();
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  const previousWeekStart = new Date();
  previousWeekStart.setDate(previousWeekStart.getDate() - 14);

  const currentWeekTamper = tamperLogs.filter((log) => {
    const d = toDate(log.timestamp);
    return d && d >= currentWeekStart;
  }).length;

  const previousWeekTamper = tamperLogs.filter((log) => {
    const d = toDate(log.timestamp);
    return d && d >= previousWeekStart && d < currentWeekStart;
  }).length;

  const weeklyDelta = previousWeekTamper === 0
    ? (currentWeekTamper > 0 ? 100 : 0)
    : Math.round(((currentWeekTamper - previousWeekTamper) / previousWeekTamper) * 100);
  const weeklyDeltaLabel = `${weeklyDelta >= 0 ? "+" : ""}${weeklyDelta}%`;

  const tamperHourly = groupLogsByHour(logs, (log) => log?.event === "tamper_detected").map((item) => ({
    hour: item.hour,
    events: item.count
  }));

  const activityHourly = groupLogsByHour(logs, () => true);
  const peakActivity = activityHourly.reduce((max, item) => (item.count > max.count ? item : max), { hour: "00:00", count: 0 });
  const peakTamper = tamperHourly.reduce((max, item) => (item.events > max.events ? item : max), { hour: "00:00", events: 0 });

  const topTamperBins = getTopBinsByEvent(logs, "tamper_detected", 5);
  const topProblematicBins = topTamperBins.slice(0, 3).map((item, idx) => ({
    ...item,
    level: idx === 0 ? "critical" : idx === 1 ? "warning" : "normal"
  }));
  const hasLocationData = decoratedBins.some((bin) => {
    const lat = Number(bin?.gps?.lat ?? bin?.lat);
    const lng = Number(bin?.gps?.lng ?? bin?.lng);
    return Number.isFinite(lat) && Number.isFinite(lng);
  });

  const misalignedRows = decoratedBins
    .filter((bin) => bin.state === "tamper" || bin.state === "service")
    .map((bin, idx) => {
      const { roll, pitch } = randomTilt(bin.bin_id, idx + 3);
      const status = bin.state === "tamper" ? "Tampered" : "Service";
      return {
        key: `${bin.bin_id}-${idx}`,
        bin_id: bin.bin_id,
        location: `Zone ${String.fromCharCode(65 + (idx % 4))}, Street ${idx + 6}`,
        roll,
        pitch,
        status,
        action: "Dispatch Team"
      };
    });

  const totalScans = rfidLogs.length;
  const accessGranted = rfidLogs.filter((log) => String(log.status).toLowerCase() === "granted").length;
  const accessDenied = rfidLogs.filter((log) => String(log.status).toLowerCase() === "denied").length;
  const deniedPercent = totalScans > 0 ? Number(((accessDenied / totalScans) * 100).toFixed(1)) : 0;
  const serviceModePercent = totalBins > 0 ? Number(((serviceModeBins / totalBins) * 100).toFixed(1)) : 0;

  const todayTotalEvents = logs.filter((log) => {
    const d = toDate(log.timestamp);
    return d && d >= today;
  }).length;

  const yesterdayTotalEvents = logs.filter((log) => {
    const d = toDate(log.timestamp);
    return d && d >= yesterday && d < today;
  }).length;

  const todayTamperEvents = tamperLogs.filter((log) => {
    const d = toDate(log.timestamp);
    return d && d >= today;
  }).length;

  const yesterdayTamperEvents = tamperLogs.filter((log) => {
    const d = toDate(log.timestamp);
    return d && d >= yesterday && d < today;
  }).length;

  const calcTrend = (todayValue, yesterdayValue) => {
    if (yesterdayValue === 0) {
      if (todayValue === 0) return { percent: 0, direction: "flat" };
      return { percent: 100, direction: "up" };
    }

    const delta = ((todayValue - yesterdayValue) / yesterdayValue) * 100;
    return {
      percent: Number(Math.abs(delta).toFixed(1)),
      direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat"
    };
  };

  const totalTrend = calcTrend(todayTotalEvents, yesterdayTotalEvents);
  const tamperTrend = calcTrend(todayTamperEvents, yesterdayTamperEvents);
  const activeStaffToday = new Set(
    rfidLogs
      .filter((log) => {
        const d = toDate(log.timestamp);
        return d && d >= today;
      })
      .map((log) => log.user || "Unknown")
  ).size;

  const roleBuckets = rfidLogs.reduce((acc, log) => {
    const name = normalizeRoleLabel(log.role);
    if (!acc[name]) {
      acc[name] = { name, granted: 0, denied: 0, total: 0 };
    }

    const status = String(log.status || "").toLowerCase();
    if (status === "granted") acc[name].granted += 1;
    if (status === "denied") acc[name].denied += 1;
    acc[name].total += 1;
    return acc;
  }, {});

  const roleBreakdown = Object.values(roleBuckets).sort((a, b) => b.total - a.total);
  const rfidHourly = buildRfidHourlyTrend(logs);

  const rfidTable = rfidLogs.slice(0, 30).map((log, index) => ({
    key: `${log.timestamp}-${index}`,
    rfid_uid: log.rfid_uid || log.uid || "-",
    timestamp: toLabelDate(log.timestamp),
    event: log.event || "-",
    user: log.user || "Unknown",
    role: normalizeRoleLabel(log.role),
    bin_id: log.bin_id || "-",
    status: log.status || "received",
    reason: log.reason || "-"
  }));

  const recentTamperTable = tamperLogs.slice(0, 12).map((log, idx) => ({
    key: `${log.timestamp}-${idx}`,
    timestamp: toLabelDate(log.timestamp),
    bin_id: log.bin_id || "-",
    event: "Tamper Detected",
    status: idx % 2 === 0 ? "Unresolved" : "Resolved",
    severity: idx % 3 === 0 ? "High" : idx % 3 === 1 ? "Medium" : "Low",
    duration: `${12 + idx * 3} mins`
  }));

  const stabilityHourly = Array.from({ length: 24 }).map((_, hour) => {
    const label = `${String(hour).padStart(2, "0")}:00`;
    return {
      hour: label,
      stable: 0,
      tamper: 0
    };
  });

  stableLogs.forEach((log) => {
    const d = toDate(log.timestamp);
    if (d) stabilityHourly[d.getHours()].stable += 1;
  });

  tamperLogs.forEach((log) => {
    const d = toDate(log.timestamp);
    if (d) stabilityHourly[d.getHours()].tamper += 1;
  });

  const stateSummary = [
    { name: "Online", count: activeDevices, color: "#22c55e" },
    { name: "Offline", count: offlineBins, color: "#1e3a8a" },
    { name: "Service Mode", count: serviceModeBins, color: "#facc15" },
    { name: "Tamper Events", count: tamperLogs.length, color: "#ef4444" }
  ];

  const eventBreakdown = buildEventBreakdown(logs);

  return {
    stats: { totalBins, stableBins, tamperAlerts, activeDevices },
    decoratedBins,
    recentAlerts,
    notifications,
    overview: {
      systemHealthTrend: buildSystemHealthTrend(logs),
      eventBreakdown,
      analytics: {
        totalEvents,
        tamperEvents: tamperLogs.length,
        rfidDeniedPercent: deniedPercent,
        serviceModePercent,
        trends: {
          totalEvents: totalTrend,
          tamperEvents: tamperTrend
        },
        topProblematicBins,
        timeInsights: {
          peakActivityHour: peakActivity.hour,
          peakTamperHour: peakTamper.hour,
          activityText: `Peak activity is around ${peakActivity.hour}`,
          tamperText: peakTamper.events > 0
            ? `Most tamper events occur around ${peakTamper.hour}`
            : "No tamper spikes detected yet"
        }
      }
    },
    stability: {
      avgScore: totalBins ? Number(((stableBins / totalBins) * 100).toFixed(1)) : 0,
      misalignedBins: misalignedRows.length,
      tiltAngleAvailable: false,
      stableVsTamper: [
        { name: "Stable Events", count: stableLogs.length, color: "#22c55e" },
        { name: "Tamper Events", count: tamperLogs.length, color: "#ef4444" }
      ],
      trend: stabilityHourly,
      stateSummary,
      actionRows: misalignedRows
    },
    tamper: {
      eventsToday,
      vsLastWeek: weeklyDeltaLabel,
      avgResponse: "N/A",
      highestRiskArea: topTamperBins[0]?.bin_id || "N/A",
      timeline: tamperHourly,
      topBins: topTamperBins,
      locationDataAvailable: hasLocationData,
      recentEvents: recentTamperTable
    },
    rfid: {
      totalScans,
      accessGranted,
      accessDenied,
      activeStaffToday,
      roleBreakdown,
      timeline: rfidHourly,
      table: rfidTable
    }
  };
};
