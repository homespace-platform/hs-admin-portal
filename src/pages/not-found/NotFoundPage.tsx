import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 select-none">
      <div className="max-w-md w-full space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto text-2xl font-black font-heading">
          404
        </div>

        <h2 className="text-xl font-bold font-heading text-foreground">
          Trang không tồn tại
        </h2>
        <p className="text-xs text-muted-foreground">
          Đường dẫn quản trị bạn truy cập không tồn tại hoặc đã được di dời.
        </p>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm shadow-primary/25"
        >
          <Home className="w-4 h-4" />
          <span>Về Bảng điều khiển</span>
        </Link>
      </div>
    </div>
  );
}
