import { Table } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  UnlockOutlined
} from "@ant-design/icons";
import PageCard from "../components/PageCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import {
  RfidResultTrendChart,
  RfidScansByHourChart,
  RoleBreakdownChart
} from "../components/SimpleCharts";

const columns = [
  { title: "TIMESTAMP", dataIndex: "timestamp", key: "timestamp" },
  { title: "STAFF", dataIndex: "user", key: "user" },
  { title: "ROLE", dataIndex: "role", key: "role" },
  { title: "BIN ID", dataIndex: "bin_id", key: "bin_id" },
  { title: "STATUS", dataIndex: "status", key: "status", render: (v) => <StatusBadge value={v} /> },
  { title: "REASON", dataIndex: "reason", key: "reason" }
];

export default function RFIDLogsPage({ model }) {
  const data = model.rfid;

  return (
    <div className="page-shell">
      <h2 className="page-title">RFID Access Logs</h2>

      <div className="stats-grid four">
        <StatCard icon={UnlockOutlined} label="Total Scans" value={data.totalScans} />
        <StatCard icon={CheckCircleOutlined} label="Access Granted" value={data.accessGranted} tone="success" />
        <StatCard icon={CloseCircleOutlined} label="Access Denied" value={data.accessDenied} tone="danger" />
        <StatCard icon={TeamOutlined} label="Active Staff Today" value={data.activeStaffToday} tone="warning" />
      </div>

      <div className="overview-grid">
        <PageCard title="Access by Role" className="mini-donut-card">
          <p className="chart-subtitle">Role distribution of RFID scans. Missing role values are shown as Unassigned.</p>
          <RoleBreakdownChart data={data.roleBreakdown} />
        </PageCard>

        <PageCard title="RFID Access Result Trend" className="wide-card">
          <p className="chart-subtitle">Stacked hourly view of granted vs denied RFID scans to detect suspicious denial patterns.</p>
          <RfidResultTrendChart data={data.timeline} />
        </PageCard>
      </div>

      <PageCard title="RFID Scans by Hour">
        <p className="chart-subtitle">Total RFID scan volume by hour, with granted/denied details in tooltip.</p>
        <RfidScansByHourChart data={data.timeline} />
      </PageCard>

      <PageCard title="Role Access Split">
        <p className="chart-subtitle">Operational split by role: total scans with granted and denied counts.</p>
        <div className="role-split-list">
          {data.roleBreakdown.length === 0 ? (
            <p className="empty-text">No role-based RFID data yet.</p>
          ) : (
            data.roleBreakdown.map((role) => (
              <div key={role.name} className="role-split-item">
                <strong>{role.name}</strong>
                <span>Total: {role.total}</span>
                <span>Granted: {role.granted}</span>
                <span>Denied: {role.denied}</span>
              </div>
            ))
          )}
        </div>
      </PageCard>

      <PageCard title="Detailed Access Logs">
        <p className="chart-subtitle">Latest RFID access records for investigation and audit.</p>
        <Table
          columns={columns}
          dataSource={data.table}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 980 }}
          className="data-table"
        />
      </PageCard>
    </div>
  );
}
