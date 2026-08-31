import ListingManagementPage from "@/components/properties/ListingManagementPage";

export default function ViolationPropertiesPage() {
  return (
    <ListingManagementPage
      key="VIOLATION"
      initialStatus="VIOLATION"
      pageTitle="Tin vi phạm quy định"
      pageSubtitle="Danh sách các bài đăng bị khóa do vi phạm chính sách của nền tảng"
    />
  );
}
