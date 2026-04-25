import { Button, Card } from "antd";
import AppHeader from "../components/AppHeader";

export default function RoleSelection({ onSelectRole }) {
  return (
    <div className="role-selection-page">
      <div className="role-selection-content">
        <AppHeader
          title="Bin Integrity & Access Control"
          subtitle="Physical Integrity, Secure Access & Tamper Detection"
          className="landing-header"
        />
        <p>Select your dashboard view</p>

        <div className="role-cards-grid">
          <Card className="role-card" bordered={false}>
            <div className="role-icon" role="img" aria-label="Admin">
              🛠️
            </div>
            <h2>Admin</h2>
            <p>Manage users, roles, RFID access, bins, and system controls.</p>
            <Button type="primary" className="role-enter-btn" onClick={() => onSelectRole("admin")}>
              Enter Admin Dashboard
            </Button>
          </Card>

          <Card className="role-card" bordered={false}>
            <div className="role-icon" role="img" aria-label="Supervisor">
              👷
            </div>
            <h2>Supervisor</h2>
            <p>Monitor bins, alerts, service status, and day-to-day operations.</p>
            <Button className="role-enter-btn role-enter-btn-secondary" onClick={() => onSelectRole("supervisor")}>
              Enter Supervisor Dashboard
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
