import { Layout, Spin } from "antd";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import OverviewPage from "./pages/OverviewPage";
import StabilityPage from "./pages/StabilityPage";
import TamperAnalyticsPage from "./pages/TamperAnalyticsPage";
import RFIDLogsPage from "./pages/RFIDLogsPage";
import SettingsPage from "./pages/SettingsPage";
import { getBins, getLogs } from "./services/api";
import { buildDashboardModel } from "./utils/dataTransforms";

const { Content } = Layout;

export default function App() {
  const [activePage, setActivePage] = useState("overview");
  const [bins, setBins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const [binsResult, logsResult] = await Promise.allSettled([getBins(), getLogs()]);
      if (!mounted) return;

      if (binsResult.status === "fulfilled") {
        setBins(binsResult.value);
      }

      if (logsResult.status === "fulfilled") {
        setLogs(logsResult.value);
      }

      setLoading(false);
    };

    load();
    const interval = setInterval(load, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const model = useMemo(() => buildDashboardModel(bins, logs), [bins, logs]);

  const currentPage = useMemo(() => {
    if (activePage === "stability") return <StabilityPage model={model} />;
    if (activePage === "tamper") return <TamperAnalyticsPage model={model} />;
    if (activePage === "rfid") return <RFIDLogsPage model={model} />;
    if (activePage === "settings") return <SettingsPage />;
    return <OverviewPage model={model} />;
  }, [activePage, model]);

  return (
    <Layout className="app-root">
      <Sidebar activePage={activePage} onSelect={setActivePage} />

      <Layout className="main-layout">
        <Topbar notifications={model.notifications} onOpenTamper={() => setActivePage("tamper")} />

        <Content className="content-area">
          {loading ? (
            <div className="loading-center">
              <Spin size="large" />
            </div>
          ) : (
            currentPage
          )}
        </Content>
      </Layout>
    </Layout>
  );
}