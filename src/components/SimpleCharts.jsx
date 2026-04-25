import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function ChartEmpty({ message = "No data available for this chart yet." }) {
  return <div className="chart-empty">{message}</div>;
}

const baseTooltipStyle = {
  borderRadius: 10,
  border: "1px solid #d7e1eb",
  backgroundColor: "#ffffff",
  color: "#1d3d62"
};

export function SystemHealthTrendChart({ data, height = 310 }) {
  if (!data?.length) return <ChartEmpty message="No health trend data yet." />;

  return (
    <div className="chart-wrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4edf6" />
          <XAxis dataKey="time" tick={{ fill: "#5f7898", fontSize: 12 }} label={{ value: "Time", position: "insideBottom", offset: -5 }} />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#5f7898", fontSize: 12 }}
            label={{ value: "Health Score", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            contentStyle={baseTooltipStyle}
            formatter={(value) => [`${value}`, "Health Score"]}
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload;
              return item ? `${item.time} | ${item.note}` : "";
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="score" stroke="#0ea5a8" strokeWidth={3} dot={{ r: 3 }} name="System Health" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EventBreakdownChart({ data, height = 310 }) {
  const prepared = (data || []).filter((item) => item.value > 0);
  if (!prepared.length) return <ChartEmpty message="No event logs available for breakdown." />;

  return (
    <div className="chart-wrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={prepared}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={3}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {prepared.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={baseTooltipStyle} formatter={(value) => [value, "Count"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TamperHourlyChart({ data, height = 300 }) {
  const hasData = (data || []).some((item) => item.events > 0);
  if (!hasData) return <ChartEmpty message="No tamper events recorded in hourly timeline." />;

  return (
    <div className="chart-wrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4edf6" />
          <XAxis dataKey="hour" tick={{ fill: "#5f7898", fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: "#5f7898", fontSize: 12 }} label={{ value: "Tamper Events", angle: -90, position: "insideLeft" }} />
          <Tooltip
            contentStyle={baseTooltipStyle}
            formatter={(value) => [value, "Tamper events"]}
            labelFormatter={(label) => `Hour: ${label}`}
          />
          <Legend />
          <Bar dataKey="events" name="Tamper Events" fill="#ef4444" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopBinsTamperChart({ data, height = 300 }) {
  if (!data?.length) return <ChartEmpty message="No tamper bins to rank yet." />;

  return (
    <div className="chart-wrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4edf6" />
          <XAxis type="number" allowDecimals={false} tick={{ fill: "#5f7898", fontSize: 12 }} label={{ value: "Tamper Event Count", position: "insideBottom", offset: -5 }} />
          <YAxis type="category" dataKey="bin_id" width={90} tick={{ fill: "#5f7898", fontSize: 12 }} />
          <Tooltip contentStyle={baseTooltipStyle} formatter={(value) => [value, "Tamper events"]} />
          <Legend />
          <Bar dataKey="count" name="Tamper Events" fill="#ef4444" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RoleBreakdownChart({ data, height = 300 }) {
  if (!data?.length) return <ChartEmpty message="No RFID role data available." />;

  const colors = ["#0ea5a8", "#22c55e", "#facc15", "#f97316", "#1d4ed8", "#ef4444"];

  return (
    <div className="chart-wrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            innerRadius={68}
            outerRadius={110}
            paddingAngle={3}
            label={({ name, value }) => `${name}: ${value}`}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={baseTooltipStyle}
            formatter={(value, _, item) => {
              const payload = item?.payload;
              return [`${value} total (G:${payload?.granted || 0} D:${payload?.denied || 0})`, payload?.name || "Role"];
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RfidResultTrendChart({ data, height = 300 }) {
  const hasData = (data || []).some((item) => item.granted > 0 || item.denied > 0);
  if (!hasData) return <ChartEmpty message="No RFID access results recorded by hour." />;

  return (
    <div className="chart-wrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4edf6" />
          <XAxis dataKey="hour" tick={{ fill: "#5f7898", fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: "#5f7898", fontSize: 12 }} label={{ value: "RFID Events", angle: -90, position: "insideLeft" }} />
          <Tooltip
            contentStyle={baseTooltipStyle}
            formatter={(value, name) => [value, name]}
            labelFormatter={(label, payload) => {
              const info = payload?.[0]?.payload;
              return `Hour ${label} | Total scans: ${info?.total || 0}`;
            }}
          />
          <Legend />
          <Bar dataKey="granted" stackId="rfid" fill="#22c55e" name="Granted" radius={[4, 4, 0, 0]} />
          <Bar dataKey="denied" stackId="rfid" fill="#ef4444" name="Denied" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RfidScansByHourChart({ data, height = 280 }) {
  const hasData = (data || []).some((item) => item.total > 0);
  if (!hasData) return <ChartEmpty message="No RFID scans recorded by hour." />;

  return (
    <div className="chart-wrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4edf6" />
          <XAxis dataKey="hour" tick={{ fill: "#5f7898", fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: "#5f7898", fontSize: 12 }} label={{ value: "Total Scans", angle: -90, position: "insideLeft" }} />
          <Tooltip contentStyle={baseTooltipStyle} formatter={(value) => [value, "Total scans"]} />
          <Legend />
          <Bar dataKey="total" name="Total Scans" fill="#0ea5a8" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StabilityTrendChart({ data, height = 300 }) {
  const hasData = (data || []).some((item) => item.stable > 0 || item.tamper > 0);
  if (!hasData) return <ChartEmpty message="No stability/tamper event trend recorded by hour." />;

  return (
    <div className="chart-wrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4edf6" />
          <XAxis dataKey="hour" tick={{ fill: "#5f7898", fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: "#5f7898", fontSize: 12 }} label={{ value: "Event Count", angle: -90, position: "insideLeft" }} />
          <Tooltip contentStyle={baseTooltipStyle} />
          <Legend />
          <Bar dataKey="stable" name="Stable Events" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="tamper" name="Tamper Events" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StableVsTamperChart({ data, height = 250 }) {
  const hasData = (data || []).some((item) => item.count > 0);
  if (!hasData) return <ChartEmpty message="No stable/tamper events available yet." />;

  return (
    <div className="chart-wrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4edf6" />
          <XAxis dataKey="name" tick={{ fill: "#5f7898", fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: "#5f7898", fontSize: 12 }} label={{ value: "Count", angle: -90, position: "insideLeft" }} />
          <Tooltip contentStyle={baseTooltipStyle} />
          <Legend />
          <Bar dataKey="count" name="Events">
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BinStateSummaryChart({ data, height = 300 }) {
  const hasData = (data || []).some((item) => item.count > 0);
  if (!hasData) return <ChartEmpty message="No bin state summary data available." />;

  return (
    <div className="chart-wrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4edf6" />
          <XAxis dataKey="name" tick={{ fill: "#5f7898", fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: "#5f7898", fontSize: 12 }} label={{ value: "Count", angle: -90, position: "insideLeft" }} />
          <Tooltip contentStyle={baseTooltipStyle} formatter={(value) => [value, "Count"]} />
          <Legend />
          <Bar dataKey="count" name="Bins / Events">
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

