import { AlertOutlined, ClockCircleOutlined } from "@ant-design/icons";

export default function NotificationsDropdown({ notifications, onViewAll }) {
  return (
    <div className="notifications-popover">
      <div className="notifications-header">
        <h3>Urgent Alerts</h3>
        <span className="notif-count">{notifications.length}</span>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="notif-empty">No urgent alerts right now</div>
        ) : (
          notifications.map((item) => (
            <div key={item.id} className="notif-item">
              <div className="notif-icon-wrap">
                <AlertOutlined />
              </div>
              <div className="notif-content">
                <h4>{item.title}</h4>
                <p>Bin ID: {item.bin}</p>
                <span><ClockCircleOutlined /> {item.time}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <button type="button" className="notif-view-all" onClick={onViewAll}>
        View all tamper analytics
      </button>
    </div>
  );
}