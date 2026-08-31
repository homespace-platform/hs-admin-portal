import ListingManagementPage from "@/components/properties/ListingManagementPage";

export default function RejectedPropertiesPage() {
  return (
    <ListingManagementPage
      key="REJECTED"
      initialStatus="REJECTED"
      pageTitle="Quản lý tin bị từ chối"
      pageSubtitle="Theo dõi các bài đăng không đủ tiêu chuẩn duyệt và lý do từ chối"
    />
  );
}
