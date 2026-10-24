import ContractModuleNav,{useAgreementKind} from "./ContractModuleNav";

export default function ContractGuidePage() {
  const {kind,changeKind}=useAgreementKind();
  return <div className="space-y-6">
    <ContractModuleNav kind={kind} onKindChange={changeKind}/>
    <h1 className="text-2xl font-bold">Hướng dẫn quản lý hợp đồng và đặt cọc</h1>
    <section className="space-y-3 rounded-2xl border bg-card p-5">
      <h2 className="font-semibold">Thiết lập lần đầu</h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm"><li>Chọn Hợp đồng đặt cọc → Mẫu Word & phiên bản → Nhập 3 mẫu cọc có sẵn. Hệ thống tạo bản nháp, không tự ghi đè mẫu đã có.</li><li>Kiểm tra đúng HOUSE / APARTMENT / ROOM và đúng loại văn bản. Mỗi cặp loại văn bản + loại nhà có một mẫu hệ thống.</li><li>Nhà nguyên căn có 41 mã D2; căn hộ/phòng trọ có 42, thêm số căn/phòng. Đối chiếu mã thiếu/lạ và xem PDF thử trước khi phát hành.</li><li>Phát hành riêng từng mẫu. Khi thay Word, thêm phiên bản vào mẫu hiện có, kiểm tra và phát hành phiên bản mới.</li></ol>
    </section>
    <section className="space-y-3 rounded-2xl border bg-card p-5">
      <h2 className="font-semibold">Hai luồng đều ký hai văn bản</h2>
      <p className="text-sm">Vào sau: xác nhận cọc → ký cọc (chủ nhà rồi khách) → đến ngày thuê thanh toán tháng đầu → ký thuê. Vào ngay: xác nhận khoản gộp → ký cọc → ký thuê. Mỗi bên ký riêng hai PDF; ký cọc không kích hoạt thuê.</p>
      <p className="text-sm">Miễn cọc 0 đồng không phát sinh hợp đồng nhận tiền cọc. Giá trị cọc trên văn bản lấy dòng DEPOSIT, không lấy toàn bộ khoản gộp.</p>
    </section>
    <section className="space-y-3 rounded-2xl border bg-card p-5">
      <h2 className="font-semibold">Kiểm tra lỗi và hỗ trợ</h2>
      <ul className="list-disc space-y-2 pl-5 text-sm"><li>Thiếu mẫu: phát hành đúng mẫu cọc theo loại nhà; khách dùng nút Kiểm tra / tạo lại tài liệu cọc hoặc chờ job thử lại.</li><li>Thiếu dữ liệu: bổ sung hồ sơ thật, mã căn/phòng và tài khoản. Không điền tên hay tiền giả vào Word.</li><li>Không ký được: kiểm tra chế độ SMARTCA, kết nối VNPT, KYC/CCCD và chứng thư của đúng người ký. Người ký tự xác nhận trong ứng dụng SmartCA.</li><li>Đã có kết quả VNPT nhưng chưa lưu PDF: theo dõi embedding/retry; không tạo lại giao dịch ký khi kết quả cũ chưa rõ.</li><li>Hết hạn khách ký cọc: chủ nhà có nút mở lại hạn tại hồ sơ. Không tự mất cọc hoặc đảo xác nhận tiền vì lỗi ký.</li><li>Hồ sơ đã phát hành giữ nguyên snapshot và phiên bản. Admin phát hành mẫu mới không sửa hồi tố các PDF đã ký.</li></ul>
    </section>
  </div>;
}
