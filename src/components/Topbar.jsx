import { Avatar, Badge, Button, Dropdown, Input } from "antd";
import { BellOutlined, CalendarOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons";
import NotificationsDropdown from "./notificationsDropdown";
import AppHeader from "./AppHeader";

export default function Topbar({
  notifications,
  onOpenTamper,
  onSwitchRole
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <AppHeader
          title="Bin Integrity & Access Control"
          subtitle="Physical Integrity, Secure Access & Tamper Detection"
          compact
          className="topbar-app-header"
        />
      </div>

      <div className="topbar-actions">
        <Input
          className="topbar-search"
          placeholder="Search bins, locations..."
          prefix={<SearchOutlined style={{ color: "#8ea0b8" }} />}
        />
        {onSwitchRole ? (
          <Button className="date-filter switch-role-btn" onClick={onSwitchRole}>
            Switch Role
          </Button>
        ) : null}
        <Button className="date-filter" icon={<CalendarOutlined />}>Live Data</Button>

        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          dropdownRender={() => (
            <NotificationsDropdown notifications={notifications} onViewAll={onOpenTamper} />
          )}
        >
          <button type="button" className="icon-btn" aria-label="notifications">
            <Badge count={notifications.length} size="small" offset={[-2, 4]}>
              <BellOutlined style={{ fontSize: 20 }} />
            </Badge>
          </button>
        </Dropdown>

        <Avatar className="profile-avatar" size={42} icon={<UserOutlined />} />
      </div>
    </header>
  );
}
