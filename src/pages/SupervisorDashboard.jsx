import { AlertOutlined, CheckCircleOutlined, ClockCircleOutlined, ToolOutlined, WifiOutlined } from "@ant-design/icons";
import { Table, Tag } from "antd";
import PageCard from "../components/PageCard";
import StatCard from "../components/StatCard";

const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const statusTag = (value) => {
  const online = String(value || "").toLowerCase() === "online";
  return <Tag color={online ? "green" : "red"}>{online ? "ONLINE" : "OFFLINE"}</Tag>;
};

const serviceModeTag = (value) => (
  <Tag color={value ? "orange" : "green"}>{value ? "ON" : "OFF"}</Tag>
);

const alertTag = (value) => (
  <Tag color={value === "Tamper" ? "red" : "green"}>{value.toUpperCase()}</Tag>
);

export default function SupervisorDashboard({ model, logs }) {
  const bins = model.decoratedBins || [];
  const onlineBins = bins.filter((bin) => String(bin.status || "").toLowerCase() === "online").length;
  const serviceModeBins = bins.filter((bin) => Boolean(bin.service_mode)).length;
  const activeAlerts = bins.filter(
    (bin) => String(bin.status || "").toLowerCase() !== "online" || bin.state === "tamper"
  );

  const tableData = bins.map((bin) => ({
    key: bin.bin_id,
    bin_id: bin.bin_id,
    status: bin.status,
    service_mode: Boolean(bin.service_mode),
    last_seen: bin.lastSeenLabel || "-",
    alert_status: bin.state === "tamper" ? "Tamper" : "Normal"
  }));

  const activityRows = (logs || [])
    .filter((log) =>
      log?.topic === "smartbin/rfid" ||
      log?.topic === "smartbin/access" ||
      log?.topic === "smartbin/events"
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20)
    .map((log, index) => ({
      key: `${log.timestamp}-${index}`,
      time: formatTime(log.timestamp),
      bin: log.bin_id || "-",
      topic: log.topic || "-",
      event: log.event || log.status || "-",
      status: log.status || "received"
    }));

  const columns = [
    {
      title: "Bin ID",
      dataIndex: "bin_id",
      key: "bin_id",
      sorter: (a, b) => String(a.bin_id).localeCompare(String(b.bin_id))
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: statusTag
    },
    {
      title: "Service Mode",
      dataIndex: "service_mode",
      key: "service_mode",
      render: serviceModeTag
    },
    {
      title: "Last Seen",
      dataIndex: "last_seen",
      key: "last_seen"
    },
    {
      title: "Alert Status",
      dataIndex: "alert_status",
      key: "alert_status",
      render: alertTag,
      filters: [
        { text: "Normal", value: "Normal" },
        { text: "Tamper", value: "Tamper" }
      ],
      onFilter: (value, record) => record.alert_status === value
    }
  ];

  const recentColumns = [
    { title: "Time", dataIndex: "time", key: "time" },
    { title: "Bin", dataIndex: "bin", key: "bin" },
    { title: "Type", dataIndex: "topic", key: "topic" },
    { title: "Event", dataIndex: "event", key: "event" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => <Tag color={String(value).toLowerCase() === "denied" ? "red" : "blue"}>{String(value).toUpperCase()}</Tag>
    }
  ];

  return (
    <div className="page-shell">
      <h2 className="page-title">Supervisor Dashboard</h2>

      <div className="stats-grid four">
        <StatCard icon={ToolOutlined} label="Total Bins" value={bins.length} />
        <StatCard icon={WifiOutlined} label="Online Bins" value={onlineBins} tone="success" />
        <StatCard icon={ClockCircleOutlined} label="Bins in Service Mode" value={serviceModeBins} tone="warning" />
        <StatCard icon={AlertOutlined} label="Active Alerts" value={activeAlerts.length} tone="danger" />
      </div>

      <PageCard title="Bin Status">
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 900 }}
          className="data-table"
        />
      </PageCard>

      <PageCard title="Active Alerts">
        {activeAlerts.length === 0 ? (
          <p className="empty-text">No active alerts right now.</p>
        ) : (
          <div className="supervisor-alert-list">
            {activeAlerts.map((bin) => (
              <div key={bin.bin_id} className="supervisor-alert-item">
                <div>
                  <h4>{bin.bin_id}</h4>
                  <p>
                    {String(bin.status || "").toLowerCase() !== "online"
                      ? "Bin is offline"
                      : "Tamper detected"}
                  </p>
                </div>
                <Tag color="red">Attention Required</Tag>
              </div>
            ))}
          </div>
        )}
      </PageCard>

      <PageCard title="Recent Activity">
        <Table
          columns={recentColumns}
          dataSource={activityRows}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 920 }}
          className="data-table"
        />
      </PageCard>
    </div>
  );
}
