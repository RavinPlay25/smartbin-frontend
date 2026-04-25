import { Layout, Spin } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Chatbot from "./components/Chatbot";
import OverviewPage from "./pages/OverviewPage";
import StabilityPage from "./pages/StabilityPage";
import TamperAnalyticsPage from "./pages/TamperAnalyticsPage";
import RFIDLogsPage from "./pages/RFIDLogsPage";
import SettingsPage from "./pages/SettingsPage";
import UsersRolesPage from "./pages/UsersRolesPage";
import RoleSelection from "./pages/RoleSelection";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import { getBins, getLogs } from "./services/api";
import { buildDashboardModel } from "./utils/dataTransforms";

const { Content } = Layout;

export default function App() {
  const [activePage, setActivePage] = useState("overview");
  const [bins, setBins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  const refreshBins = useCallback(async () => {
    const binsResult = await Promise.allSettled([getBins()]);
    if (binsResult[0].status === "fulfilled") {
      setBins(binsResult[0].value);
    }
  }, []);

  const refreshLogs = useCallback(async () => {
    const logsResult = await Promise.allSettled([getLogs()]);
    if (logsResult[0].status === "fulfilled") {
      setLogs(logsResult[0].value);
    }
  }, []);

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
  const isAdmin = currentUserRole === "admin";
  const roleTitle = isAdmin ? "Admin" : "Supervisor";
  const chatContext = useMemo(() => {
    const activeChart = activePage === "tamper"
      ? "tamper_trend"
      : activePage === "rfid"
        ? "rfid_activity"
        : activePage === "overview"
          ? "service_mode"
          : null;

    const highlightedMetric = activePage === "tamper"
      ? "tamper_count"
      : activePage === "rfid"
        ? "rfid_denied"
        : activePage === "overview"
          ? "service_mode_bins"
          : null;

    return {
      selectedBin: null,
      activeChart,
      visibleRange: null,
      highlightedMetric
    };
  }, [activePage]);

  const supervisorChatContext = useMemo(
    () => ({
      selectedBin: null,
      activeChart: "tamper_trend",
      visibleRange: null,
      highlightedMetric: "tamper_count"
    }),
    []
  );

  const currentPage = useMemo(() => {
    if (activePage === "users" && !isAdmin) return <OverviewPage model={model} onRefreshBins={refreshBins} currentUserRole={currentUserRole} />;
    if (activePage === "stability") return <StabilityPage model={model} />;
    if (activePage === "tamper") return <TamperAnalyticsPage model={model} />;
    if (activePage === "rfid") return <RFIDLogsPage model={model} onRefreshLogs={refreshLogs} currentUserRole={currentUserRole} />;
    if (activePage === "users") return <UsersRolesPage currentUserRole={currentUserRole} />;
    if (activePage === "settings") return <SettingsPage />;
    return <OverviewPage model={model} onRefreshBins={refreshBins} currentUserRole={currentUserRole} />;
  }, [activePage, currentUserRole, isAdmin, model, refreshBins, refreshLogs]);

  if (!currentUserRole) {
    return <RoleSelection onSelectRole={setCurrentUserRole} />;
  }

  if (!isAdmin) {
    return (
      <Layout className="app-root">
        <Layout className="main-layout main-layout-supervisor">
          <Topbar
            notifications={model.notifications}
            onOpenTamper={() => {}}
            onSwitchRole={() => setCurrentUserRole(null)}
          />

          <Content className="content-area">
            {loading ? (
              <div className="loading-center">
                <Spin size="large" />
              </div>
            ) : (
              <SupervisorDashboard model={model} logs={logs} />
            )}
          </Content>
        </Layout>
        <Chatbot context={supervisorChatContext} />
      </Layout>
    );
  }

  return (
    <Layout className="app-root">
      <Sidebar
        activePage={activePage}
        onSelect={setActivePage}
        currentUserRole={currentUserRole}
        roleTitle={roleTitle}
        onSwitchRole={() => {
          setCurrentUserRole(null);
          setActivePage("overview");
        }}
      />

      <Layout className="main-layout">
        <Topbar
          notifications={model.notifications}
          onOpenTamper={() => setActivePage("tamper")}
          onSwitchRole={null}
        />

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
      <Chatbot context={chatContext} />
    </Layout>
  );
}
