import { Bell } from "lucide-react";

export default function NotificationsSection() {
  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in-50 duration-200">
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-primary" />
          <span>Cài đặt thông báo quản trị</span>
          <span className="ml-2 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
            Sắp ra mắt
          </span>
        </h3>
        <p className="text-xs text-muted-foreground">
          Tính năng tùy chỉnh thông báo đang được phát triển.
        </p>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between py-2 border-b border-border/60">
          <div>
            <p className="text-xs font-semibold text-foreground">Tin đăng mới cần kiểm duyệt</p>
            <p className="text-[11px] text-muted-foreground">Nhận thông báo khi chủ nhà gửi tin đăng nhà ở mới</p>
          </div>
          <input
            type="checkbox"
            disabled
            aria-label="Tin đăng mới cần kiểm duyệt — Sắp ra mắt"
            className="w-4 h-4 accent-primary cursor-not-allowed opacity-50"
          />
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/60">
          <div>
            <p className="text-xs font-semibold text-foreground">Khiếu nại & Tranh chấp hợp đồng</p>
            <p className="text-[11px] text-muted-foreground">Cảnh báo ngay khi có tranh chấp tiền cọc hoặc tố cáo gian lận</p>
          </div>
          <input
            type="checkbox"
            disabled
            aria-label="Khiếu nại và tranh chấp hợp đồng — Sắp ra mắt"
            className="w-4 h-4 accent-primary cursor-not-allowed opacity-50"
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-xs font-semibold text-foreground">Cảnh báo lỗi Gateway & Blockchain RPC</p>
            <p className="text-[11px] text-muted-foreground">Thông báo sự cố kết nối mạng lưới Smart Contract</p>
          </div>
          <input
            type="checkbox"
            disabled
            aria-label="Cảnh báo lỗi Gateway và Blockchain RPC — Sắp ra mắt"
            className="w-4 h-4 accent-primary cursor-not-allowed opacity-50"
          />
        </div>
      </div>
    </div>
  );
}
