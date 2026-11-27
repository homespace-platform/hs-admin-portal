import type { ManualKycRequest } from "@/types/kyc.type";

export type ManualKycForm = Record<keyof ManualKycRequest, string>;
export type ManualKycErrors = Partial<Record<keyof ManualKycRequest, string>>;
export const EMPTY_MANUAL_KYC: ManualKycForm = {
  cccd: "", fullName: "", birthDate: "", gender: "", permanentAddress: "", issueDate: "", expirationDate: "", issuePlace: "",
};

/** Today as yyyy-MM-dd in Vietnam time (server compares issue date against VN today). */
export const todayVn = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());

/** True for a real calendar date in yyyy-MM-dd (what <input type="date"> emits and the API expects). */
export function isIsoDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/** ISO instant -> "dd/MM/yyyy HH:mm" in VN time; empty when missing/invalid. */
export function formatVerifiedAt(iso?: string | null): string {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}

/** Mirrors the server rules; returns field -> Vietnamese message (empty object = valid). */
export function validateManualKyc(form: ManualKycForm, today = todayVn()): ManualKycErrors {
  const e: ManualKycErrors = {};
  if (!/^\d{12}$/.test(form.cccd)) e.cccd = "CCCD phải gồm đúng 12 chữ số.";
  if (!form.fullName.trim()) e.fullName = "Vui lòng nhập họ và tên trên CCCD.";
  if (form.gender !== "Nam" && form.gender !== "Nữ") e.gender = "Vui lòng chọn giới tính.";
  if (!form.permanentAddress.trim()) e.permanentAddress = "Vui lòng nhập nơi thường trú.";
  if (!form.issuePlace.trim()) e.issuePlace = "Vui lòng nhập nơi cấp.";
  for (const [key, label] of [["birthDate", "ngày sinh"], ["issueDate", "ngày cấp"], ["expirationDate", "ngày hết hạn"]] as const) {
    if (!form[key]) e[key] = `Vui lòng chọn ${label}.`;
    else if (!isIsoDate(form[key])) e[key] = `Giá trị ${label} không hợp lệ.`;
  }
  if (!e.issueDate && form.issueDate > today) e.issueDate = "Ngày cấp không được sau hôm nay.";
  if (!e.issueDate && !e.expirationDate && form.issueDate >= form.expirationDate) e.expirationDate = "Ngày cấp phải trước ngày hết hạn.";
  if (!e.birthDate && !e.issueDate && form.birthDate >= form.issueDate) e.birthDate = "Ngày sinh phải trước ngày cấp.";
  return e;
}
