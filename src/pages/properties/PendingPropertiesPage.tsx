import ListingManagementPage from "@/components/properties/ListingManagementPage";

export default function PendingPropertiesPage() {
  return (
    <ListingManagementPage
      key="PENDING_REVIEW"
      initialStatus="PENDING_REVIEW"
      pageTitle="Quản lý tin chờ duyệt"
      pageSubtitle="Duyệt bài đăng mới và kiểm tra tính xác thực trước khi công khai"
    />
  );
}
