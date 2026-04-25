import {
  AlertOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  LogoutOutlined,
  KeyOutlined,
  LineChartOutlined,
  TeamOutlined,
  SettingOutlined
} from "@ant-design/icons";

const menu = [
  { key: "overview", label: "Overview", icon: AppstoreOutlined },
  { key: "stability", label: "Stability Monitoring", icon: LineChartOutlined },
  { key: "tamper", label: "Tamper Detection Analytics", icon: AlertOutlined },
  { key: "rfid", label: "RFID Access Logs", icon: KeyOutlined },
  { key: "users", label: "Users & Roles", icon: TeamOutlined, adminOnly: true },
  { key: "settings", label: "Settings", icon: SettingOutlined }
];

export default function Sidebar({ activePage, onSelect, currentUserRole, roleTitle, onSwitchRole }) {
  const visibleMenu = menu.filter((item) => !item.adminOnly || currentUserRole === "admin");

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BarChartOutlined className="brand-icon" />
        <h1>Smart Waste UI</h1>
      </div>

      <nav className="sidebar-nav">
        {visibleMenu.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.key;

          return (
            <button
              key={item.key}
              type="button"
              className={`sidebar-item ${active ? "active" : ""}`}
              onClick={() => onSelect(item.key)}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-role-pill">{roleTitle} View</div>
        <button type="button" className="sidebar-switch-role" onClick={onSwitchRole}>
          <LogoutOutlined />
          <span>Switch Role</span>
        </button>
      </div>
    </aside>
  );
}
