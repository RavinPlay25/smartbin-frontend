import {
  AlertOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  InboxOutlined,
  RiseOutlined
} from "@ant-design/icons";
import { message, Popconfirm, Switch } from "antd";
import L from "leaflet";
import { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import PageCard from "../components/PageCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { EventBreakdownChart, SystemHealthTrendChart } from "../components/SimpleCharts";
import { updateServiceMode } from "../services/api";

const DEFAULT_CENTER = [6.9271, 79.8612];

const mapStateColor = {
  stable: "#22c55e",
  service: "#facc15",
  tamper: "#ef4444",
  offline: "#9ca3af"
};

const buildMarkerIcon = (state) =>
  L.divIcon({
    className: "smartbin-marker-wrap",
    html: `<span class="smartbin-marker-dot" style="background:${mapStateColor[state] || mapStateColor.offline};"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

const getBinCoordinates = (bin) => {
  const lat = bin?.gps?.lat ?? bin?.lat;
  const lng = bin?.gps?.lng ?? bin?.lng;

  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null;
  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) return null;

  return [parsedLat, parsedLng];
};

export default function OverviewPage({ model, onRefreshBins, currentUserRole }) {
  const [loadingSwitches, setLoadingSwitches] = useState({});
  const { stats, decoratedBins, recentAlerts, overview } = model;
  const analytics = overview.analytics;
  const markerBins = decoratedBins
    .map((bin) => ({
      ...bin,
      coordinates: getBinCoordinates(bin)
    }))
    .filter((bin) => Array.isArray(bin.coordinates));

  const mapMarkers = markerBins.length
    ? markerBins
    : [
        {
          bin_id: "BIN001",
          status: "online",
          service_mode: false,
          lastSeenLabel: "-",
          state: "stable",
          coordinates: DEFAULT_CENTER
        }
      ];

  const handleServiceModeToggle = async (binId, enabled) => {
    setLoadingSwitches((prev) => ({ ...prev, [binId]: true }));

    try {
      await updateServiceMode(binId, enabled);
      message.success(`Service mode ${enabled ? "enabled" : "disabled"} for ${binId}`);

      if (typeof onRefreshBins === "function") {
        await onRefreshBins();
      }
    } catch (error) {
      message.error(error.message || "Failed to update service mode");
    } finally {
      setLoadingSwitches((prev) => ({ ...prev, [binId]: false }));
    }
  };

  return (
    <div className="page-shell">
      <h2 className="page-title">System Overview</h2>

      <div className="stats-grid four">
        <StatCard icon={InboxOutlined} label="Total Bins" value={stats.totalBins} trend="+12" />
        <StatCard icon={CheckCircleOutlined} label="Stable Bins" value={stats.stableBins} trend="+5%" tone="success" />
        <StatCard icon={AlertOutlined} label="Tamper Alerts" value={stats.tamperAlerts} trend="-2" tone="danger" />
        <StatCard icon={EnvironmentOutlined} label="Active Devices" value={stats.activeDevices} trend="99.4%" tone="success" />
      </div>

      <div className="stats-grid four">
        <div className="stat-card">
          <div className="stat-head">
            <div className="stat-icon"><InboxOutlined /></div>
            <span className={`trend-badge ${analytics.trends.totalEvents.direction === "up" ? "up" : "down"}`}>
              <RiseOutlined /> {analytics.trends.totalEvents.percent}%
            </span>
          </div>
          <p className="stat-label">Total Events</p>
          <h3 className="stat-value">{analytics.totalEvents}</h3>
        </div>

        <div className="stat-card danger">
          <div className="stat-head">
            <div className="stat-icon danger"><AlertOutlined /></div>
            <span className={`trend-badge ${analytics.trends.tamperEvents.direction === "up" ? "down" : "up"}`}>
              <RiseOutlined /> {analytics.trends.tamperEvents.percent}%
            </span>
          </div>
          <p className="stat-label">Tamper Events</p>
          <h3 className="stat-value">{analytics.tamperEvents}</h3>
        </div>

        <div className="stat-card warning">
          <div className="stat-head"><div className="stat-icon warning"><AlertOutlined /></div></div>
          <p className="stat-label">RFID Denied %</p>
          <h3 className="stat-value">{analytics.rfidDeniedPercent}%</h3>
        </div>

        <div className="stat-card success">
          <div className="stat-head"><div className="stat-icon success"><CheckCircleOutlined /></div></div>
          <p className="stat-label">Service Mode %</p>
          <h3 className="stat-value">{analytics.serviceModePercent}%</h3>
        </div>
      </div>

      <div className="overview-grid">
        <PageCard title="City Map Visualization" className="map-card">
          <div className="city-map">
            <MapContainer center={DEFAULT_CENTER} zoom={13} scrollWheelZoom className="satellite-map">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri"
              />
              {mapMarkers.map((bin) => (
                <Marker
                  key={`${bin.bin_id}-${bin.coordinates[0]}-${bin.coordinates[1]}`}
                  position={bin.coordinates}
                  icon={buildMarkerIcon(bin.state)}
                >
                  <Popup>
                    <div className="map-popup">
                      <strong>{bin.bin_id}</strong>
                      <span>Status: {String(bin.status || "offline").toLowerCase()}</span>
                      <span>Service Mode: {bin.service_mode ? "ON" : "OFF"}</span>
                      <span>Last Seen: {bin.lastSeenLabel || "-"}</span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="map-legend">
            <span><i style={{ background: "#22c55e" }} /> Stable</span>
            <span><i style={{ background: "#facc15" }} /> Service Mode</span>
            <span><i style={{ background: "#ef4444" }} /> Tamper</span>
          </div>
        </PageCard>

        <PageCard title="Recent Alerts" className="alerts-card">
          <div className="alerts-list">
            {recentAlerts.length === 0 ? (
              <p className="empty-text">No recent alerts</p>
            ) : (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="alert-row">
                  <div>
                    <h4>{alert.bin_id}</h4>
                    <p>{alert.title}</p>
                  </div>
                  <div className="alert-meta">
                    <span>{alert.time}</span>
                    <StatusBadge value={alert.level === "critical" ? "Critical" : "Warning"} />
                  </div>
                </div>
              ))
            )}
          </div>
          <button type="button" className="link-btn">View All Alerts</button>
        </PageCard>
      </div>

      <div className="overview-grid">
        <PageCard title="System Health Trend">
          <p className="chart-subtitle">Higher score means fewer tamper and RFID access issues across recent hours.</p>
          <SystemHealthTrendChart data={overview.systemHealthTrend} />
        </PageCard>

        <PageCard title="Event Breakdown">
          <p className="chart-subtitle">Shows which event type dominates operations right now.</p>
          <EventBreakdownChart data={overview.eventBreakdown} />
        </PageCard>
      </div>

      <div className="overview-grid">
        <PageCard title="Top Problematic Bins">
          <p className="chart-subtitle">Top bins ranked by tamper frequency for fast operational prioritization.</p>
          <div className="problem-list">
            {analytics.topProblematicBins.length === 0 ? (
              <p className="empty-text">No problematic bins detected.</p>
            ) : (
              analytics.topProblematicBins.map((item) => (
                <div key={item.bin_id} className="problem-item">
                  <strong>{item.bin_id}</strong>
                  <span>{item.count} tamper events</span>
                  <StatusBadge value={item.level === "critical" ? "Critical" : item.level === "warning" ? "Warning" : "Normal"} />
                </div>
              ))
            )}
          </div>
        </PageCard>

        <PageCard title="Time Insights">
          <p className="chart-subtitle">Quick operational insights from event distribution over time.</p>
          <div className="insight-list">
            <div className="insight-item">
              <h4>Peak Activity Time</h4>
              <p>{analytics.timeInsights.activityText}</p>
            </div>
            <div className="insight-item">
              <h4>Peak Tamper Time</h4>
              <p>{analytics.timeInsights.tamperText}</p>
            </div>
          </div>
        </PageCard>
      </div>

      <PageCard title="Live Bin Status">
        <div className="bin-grid">
          {decoratedBins.map((bin) => (
            <div key={bin.bin_id} className={`bin-item ${bin.state}`}>
              <div>
                <h4>{bin.bin_id}</h4>
                <p>Last Seen: {bin.lastSeenLabel}</p>
                <p>Stability Score: <strong>{bin.stabilityScore}</strong></p>
                <div className="bin-service-row">
                  <span className="bin-service-label">Service Mode</span>
                  {currentUserRole === "admin" ? (
                    <Popconfirm
                      title={bin.service_mode ? "Disable Service Mode?" : "Enable Service Mode?"}
                      okText="Yes"
                      cancelText="No"
                      onConfirm={() => handleServiceModeToggle(bin.bin_id, !bin.service_mode)}
                    >
                      <Switch
                        checked={Boolean(bin.service_mode)}
                        loading={Boolean(loadingSwitches[bin.bin_id])}
                        checkedChildren="ON"
                        unCheckedChildren="OFF"
                      />
                    </Popconfirm>
                  ) : (
                    <span className="bin-service-state">{bin.service_mode ? "ON" : "OFF"}</span>
                  )}
                </div>
              </div>
              <div className="bin-badges">
                <StatusBadge value={String(bin.status || "offline").toLowerCase()} />
                <StatusBadge value={bin.service_mode ? "service" : bin.state} />
              </div>
            </div>
          ))}
        </div>
      </PageCard>
    </div>
  );
}
