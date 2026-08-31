import ListingManagementPage from "@/components/properties/ListingManagementPage";

export default function HiddenPropertiesPage() {
  return (
    <ListingManagementPage
      key="HIDDEN"
      initialStatus="HIDDEN"
      pageTitle="Tin đã ẩn"
      pageSubtitle="Danh sách các bài đăng đang tạm thời bị ẩn khỏi hệ thống"
    />
  );
}
