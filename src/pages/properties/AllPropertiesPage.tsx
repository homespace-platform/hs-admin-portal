import ListingManagementPage from "@/components/properties/ListingManagementPage";

export default function AllPropertiesPage() {
  return (
    <ListingManagementPage
      key="ALL"
      initialStatus={undefined}
      pageTitle="Tất cả tin đăng"
      pageSubtitle="Toàn bộ danh sách bài đăng cho thuê trên toàn hệ thống"
    />
  );
}
