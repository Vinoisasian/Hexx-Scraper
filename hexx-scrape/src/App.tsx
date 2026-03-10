import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layouts/Layout";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Scheduler from "./pages/Scheduler";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="scheduler" element={<Scheduler />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}