import ListingManagementPage from "@/components/properties/ListingManagementPage";

export default function RentedPropertiesPage() {
  return (
    <ListingManagementPage
      key="RENTED"
      initialStatus="RENTED"
      pageTitle="Tin đã cho thuê"
      pageSubtitle="Danh sách các bài đăng đã tìm được khách thuê thành công"
    />
  );
}
