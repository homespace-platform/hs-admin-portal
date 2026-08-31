import ListingManagementPage from "@/components/properties/ListingManagementPage";

export default function DraftPropertiesPage() {
  return (
    <ListingManagementPage
      key="DRAFT"
      initialStatus="DRAFT"
      pageTitle="Tin đăng nháp"
      pageSubtitle="Danh sách các bài đăng đang được chủ nhà lưu tạm chưa gửi duyệt"
    />
  );
}
