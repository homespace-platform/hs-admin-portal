import type { ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import AuthGuard from "@/features/auth/AuthGuard";
import RequirePermission from "@/features/auth/RequirePermission";
import { PERMISSIONS, ROUTE_PERMISSIONS, type RouteKey } from "@/config/permissions";

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
import KycQueuePage from "@/pages/users/KycQueuePage";
import RolesPage from "@/pages/users/RolesPage";
import PermissionsPage from "@/pages/users/PermissionsPage";
import ComplaintsPage from "@/pages/operations/ComplaintsPage";
import NewsListPage from "@/pages/operations/NewsListPage";
import NewsManagementPage from "@/pages/operations/NewsManagementPage";
import KnowledgeManagementPage from "@/pages/operations/KnowledgeManagementPage";
import NotificationsPage from "@/pages/operations/NotificationsPage";
import NotificationCenterPage from "@/pages/notifications/NotificationsPage";
import PersonalNotificationsPage from "@/pages/notifications/PersonalNotificationsPage";
import SystemAlertsPage from "@/pages/operations/SystemAlertsPage";
import BlockchainExplorerPage from "@/pages/blockchain/BlockchainExplorerPage";
import StatisticsPage from "@/pages/analytics/StatisticsPage";
import AiForecastPage from "@/pages/analytics/AiForecastPage";
import SettingsRedirect from "@/pages/settings/SettingsPage";
import KycPage from "@/pages/kyc/KycPage";
import NotFoundPage from "@/pages/not-found/NotFoundPage";

// Contract Pages
import ContractTemplatesPage from "@/pages/contracts/ContractTemplatesPage";
import ContractTemplateDetailPage from "@/pages/contracts/ContractTemplateDetailPage";
import ContractFieldsPage from "@/pages/contracts/ContractFieldsPage";
import ContractGuidePage from "@/pages/contracts/ContractGuidePage";
import ContractsListPage from "@/pages/contracts/ContractsListPage";

// Gate with the shared route map; without children it guards nested routes via <Outlet />.
const guard = (key: RouteKey, page?: ReactNode) => (
  <RequirePermission {...ROUTE_PERMISSIONS[key]}>{page}</RequirePermission>
);

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
        <Route path="/operations/nearby" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={guard("/dashboard", <DashboardPage />)} />

        {/* Admin pending-review notification center */}
        <Route path="/notifications" element={<RequirePermission permission={PERMISSIONS.LISTING_VIEW}><NotificationCenterPage /></RequirePermission>} />
        <Route path="/notifications/feed" element={<PersonalNotificationsPage />} />

        {/* User Management */}
        <Route path="users">
          <Route index element={guard("/users", <UsersPage />)} />
          <Route path="kyc" element={guard("/users/kyc", <KycQueuePage />)} />
          <Route path="members" element={<Navigate to="/users" replace />} />
          <Route path="roles" element={guard("/users/roles", <RolesPage />)} />
          <Route path="permissions" element={guard("/users/permissions", <PermissionsPage />)} />
        </Route>

        {/* Property Management */}
        <Route path="properties" element={guard("/properties")}>
          <Route index element={<AllPropertiesPage />} />
          <Route path="all" element={<AllPropertiesPage />} />
          <Route path="pending" element={<PendingPropertiesPage />} />
          <Route path="approved" element={<ApprovedPropertiesPage />} />
          <Route path="draft" element={<DraftPropertiesPage />} />
          <Route path="rented" element={<RentedPropertiesPage />} />
          <Route
            path="rented-externally"
            element={<RentedExternallyPropertiesPage />}
          />
          <Route path="expired" element={<ExpiredPropertiesPage />} />
          <Route path="rejected" element={<RejectedPropertiesPage />} />
          <Route path="hidden" element={<HiddenPropertiesPage />} />
          <Route path="violation" element={<ViolationPropertiesPage />} />
          <Route path="view" element={<PropertyViewPage />} />
        </Route>

        {/* Contract Management */}
        <Route path="contracts">
          <Route path="guide" element={<ContractGuidePage/>}/>
          <Route
            index
            element={<Navigate to="/contracts/templates" replace />}
          />
          <Route path="templates" element={guard("/contracts/templates")}>
            <Route index element={<ContractTemplatesPage />} />
            <Route path=":templateId" element={<ContractTemplateDetailPage />} />
          </Route>
          <Route path="fields" element={guard("/contracts/fields", <ContractFieldsPage />)} />
          <Route path="all" element={guard("/contracts/all", <ContractsListPage />)} />
        </Route>

        {/* Operations & Support */}
        <Route path="operations">
          <Route
            index
            element={<Navigate to="/operations/complaints" replace />}
          />
          <Route path="complaints" element={guard("/operations/complaints", <ComplaintsPage />)} />
          <Route path="system-alerts" element={guard("/operations/system-alerts", <SystemAlertsPage />)} />
          <Route path="news">
            <Route index element={<NewsListPage />} />
            <Route path="create" element={<NewsManagementPage />} />
            <Route path=":newsId/edit" element={<NewsManagementPage />} />
          </Route>
          <Route path="knowledge" element={<KnowledgeManagementPage />} />
          <Route path="notifications" element={guard("/operations/notifications", <NotificationsPage />)} />
        </Route>

        {/* Blockchain Explorer */}
        <Route path="blockchain" element={guard("/blockchain", <BlockchainExplorerPage />)} />

        {/* Analytics & Reports */}
        <Route path="analytics">
          <Route
            index
            element={<Navigate to="/analytics/statistics" replace />}
          />
          <Route path="statistics" element={guard("/analytics/statistics", <StatisticsPage />)} />
          <Route path="ai-forecast" element={<AiForecastPage />} />
        </Route>

        {/* Settings */}
        <Route path="settings" element={<SettingsRedirect />} />
        <Route path="settings/:section" element={<SettingsRedirect />} />

        {/* Standalone VNPT eKYC flow (login-protected by AuthGuard above) */}
        <Route path="/kyc" element={<KycPage />} />

        {/* 404 Inside Admin Layout */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
