import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import AuthGuard from "@/features/auth/AuthGuard";

// Pages
import LoginPage from "@/pages/login/LoginPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import AllPropertiesPage from "@/pages/properties/AllPropertiesPage";
import PendingPropertiesPage from "@/pages/properties/PendingPropertiesPage";
import ApprovedPropertiesPage from "@/pages/properties/ApprovedPropertiesPage";
import DraftPropertiesPage from "@/pages/properties/DraftPropertiesPage";
import RentedPropertiesPage from "@/pages/properties/RentedPropertiesPage";
import RentedExternallyPropertiesPage from "@/pages/properties/RentedExternallyPropertiesPage";
import ExpiredPropertiesPage from "@/pages/properties/ExpiredPropertiesPage";
import RejectedPropertiesPage from "@/pages/properties/RejectedPropertiesPage";
import HiddenPropertiesPage from "@/pages/properties/HiddenPropertiesPage";
import ViolationPropertiesPage from "@/pages/properties/ViolationPropertiesPage";
import PropertyViewPage from "@/pages/properties/PropertyViewPage";
import UsersPage from "@/pages/users/UsersPage";
import RolesPage from "@/pages/users/RolesPage";
import PermissionsPage from "@/pages/users/PermissionsPage";
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
      {/* Public Login Route -> http://localhost:5000 */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />

      {/* Protected Admin Routes */}
      <Route
        element={
          <AuthGuard>
            <AdminLayout />
          </AuthGuard>
        }
      >
        {/* Dashboard Route -> http://localhost:5000/dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* User Management */}
        <Route path="users">
          <Route index element={<UsersPage />} />
          <Route path="members" element={<Navigate to="/users" replace />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="permissions" element={<PermissionsPage />} />
        </Route>

        {/* Property Management */}
        <Route path="properties">
          <Route index element={<AllPropertiesPage />} />
          <Route path="all" element={<AllPropertiesPage />} />
          <Route path="pending" element={<PendingPropertiesPage />} />
          <Route path="approved" element={<ApprovedPropertiesPage />} />
          <Route path="draft" element={<DraftPropertiesPage />} />
          <Route path="rented" element={<RentedPropertiesPage />} />
          <Route path="rented-externally" element={<RentedExternallyPropertiesPage />} />
          <Route path="expired" element={<ExpiredPropertiesPage />} />
          <Route path="rejected" element={<RejectedPropertiesPage />} />
          <Route path="hidden" element={<HiddenPropertiesPage />} />
          <Route path="violation" element={<ViolationPropertiesPage />} />
          <Route path="view" element={<PropertyViewPage />} />
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
