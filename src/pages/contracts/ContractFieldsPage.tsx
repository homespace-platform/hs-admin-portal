import { useEffect, useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  Copy,
  Check,
  Code2,
  Table as TableIcon,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { adminContractService } from "@/services/admin-contract.service";
import type { TemplateFieldDefinition } from "@/types/contract.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContractFieldsPage() {
  const [fields, setFields] = useState<TemplateFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    setLoading(true);
    try {
      const data = await adminContractService.getCatalogFields();
      setFields(data || []);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Không thể tải danh mục mã trường"
      );
    } finally {
      setLoading(false);
    }
  };

  const groups = useMemo(() => {
    const set = new Set<string>();
    fields.forEach((f) => set.add(f.group));
    return Array.from(set);
  }, [fields]);

  const filteredFields = useMemo(() => {
    return fields.filter((f) => {
      const matchSearch =
        !search.trim() ||
        f.key.toLowerCase().includes(search.toLowerCase()) ||
        f.label.toLowerCase().includes(search.toLowerCase()) ||
        f.description.toLowerCase().includes(search.toLowerCase());
      const matchGroup = selectedGroup === "ALL" || f.group === selectedGroup;
      return matchSearch && matchGroup;
    });
  }, [fields, search, selectedGroup]);

  const copyToClipboard = (key: string) => {
    const textToCopy = `{{${key}}}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(key);
    toast.success(`Đã sao chép: ${textToCopy}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-primary" />
            Từ điển mã trường hợp đồng
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Danh mục các placeholder được backend hỗ trợ để chèn vào file mẫu
            Word (.docx)
          </p>
        </div>
      </div>

      {/* Guide Card */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-2 text-xs sm:text-sm text-foreground/90">
            <h3 className="font-semibold text-foreground text-sm sm:text-base">
              Quy tắc soạn file mẫu Word (.docx) cho Quản trị viên
            </h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                Đặt placeholder trong dấu ngoặc nhọn kép, ví dụ:{" "}
                <code className="px-1.5 py-0.5 rounded bg-background border font-mono text-primary font-semibold">
                  &#123;&#123;landlord.fullName&#125;&#125;
                </code>
              </li>
              <li>
                Với bảng phụ phí dịch vụ động, đặt thẻ{" "}
                <code className="px-1.5 py-0.5 rounded bg-background border font-mono text-primary font-semibold">
                  &#123;&#123;#chargesTable&#125;&#125;
                </code>{" "}
                vào đúng vị trí muốn sinh bảng. Hệ thống sẽ tự động tạo bảng các
                khoản phí (điện, nước, internet, xe...) theo thỏa thuận.
              </li>
              <li>
                Hệ thống sẽ <strong>tự động quét và phát hiện lỗi chính tả</strong>{" "}
                khi tải file lên. Những mã không nằm trong danh mục này sẽ bị báo lỗi.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã trường, tên nhãn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>

        {/* Group pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Button
            variant={selectedGroup === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedGroup("ALL")}
            className="text-xs shrink-0"
          >
            Tất cả ({fields.length})
          </Button>
          {groups.map((grp) => {
            const count = fields.filter((f) => f.group === grp).length;
            return (
              <Button
                key={grp}
                variant={selectedGroup === grp ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGroup(grp)}
                className="text-xs shrink-0"
              >
                {grp} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Table of Fields */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Mã chèn trong Word</th>
                <th className="py-3 px-4">Tên trường</th>
                <th className="py-3 px-4">Nhóm</th>
                <th className="py-3 px-4">Kiểu dữ liệu</th>
                <th className="py-3 px-4">Ví dụ thực tế</th>
                <th className="py-3 px-4">Bắt buộc</th>
                <th className="py-3 px-4 text-right">Sao chép</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Đang tải danh mục mã trường...
                  </td>
                </tr>
              ) : filteredFields.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy mã trường nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredFields.map((field) => {
                  const isCopied = copiedKey === field.key;
                  const isDynamicTable = field.dataType === "DYNAMIC_TABLE";

                  return (
                    <tr
                      key={field.key}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        <div className="flex items-center gap-1.5">
                          {isDynamicTable ? (
                            <TableIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          ) : (
                            <Code2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          )}
                          <span
                            className={
                              isDynamicTable
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-primary"
                            }
                          >
                            &#123;&#123;{field.key}&#125;&#125;
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        <div>{field.label}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1">
                          {field.description}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {field.group}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-semibold ${
                            isDynamicTable
                              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                              : ""
                          }`}
                        >
                          {field.dataType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                        {field.example}
                      </td>
                      <td className="py-3 px-4">
                        {field.required ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Bắt buộc
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Tùy chọn</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(field.key)}
                          className="h-7 px-2 text-xs"
                          title="Sao chép mã chèn"
                        >
                          {isCopied ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold">
                              <Check className="w-3 h-3" /> Đã chép
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                              <Copy className="w-3 h-3" /> Sao chép
                            </span>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
