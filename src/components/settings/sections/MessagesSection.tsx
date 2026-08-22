import { useState } from "react";
import { MessageSquare } from "lucide-react";

export default function MessagesSection() {
  const [spellCheck, setSpellCheck] = useState(true);
  const [compressImages, setCompressImages] = useState(true);
  const [autoReply, setAutoReply] = useState(false);

  return (
    <div className="space-y-6 max-w-xl animate-in fade-in-50 duration-200">
      {/* 1. Tin nhắn tự động & Soạn thảo */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span>Tin nhắn & Soạn thảo</span>
        </h3>
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-foreground">
                Tự động kiểm tra chính tả khi soạn thảo
              </p>
              <p className="text-[11px] text-muted-foreground">
                Gợi ý và sửa lỗi chính tả tiếng Việt
              </p>
            </div>
            <input
              type="checkbox"
              checked={spellCheck}
              onChange={(e) => setSpellCheck(e.target.checked)}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </div>

          <div className="border-t border-border/50" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-foreground">
                Tối ưu dung lượng hình ảnh khi gửi
              </p>
              <p className="text-[11px] text-muted-foreground">
                Giúp gửi tin nhắn ảnh nhanh hơn và tiết kiệm dữ liệu
              </p>
            </div>
            <input
              type="checkbox"
              checked={compressImages}
              onChange={(e) => setCompressImages(e.target.checked)}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </div>

          <div className="border-t border-border/50" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-foreground">
                Tự động trả lời khi vắng mặt
              </p>
              <p className="text-[11px] text-muted-foreground">
                Gửi tin nhắn mẫu cho người dùng khi bạn không online
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoReply}
              onChange={(e) => setAutoReply(e.target.checked)}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
