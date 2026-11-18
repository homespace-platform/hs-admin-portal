"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import userService from "@/services/user.service";
import { useAppSelector } from "@/store/hooks";
import type { OnboardingStatusResponse } from "@/types/user.type";
import { toast } from "sonner";

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

// Older backends omit passwordSet; fall back to the legacy completedSteps list.
function isPasswordSet(status: OnboardingStatusResponse) {
  return status.passwordSet ?? status.completedSteps?.includes("PASSWORD") ?? false;
}

export default function OnboardingInitializer() {
  const userId = useAppSelector((state) => state.auth.userId);
  return <AccountOnboarding key={userId ?? "anonymous"} />;
}

// Blocks the portal only until the admin has a password. Profile/address/bank/KYC never block.
function AccountOnboarding() {
  const authenticated = useAppSelector((state) => state.auth.authenticated);
  const userId = useAppSelector((state) => state.auth.userId);
  const profile = useAppSelector((state) => state.user.profile);
  const profileStatus = useAppSelector((state) => state.user.status);

  const initializedForUser = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      !authenticated ||
      !userId ||
      profileStatus !== "succeeded" ||
      !profile ||
      profile.id !== userId ||
      initializedForUser.current === userId
    ) {
      return;
    }

    initializedForUser.current = userId;
    userService.getOnboardingStatus()
      .then((status) => setOpen(!isPasswordSet(status)))
      .catch(() => {
        // Status unavailable: never lock admins out of the portal.
      });
  }, [authenticated, profile, profileStatus, userId]);

  if (!authenticated || !open || !profile || !userId || profile.id !== userId) return null;

  async function finishPassword(newPassword: string) {
    setError(null);
    try {
      await userService.setInitialPassword({ newPassword });
      toast.success("Tạo mật khẩu thành công.");
      setOpen(false);
    } catch (requestError) {
      const message = getErrorMessage(
        requestError,
        "Không thể tạo mật khẩu. Vui lòng thử lại."
      );
      setError(message);
      toast.error(message);
      throw requestError;
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Tạo mật khẩu"
    >
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-2xl sm:p-7">
        <header className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Thiết lập tài khoản
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-foreground sm:text-2xl">
            Tạo mật khẩu quản trị
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Vui lòng tạo mật khẩu để tiếp tục sử dụng cổng quản trị.
          </p>
        </header>
        <PasswordStep error={error} onSubmit={finishPassword} />
      </div>
    </div>
  );
}

function PasswordStep({
  error,
  onSubmit,
}: {
  error: string | null;
  onSubmit: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLocalError(null);

    if (password.length < 8) {
      setLocalError("Mật khẩu phải có tối thiểu 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit(password);
    } catch {
      // error handled in parent
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {(localError || error) && <ErrorBox message={localError || error || ""} />}
      <p className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
        Tài khoản đăng nhập mạng xã hội chưa có mật khẩu. Hãy tạo mật khẩu để có thể đăng nhập bằng email, username hoặc số điện thoại.
      </p>
      <PasswordInput
        label="Mật khẩu mới"
        value={password}
        onChange={setPassword}
        visible={showPassword}
        onToggle={() => setShowPassword((v) => !v)}
      />
      <PasswordInput
        label="Xác nhận mật khẩu"
        value={confirmPassword}
        onChange={setConfirmPassword}
        visible={showPassword}
        onToggle={() => setShowPassword((v) => !v)}
      />
      <button
        type="submit"
        disabled={saving}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60"
      >
        {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
        {saving ? "Đang lưu..." : "Tạo mật khẩu"}
      </button>
    </form>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          minLength={8}
          className="h-11 w-full rounded-xl border border-border bg-background px-3.5 pr-11 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground"
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
      {message}
    </div>
  );
}
