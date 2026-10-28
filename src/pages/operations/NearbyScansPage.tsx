import { useCallback, useEffect, useState } from "react";
import { RefreshCw, MapPin } from "lucide-react";
import axiosClient from "@/lib/axios-client";
import type { ApiResponse } from "@/types/api.type";

type Job = {id: string; listing_id: string; radius_m: number; status: string; attempts: number; next_attempt_at: string; last_error_code?: string; updated_at: string};
type ScanStatus = {syncEnabled: boolean; queryEnabled: boolean; jobs: Job[]};
const labels: Record<string, string> = {PENDING: "Đang chờ", RUNNING: "Đang xử lý", SUCCESS: "Đã hoàn tất", PARTIAL: "Dữ liệu một phần", RETRY_WAIT: "Chờ thử lại", FAILED: "Cần kiểm tra", SUPERSEDED: "Vị trí đã thay đổi", CANCELLED: "Đã hủy"};
async function fetchStatus(signal?: AbortSignal): Promise<ScanStatus> {
 const response = await axiosClient.get<ApiResponse<ScanStatus>>("/api/v1/admin/nearby-scans", {signal});
 return response.data.result;
}

export default function NearbyScansPage() {
 const [data, setData] = useState<ScanStatus | null>(null), [error, setError] = useState(""), [message, setMessage] = useState("");
 const [listingId, setListingId] = useState(""), [radius, setRadius] = useState(2000), [busy, setBusy] = useState(false);
 const load = useCallback(async () => {
  try {setData(await fetchStatus()); setError("");}
  catch {setError("Không tải được trạng thái đồng bộ tiện ích.");}
 }, []);
 useEffect(() => {
  const controller = new AbortController();
  fetchStatus(controller.signal)
   .then(result => {if (!controller.signal.aborted) {setData(result); setError("");}})
   .catch(() => {if (!controller.signal.aborted) setError("Không tải được trạng thái đồng bộ tiện ích.");});
  return () => controller.abort();
 }, []);
 async function enqueue(id: string, requestedRadius = radius) {
  setBusy(true); setMessage(""); setError("");
  try {
   await axiosClient.post(`/api/v1/admin/listings/${encodeURIComponent(id.trim())}/nearby-scans`, null, {params: {radiusMeters: requestedRadius}});
   setMessage("Đã đưa yêu cầu vào hàng đợi. Tin đăng vẫn hoạt động trong khi đồng bộ nền."); await load();
  } catch {setError("Không tạo được yêu cầu. Kiểm tra mã tin đang công khai, tọa độ và trạng thái cấu hình.");}
  finally {setBusy(false);}
 }
 async function cancel(id: string) {
  setBusy(true); setError("");
  try {await axiosClient.post(`/api/v1/admin/nearby-scans/${encodeURIComponent(id)}/cancel`); await load();}
  catch {setError("Không hủy được công việc. Bạn hãy làm mới trạng thái và thử lại.");}
  finally {setBusy(false);}
 }
 return <div className="space-y-6 p-6">
  <div className="flex items-start justify-between gap-4"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><MapPin />Tiện ích xung quanh</h1>
   <p className="mt-2 text-sm text-muted-foreground">Theo dõi dữ liệu địa điểm theo tọa độ tin đăng, thử lại khi cần và kiểm tra độ bao phủ.</p></div>
   <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RefreshCw size={15} />Làm mới</button></div>
  {data && <div className="rounded-xl border bg-card p-4 text-sm"><p>Đồng bộ nền: <strong>{data.syncEnabled ? "Đang bật" : "Đang tắt"}</strong> · Tra cứu: <strong>{data.queryEnabled ? "Đang bật" : "Đang tắt"}</strong></p>
   {!data.syncEnabled && <p className="mt-2 text-muted-foreground">Chưa thể gửi quét mới. Người vận hành cần hoàn thành cấu hình và xác nhận quyền sử dụng dữ liệu theo hướng dẫn triển khai.</p>}</div>}
  <form onSubmit={e => {e.preventDefault(); void enqueue(listingId);}} className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
   <label className="flex min-w-72 flex-1 flex-col gap-2 text-sm">Mã tin đăng<input required value={listingId} onChange={e => setListingId(e.target.value)} placeholder="Mã UUID của tin đang công khai" className="rounded-lg border bg-background px-3 py-2" /></label>
   <label className="flex flex-col gap-2 text-sm">Bán kính<select value={radius} onChange={e => setRadius(Number(e.target.value))} className="rounded-lg border bg-background px-3 py-2"><option value={2000}>2 km</option><option value={3000}>3 km</option><option value={5000}>5 km</option></select></label>
   <button disabled={busy || !data?.syncEnabled} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-40">{busy ? "Đang gửi..." : "Đồng bộ / thử lại"}</button>
  </form>
  {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm text-green-700">{message}</p>}
  <div className="overflow-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-muted/40"><tr>{["Tin đăng", "Bán kính", "Trạng thái", "Số lần thử", "Mã chẩn đoán", "Cập nhật", "Thao tác"].map(t => <th className="p-3" key={t}>{t}</th>)}</tr></thead>
   <tbody>{data?.jobs.map(job => <tr key={job.id} className="border-t"><td className="p-3 font-mono text-xs">{job.listing_id}</td><td className="p-3">{job.radius_m / 1000} km</td><td className="p-3">{labels[job.status] ?? job.status}</td><td className="p-3">{job.attempts}</td><td className="p-3 text-xs">{job.last_error_code ?? "—"}</td><td className="p-3">{new Date(job.updated_at).toLocaleString("vi-VN")}</td><td className="p-3"><button type="button" disabled={busy || !data.syncEnabled || job.status === "RUNNING"} onClick={() => void enqueue(job.listing_id, job.radius_m)} className="text-primary disabled:opacity-40">Đồng bộ lại</button>{["PENDING", "RUNNING", "RETRY_WAIT", "PARTIAL"].includes(job.status) && <button type="button" disabled={busy} onClick={() => void cancel(job.id)} className="ml-3 text-destructive disabled:opacity-40">Hủy</button>}</td></tr>)}</tbody></table>
   {data?.jobs.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Chưa có công việc đồng bộ tiện ích.</p>}
  </div>
  <p className="text-xs text-muted-foreground">Dữ liệu một phần chưa chứng minh đã có đủ địa điểm trong bán kính. Khoảng cách là đường chim bay; không dùng để cam kết thời gian đi lại.</p>
 </div>;
}
