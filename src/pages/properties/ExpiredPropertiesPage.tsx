import ListingManagementPage from "@/components/properties/ListingManagementPage";

export default function ExpiredPropertiesPage() {
  return (
    <ListingManagementPage
      key="EXPIRED"
      initialStatus="EXPIRED"
      pageTitle="Tin đã hết hạn"
      pageSubtitle="Danh sách các bài đăng đã quá hạn hiển thị trên hệ thống"
    />
  );
}
