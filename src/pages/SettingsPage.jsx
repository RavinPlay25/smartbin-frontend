import { Button } from "antd";
import PageCard from "../components/PageCard";

export default function SettingsPage() {
  return (
    <div className="page-shell">
      <h2 className="page-title">Settings</h2>
      <PageCard title="System Preferences">
        <div className="settings-wrap">
          <p>Notification thresholds, export rules, and user preferences will appear here.</p>
          <div className="settings-actions">
            <Button className="ghost-btn">Manage Alerts</Button>
            <Button type="primary" className="save-btn">Save Settings</Button>
          </div>
        </div>
      </PageCard>
    </div>
  );
}