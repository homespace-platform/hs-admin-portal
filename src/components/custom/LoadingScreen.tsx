interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
}

export default function LoadingScreen({
  title = "HomeSpace",
  subtitle = "Đang khởi tạo...",
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
      <div className="size-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}
