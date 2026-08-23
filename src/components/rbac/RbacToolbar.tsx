import { Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RbacToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  loading: boolean;
  onRefresh: () => void;
}

export default function RbacToolbar({
  searchQuery,
  onSearchChange,
  placeholder,
  loading,
  onRefresh,
}: RbacToolbarProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
      <div className="relative w-full md:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 rounded-xl bg-muted/40 border-border text-xs sm:text-sm"
        />
      </div>
      <Button
        variant="outline"
        size="default"
        onClick={onRefresh}
        disabled={loading}
        className="h-10 px-3.5 rounded-xl border-border hover:bg-muted text-xs font-semibold gap-1.5 cursor-pointer"
        title="Làm mới danh sách"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
        <span className="hidden sm:inline">Làm mới</span>
      </Button>
    </div>
  );
}
