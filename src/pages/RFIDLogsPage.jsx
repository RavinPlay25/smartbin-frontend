import { useMemo, useState } from "react";
import { Button, Input, Modal, Select, Table, message } from "antd";
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
import { approveRFID } from "../services/api";

export default function RFIDLogsPage({ model, onRefreshLogs, currentUserRole }) {
  const data = model.rfid;
  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUid, setSelectedUid] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("garbage_collector");
  const [submitting, setSubmitting] = useState(false);
  const [approvingUid, setApprovingUid] = useState("");

  const openApproveModal = (uid) => {
    if (!uid || uid === "-") {
      message.error("RFID UID is missing for this log entry");
      return;
    }

    setSelectedUid(uid);
    setName("");
    setRole("garbage_collector");
    setModalOpen(true);
  };

  const closeApproveModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setSelectedUid("");
    setName("");
    setRole("garbage_collector");
  };

  const handleApproveSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      message.error("Name is required");
      return;
    }

    setSubmitting(true);
    setApprovingUid(selectedUid);

    try {
      await approveRFID({
        rfid_uid: selectedUid,
        name: trimmedName,
        role
      });

      message.success("RFID approved successfully");
      closeApproveModal();

      if (typeof onRefreshLogs === "function") {
        await onRefreshLogs();
      }
    } catch (error) {
      message.error(error.message || "Failed to approve RFID");
    } finally {
      setSubmitting(false);
      setApprovingUid("");
    }
  };

  const binFilterValues = useMemo(
    () => [...new Set((data.table || []).map((row) => row.bin_id).filter(Boolean))].sort(),
    [data.table]
  );

  const eventFilterValues = [
    "tamper_detected",
    "rfid_granted",
    "rfid_denied",
    "service_mode_enabled",
    "service_mode_disabled"
  ];

  const statusFilterValues = ["granted", "denied", "pending"];

  const filteredTableData = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return data.table;

    return (data.table || []).filter((row) => {
      return (
        String(row?.bin_id || "").toLowerCase().includes(term) ||
        String(row?.event || "").toLowerCase().includes(term) ||
        String(row?.rfid_uid || "").toLowerCase().includes(term) ||
        String(row?.user || "").toLowerCase().includes(term)
      );
    });
  }, [data.table, searchText]);

  const columns = useMemo(() => {
    const baseColumns = [
      { title: "TIMESTAMP", dataIndex: "timestamp", key: "timestamp" },
      {
        title: "EVENT",
        dataIndex: "event",
        key: "event",
        filters: eventFilterValues.map((value) => ({ text: value, value })),
        onFilter: (value, record) => String(record.event || "").toLowerCase() === String(value).toLowerCase()
      },
      { title: "STAFF", dataIndex: "user", key: "user" },
      { title: "ROLE", dataIndex: "role", key: "role" },
      {
        title: "BIN ID",
        dataIndex: "bin_id",
        key: "bin_id",
        filters: binFilterValues.map((value) => ({ text: value, value })),
        onFilter: (value, record) => record.bin_id === value
      },
      {
        title: "STATUS",
        dataIndex: "status",
        key: "status",
        filters: statusFilterValues.map((value) => ({ text: value, value })),
        onFilter: (value, record) => String(record.status || "").toLowerCase() === String(value).toLowerCase(),
        render: (v) => <StatusBadge value={v} />
      },
      { title: "REASON", dataIndex: "reason", key: "reason" }
    ];

    if (currentUserRole !== "admin") {
      return baseColumns;
    }

    return [
      ...baseColumns,
      {
        title: "ACTION",
        key: "action",
        render: (_, record) => {
          const isPending = String(record?.status || "").toLowerCase() === "pending";
          if (!isPending) return "-";

          const isLoading = submitting && approvingUid === record.rfid_uid;

          return (
            <Button
              type="primary"
              size="small"
              loading={isLoading}
              onClick={() => openApproveModal(record.rfid_uid)}
            >
              Approve Access
            </Button>
          );
        }
      }
    ];
  }, [submitting, approvingUid, currentUserRole, binFilterValues]);

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
            data.roleBreakdown.map((roleItem) => (
              <div key={roleItem.name} className="role-split-item">
                <strong>{roleItem.name}</strong>
                <span>Total: {roleItem.total}</span>
                <span>Granted: {roleItem.granted}</span>
                <span>Denied: {roleItem.denied}</span>
              </div>
            ))
          )}
        </div>
      </PageCard>

      <PageCard title="Detailed Access Logs">
        <p className="chart-subtitle">Latest RFID access records for investigation and audit.</p>
        <Input
          placeholder="Search logs..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          style={{ marginBottom: 12, maxWidth: 360 }}
        />
        <Table
          columns={columns}
          dataSource={filteredTableData}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1120 }}
          className="data-table"
        />
      </PageCard>

      <Modal
        title="Approve Pending RFID"
        open={modalOpen}
        onCancel={closeApproveModal}
        onOk={handleApproveSubmit}
        okText="Approve Access"
        confirmLoading={submitting}
        destroyOnClose
      >
        <div className="rfid-approve-form">
          <label htmlFor="rfid-uid-input">RFID UID</label>
          <Input id="rfid-uid-input" value={selectedUid} readOnly />

          <label htmlFor="rfid-name-input">Name</label>
          <Input
            id="rfid-name-input"
            placeholder="Enter staff name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
          />

          <label htmlFor="rfid-role-select">Role</label>
          <Select
            id="rfid-role-select"
            value={role}
            onChange={setRole}
            options={[
              { value: "admin", label: "admin" },
              { value: "supervisor", label: "supervisor" },
              { value: "garbage_collector", label: "garbage_collector" }
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}
