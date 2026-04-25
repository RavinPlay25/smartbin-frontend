import { Alert, Button, Spin, Table, Tag } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import PageCard from "../components/PageCard";
import { getRoles, getUsers } from "../services/api";

const columns = [
  { title: "NAME", dataIndex: "name", key: "name" },
  { title: "RFID UID", dataIndex: "rfid_uid", key: "rfid_uid" },
  {
    title: "ROLE",
    dataIndex: "role",
    key: "role",
    render: (value) => <Tag color="blue">{value || "unassigned"}</Tag>
  },
  {
    title: "STATUS",
    dataIndex: "status",
    key: "status",
    render: (value) => (
      <Tag color={value === "active" ? "green" : "red"}>{(value || "unknown").toUpperCase()}</Tag>
    )
  }
];

export default function UsersRolesPage({ currentUserRole }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const [usersResult, rolesResult] = await Promise.allSettled([getUsers(), getRoles()]);

    if (usersResult.status === "fulfilled") {
      setUsers(usersResult.value);
    } else {
      setUsers([]);
    }

    if (rolesResult.status === "fulfilled") {
      setRoles(rolesResult.value);
    } else {
      setRoles([]);
    }

    if (usersResult.status === "rejected" || rolesResult.status === "rejected") {
      setError("Failed to load users/roles data.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (currentUserRole !== "admin") return;
    loadData();
  }, [currentUserRole, loadData]);

  const roleSummary = useMemo(
    () => roles.map((role) => role?._id).filter(Boolean),
    [roles]
  );

  if (currentUserRole !== "admin") {
    return null;
  }

  return (
    <div className="page-shell">
      <div className="page-head-row">
        <h2 className="page-title">Users & Roles</h2>
        <Button type="primary" className="save-btn">Add User</Button>
      </div>

      <PageCard title="User Access Management">
        <p className="chart-subtitle">Manage RFID users, assign roles, and control access status.</p>
        {roleSummary.length > 0 && (
          <p className="chart-subtitle">Available roles: {roleSummary.join(", ")}</p>
        )}
        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 12 }} />}
        {loading ? (
          <div className="loading-center">
            <Spin size="large" />
          </div>
        ) : (
        <Table
          columns={columns}
          dataSource={users}
          rowKey={(record) => record._id || record.rfid_uid}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: "No users yet." }}
          className="data-table"
        />
        )}
      </PageCard>
    </div>
  );
}
