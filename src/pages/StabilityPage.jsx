import { Button, Table } from "antd";
import { AlertOutlined, AimOutlined } from "@ant-design/icons";
import PageCard from "../components/PageCard";
import StatusBadge from "../components/StatusBadge";
import {
  BinStateSummaryChart,
  StableVsTamperChart,
  StabilityTrendChart
} from "../components/SimpleCharts";

const columns = [
  { title: "BIN ID", dataIndex: "bin_id", key: "bin_id" },
  { title: "LOCATION", dataIndex: "location", key: "location" },
  { title: "ROLL ANGLE", dataIndex: "roll", key: "roll", render: (v) => <span className="mono-pill">{v} deg</span> },
  { title: "PITCH ANGLE", dataIndex: "pitch", key: "pitch", render: (v) => <span className="mono-pill">{v} deg</span> },
  { title: "STATUS", dataIndex: "status", key: "status", render: (v) => <StatusBadge value={v} /> },
  { title: "ACTION", dataIndex: "action", key: "action", render: (v) => <button className="link-btn">{v}</button> }
];

export default function StabilityPage({ model }) {
  const { avgScore, misalignedBins, stableVsTamper, trend, stateSummary, actionRows, tiltAngleAvailable } = model.stability;

  return (
    <div className="page-shell">
      <h2 className="page-title">Bin Stability Monitoring</h2>

      <div className="stability-head-grid">
        <div className="hero-score">
          <div className="hero-icon"><AimOutlined /></div>
          <p>AVG STABILITY SCORE</p>
          <h3>{avgScore}<span>/100</span></h3>
          <span className="hero-trend">+1.2 pts this week</span>
        </div>

        <div className="hero-warning">
          <div className="hero-icon warning"><AlertOutlined /></div>
          <p>MISALIGNED BINS</p>
          <h3>{misalignedBins}</h3>
          <span className="hero-note">Requiring physical inspection</span>
        </div>

        <PageCard title="Tilt Distribution" className="mini-chart-card">
          <p className="chart-subtitle">
            {tiltAngleAvailable
              ? "Tilt angle distribution across bins."
              : "Tilt angle data not available yet. This chart currently compares stable vs tamper events."}
          </p>
          <StableVsTamperChart data={stableVsTamper} height={220} />
        </PageCard>
      </div>

      <PageCard title="Stability Event Trend">
        <p className="chart-subtitle">Hourly stable and tamper events to show when bins become unstable.</p>
        <StabilityTrendChart data={trend} />
      </PageCard>

      <PageCard title="Bin State Summary">
        <p className="chart-subtitle">Current operational state overview: online/offline/service and tamper event volume.</p>
        <BinStateSummaryChart data={stateSummary} />
      </PageCard>

      <PageCard
        title="Misaligned Bins Action Required"
        action={<Button className="ghost-btn">Export CSV</Button>}
      >
        <p className="chart-subtitle">Bins requiring manual inspection based on service/tamper state.</p>
        <Table
          columns={columns}
          dataSource={actionRows}
          pagination={false}
          scroll={{ x: 920 }}
          className="data-table"
        />
      </PageCard>
    </div>
  );
}
