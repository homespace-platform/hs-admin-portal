import { useState } from "react";
import { Bell } from "lucide-react";

export default function NotificationsSection() {
  const [notifyPendingPosts, setNotifyPendingPosts] = useState(true);
  const [notifyComplaints, setNotifyComplaints] = useState(true);
  const [notifySystemErrors, setNotifySystemErrors] = useState(true);

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in-50 duration-200">
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-primary" />
          <span>Cài đặt thông báo quản trị</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          Chọn các sự kiện hệ thống bạn muốn nhận thông báo tức thời.
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
            checked={notifyPendingPosts}
            onChange={(e) => setNotifyPendingPosts(e.target.checked)}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/60">
          <div>
            <p className="text-xs font-semibold text-foreground">Khiếu nại & Tranh chấp hợp đồng</p>
            <p className="text-[11px] text-muted-foreground">Cảnh báo ngay khi có tranh chấp tiền cọc hoặc tố cáo gian lận</p>
          </div>
          <input
            type="checkbox"
            checked={notifyComplaints}
            onChange={(e) => setNotifyComplaints(e.target.checked)}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-xs font-semibold text-foreground">Cảnh báo lỗi Gateway & Blockchain RPC</p>
            <p className="text-[11px] text-muted-foreground">Thông báo sự cố kết nối mạng lưới Smart Contract</p>
          </div>
          <input
            type="checkbox"
            checked={notifySystemErrors}
            onChange={(e) => setNotifySystemErrors(e.target.checked)}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
