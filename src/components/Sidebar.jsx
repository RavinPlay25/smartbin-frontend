import {
  AlertOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  KeyOutlined,
  LineChartOutlined,
  SettingOutlined
} from "@ant-design/icons";

const menu = [
  { key: "overview", label: "Overview", icon: AppstoreOutlined },
  { key: "stability", label: "Stability Monitoring", icon: LineChartOutlined },
  { key: "tamper", label: "Tamper Detection Analytics", icon: AlertOutlined },
  { key: "rfid", label: "RFID Access Logs", icon: KeyOutlined },
  { key: "settings", label: "Settings", icon: SettingOutlined }
];

export default function Sidebar({ activePage, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BarChartOutlined className="brand-icon" />
        <h1>Smart Waste UI</h1>
      </div>

      <nav className="sidebar-nav">
        {menu.map((item) => {
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
    </aside>
  );
}