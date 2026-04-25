import { Button, Table } from "antd";
import {
  AlertOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";
import PageCard from "../components/PageCard";
import StatusBadge from "../components/StatusBadge";
import { TamperHourlyChart, TopBinsTamperChart } from "../components/SimpleCharts";
import { Input } from "antd";
import { useMemo, useState } from "react";

export default function TamperAnalyticsPage({ model }) {
  const tamper = model.tamper;
  const [searchText, setSearchText] = useState("");

  const binFilterValues = useMemo(
    () => [...new Set((tamper.recentEvents || []).map((item) => item.bin_id).filter(Boolean))].sort(),
    [tamper.recentEvents]
  );

  const parseDate = (value) => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const filteredTamperRows = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return tamper.recentEvents;
    return (tamper.recentEvents || []).filter((row) => String(row.bin_id || "").toLowerCase().includes(term));
  }, [searchText, tamper.recentEvents]);

  const columns = [
    {
      title: "TIMESTAMP",
      dataIndex: "timestamp",
      key: "timestamp",
      filters: [
        { text: "Last 24h", value: "24h" },
        { text: "Last 3 days", value: "3d" },
        { text: "Older", value: "older" }
      ],
      onFilter: (value, record) => {
        const d = parseDate(record.timestamp);
        if (!d) return false;
        const now = Date.now();
        if (value === "24h") return now - d.getTime() <= 24 * 60 * 60 * 1000;
        if (value === "3d") return now - d.getTime() <= 3 * 24 * 60 * 60 * 1000;
        return now - d.getTime() > 3 * 24 * 60 * 60 * 1000;
      }
    },
    {
      title: "BIN ID",
      dataIndex: "bin_id",
      key: "bin_id",
      filters: binFilterValues.map((value) => ({ text: value, value })),
      onFilter: (value, record) => record.bin_id === value
    },
    { title: "EVENT TYPE", dataIndex: "event", key: "event" },
    {
      title: "SEVERITY",
      dataIndex: "severity",
      key: "severity",
      filters: [
        { text: "High", value: "High" },
        { text: "Medium", value: "Medium" },
        { text: "Low", value: "Low" }
      ],
      onFilter: (value, record) => record.severity === value,
      render: (value) => <StatusBadge value={value || "low"} />
    },
    { title: "STATUS", dataIndex: "status", key: "status", render: (v) => <StatusBadge value={v} /> },
    { title: "DURATION", dataIndex: "duration", key: "duration" },
    { title: "ACTIONS", key: "actions", render: () => <button className="table-action">Resolve</button> }
  ];

  return (
    <div className="page-shell">
      <div className="page-head-row">
        <h2 className="page-title">Tamper Detection Analytics</h2>
        <Button className="ghost-btn">Export PDF</Button>
      </div>

      <div className="stats-grid four">
        <div className="stat-card danger">
          <div className="stat-head"><div className="stat-icon danger"><AlertOutlined /></div></div>
          <p className="stat-label">Events Today</p>
          <h3 className="stat-value">{tamper.eventsToday}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-head"><div className="stat-icon"><RiseOutlined /></div></div>
          <p className="stat-label">vs Last Week</p>
          <h3 className="stat-value">{tamper.vsLastWeek}</h3>
        </div>
        <div className="stat-card success">
          <div className="stat-head"><div className="stat-icon success"><ClockCircleOutlined /></div></div>
          <p className="stat-label">Avg Response Time</p>
          <h3 className="stat-value">{tamper.avgResponse}</h3>
        </div>
        <div className="stat-card warning">
          <div className="stat-head"><div className="stat-icon warning"><SafetyCertificateOutlined /></div></div>
          <p className="stat-label">Highest Risk Bin</p>
          <h3 className="stat-value">{tamper.highestRiskArea}</h3>
        </div>
      </div>

      <div className="overview-grid">
        <PageCard title="Tamper Events Timeline (24h)" className="wide-card">
          <p className="chart-subtitle">Shows tamper detections grouped by hour to reveal high-risk time windows.</p>
          <TamperHourlyChart data={tamper.timeline} />
        </PageCard>

        <PageCard title="Top Bins by Tamper Events" className="alerts-card">
          <p className="chart-subtitle">Top 5 bins with repeated tamper alerts. Use this for inspection prioritization.</p>
          <TopBinsTamperChart data={tamper.topBins} />
        </PageCard>
      </div>

      <PageCard title="Location Coverage">
        <p className="chart-subtitle">
          {tamper.locationDataAvailable
            ? "Location data is available for some bins. Map-based hotspot analytics can be enabled."
            : "Location data unavailable. Add ESP32 GPS publishing to enable real tamper hotspot maps."}
        </p>

        {!tamper.locationDataAvailable && (
          <div className="location-fallback-list">
            {tamper.topBins.length === 0 ? (
              <p className="empty-text">No tamper bins available yet.</p>
            ) : (
              tamper.topBins.map((item) => (
                <div key={item.bin_id} className="location-fallback-item">
                  <strong>{item.bin_id}</strong>
                  <span>{item.count} tamper events</span>
                </div>
              ))
            )}
          </div>
        )}
      </PageCard>

      <PageCard title="Recent Tamper Events">
        <p className="chart-subtitle">Latest tamper incidents requiring supervisor follow-up.</p>
        <Input
          placeholder="Search by bin..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          style={{ marginBottom: 12, maxWidth: 320 }}
        />
        <Table columns={columns} dataSource={filteredTamperRows} pagination={false} scroll={{ x: 980 }} className="data-table" />
      </PageCard>
    </div>
  );
}
