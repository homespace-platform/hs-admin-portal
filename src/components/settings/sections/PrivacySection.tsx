import { useState } from "react";
import { Lock } from "lucide-react";

export default function PrivacySection() {
  const [activityLog, setActivityLog] = useState(true);

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in-50 duration-200">
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-primary" />
          <span>Quyền riêng tư & Nhật ký hệ thống</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          Quản lý quyền hiển thị thông tin và nhật ký thao tác quản trị viên.
        </p>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between py-2 border-b border-border/60">
          <div>
            <p className="text-xs font-semibold text-foreground">Ghi nhật ký hoạt động quản trị</p>
            <p className="text-[11px] text-muted-foreground">Lưu vết các thao tác duyệt tin, khóa tài khoản và xử lý khiếu nại</p>
          </div>
          <input
            type="checkbox"
            checked={activityLog}
            onChange={(e) => setActivityLog(e.target.checked)}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-xs font-semibold text-foreground">Ẩn email cá nhân với người dùng</p>
            <p className="text-[11px] text-muted-foreground">Chỉ hiển thị tên quản trị viên trên các thông báo công khai</p>
          </div>
          <input
            type="checkbox"
            defaultChecked
            className="w-4 h-4 accent-primary cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
