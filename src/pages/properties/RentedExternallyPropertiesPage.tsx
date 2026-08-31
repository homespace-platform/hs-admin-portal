import ListingManagementPage from "@/components/properties/ListingManagementPage";

export default function RentedExternallyPropertiesPage() {
  return (
    <ListingManagementPage
      key="RENTED_EXTERNALLY"
      initialStatus="RENTED_EXTERNALLY"
      pageTitle="Tin cho thuê ngoài hệ thống"
      pageSubtitle="Danh sách các bài đăng mà chủ tin tự tìm được khách thuê bên ngoài HomeSpace"
    />
  );
}
