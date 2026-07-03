interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
}

export default function LoadingScreen({
  title = "Graduation Thesis",
  subtitle = "Đang tải...",
}: LoadingScreenProps) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-950">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="size-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
