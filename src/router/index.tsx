import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import AuthGuard from "@/features/auth/AuthGuard";

// Pages
import LoginPage from "@/pages/login/LoginPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import PendingPropertiesPage from "@/pages/properties/PendingPropertiesPage";
import ApprovedPropertiesPage from "@/pages/properties/ApprovedPropertiesPage";
import RejectedPropertiesPage from "@/pages/properties/RejectedPropertiesPage";
import MembersPage from "@/pages/users/MembersPage";
import AdminsPage from "@/pages/users/AdminsPage";
import ComplaintsPage from "@/pages/operations/ComplaintsPage";
import NewsManagementPage from "@/pages/operations/NewsManagementPage";
import BlockchainExplorerPage from "@/pages/blockchain/BlockchainExplorerPage";
import StatisticsPage from "@/pages/analytics/StatisticsPage";
import AiForecastPage from "@/pages/analytics/AiForecastPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import NotFoundPage from "@/pages/not-found/NotFoundPage";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Admin Routes */}
      <Route
        path="/"
        element={
          <AuthGuard>
            <AdminLayout />
          </AuthGuard>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />

        {/* Property Management */}
        <Route path="properties">
          <Route index element={<Navigate to="/properties/pending" replace />} />
          <Route path="pending" element={<PendingPropertiesPage />} />
          <Route path="approved" element={<ApprovedPropertiesPage />} />
          <Route path="rejected" element={<RejectedPropertiesPage />} />
        </Route>

        {/* User Management */}
        <Route path="users">
          <Route index element={<Navigate to="/users/members" replace />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="admins" element={<AdminsPage />} />
        </Route>

        {/* Operations & Support */}
        <Route path="operations">
          <Route index element={<Navigate to="/operations/complaints" replace />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="news" element={<NewsManagementPage />} />
        </Route>

        {/* Blockchain Explorer */}
        <Route path="blockchain" element={<BlockchainExplorerPage />} />

        {/* Analytics & Reports */}
        <Route path="analytics">
          <Route index element={<Navigate to="/analytics/statistics" replace />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="ai-forecast" element={<AiForecastPage />} />
        </Route>

        {/* Settings */}
        <Route path="settings" element={<SettingsPage />} />

        {/* 404 Inside Admin Layout */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
