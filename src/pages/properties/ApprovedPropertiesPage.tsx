import ListingManagementPage from "@/components/properties/ListingManagementPage";

export default function ApprovedPropertiesPage() {
  return (
    <ListingManagementPage
      key="PUBLISHED"
      initialStatus="PUBLISHED"
      pageTitle="Quản lý tin đã duyệt"
      pageSubtitle="Danh sách các bài đăng đang hiển thị công khai trên nền tảng"
    />
  );
}
