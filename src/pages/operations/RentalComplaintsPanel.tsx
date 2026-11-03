import {useCallback,useEffect,useRef,useState} from "react";
import {toast} from "sonner";
import {adminComplaintService as service} from "@/services/admin-complaint.service";
import storageService from "@/services/storage.service";
import {getApiErrorMessage} from "@/utils/apiError";
import {useAuth} from "@/features/auth/useAuth";
import {complaintCategories,complaintStages,type ComplaintCase,type ComplaintAction} from "@/types/complaint.type";
import ComplaintHistory from "@/components/complaint/ComplaintHistory";
const button="rounded-lg border px-3 py-2 text-sm disabled:opacity-50";
const date=(value?:string)=>value?new Date(value).toLocaleString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"}):"—";
const money=(value:number|null)=>value==null?"Chưa có dữ liệu":value.toLocaleString("vi-VN")+" đ";
export default function RentalComplaintsPanel(){
  const {profile}=useAuth();
  const [rows,setRows]=useState<ComplaintCase[]>([]),[current,setCurrent]=useState<ComplaintCase|null>(null);
  const [status,setStatus]=useState("ESCALATED"),[category,setCategory]=useState(""),[overdue,setOverdue]=useState(false),[page,setPage]=useState(1),[hasMore,setHasMore]=useState(false);
  const [loading,setLoading]=useState(true),[error,setError]=useState(""),[busy,setBusy]=useState(false),[reason,setReason]=useState("");
  const [outcome,setOutcome]=useState<"RECORD_FINDING"|"REVISE_SETTLEMENT">("RECORD_FINDING"),[requestedFrom,setRequestedFrom]=useState("TENANT");
  const [deduction,setDeduction]=useState(""),[description,setDescription]=useState(""),[verifiedSource,setVerifiedSource]=useState(false);
  const generation=useRef(0),detailScope=useRef(0),mutex=useRef(false);
  const refresh=useCallback(()=>{
    const token=++generation.current;
    return service.list({status:status||undefined,category:category||undefined,overdue:overdue||undefined,page})
      .then(result=>{if(token===generation.current){setRows(result.result);setHasMore(result.hasMore);setError("");}})
      .catch(cause=>{if(token===generation.current)setError(getApiErrorMessage(cause,"Không tải được danh sách khiếu nại."));})
      .finally(()=>{if(token===generation.current)setLoading(false);});
  },[status,category,overdue,page]);
  useEffect(()=>{const scope=generation;void refresh();return()=>{scope.current++;};},[refresh]);
  useEffect(()=>{const scope=detailScope;return()=>{scope.current++;};},[]);
  async function open(id:string){const token=++detailScope.current;setCurrent(null);setReason("");setOutcome("RECORD_FINDING");setVerifiedSource(false);setDescription("");
    try{const c=await service.get(id);if(token===detailScope.current){setCurrent(c);setDeduction(typeof c.settlement?.deduction==="number"?String(c.settlement.deduction):"");}}
    catch(cause){if(token===detailScope.current)toast.error(getApiErrorMessage(cause,"Không tải được hồ sơ khiếu nại."));}
  }
  const valid=reason.trim().length>=10&&reason.trim().length<=500,amount=Number(deduction);
  const validSettlement=Boolean(current?.settlement&&!current.settlement.accepted&&verifiedSource&&deduction.trim()&&Number.isSafeInteger(amount)&&amount>=0&&amount<=1000000000&&(amount===0||description.trim().length>=3));
  async function act(action:string){
    if(!current||mutex.current||!valid||(action==="DECIDE"&&outcome==="REVISE_SETTLEMENT"&&!validSettlement))return;
    const reviewed=current,scope=detailScope.current;mutex.current=true;setBusy(true);
    const payload:ComplaintAction={expectedRevision:reviewed.revision,reason:reason.trim()};
    if(action==="REQUEST_INFO")payload.requestedFrom=requestedFrom==="TENANT"?reviewed.tenantId:reviewed.landlordId;
    if(action==="DECIDE"){payload.outcome=outcome;if(outcome==="REVISE_SETTLEMENT")payload.settlement={otherDeduction:amount,note:reason.trim(),vacantPossessionConfirmed:verifiedSource,expectedProposalVersion:reviewed.settlement!.version,deductions:amount===0?[]:[{description:description.trim(),amount,evidenceIds:[]}]};}
    try{const c=await service.act(reviewed.id,action,payload);if(scope===detailScope.current){setCurrent(c);setReason("");setVerifiedSource(false);}await refresh();toast.success("Đã cập nhật hồ sơ khiếu nại.");}
    catch(cause){toast.error(getApiErrorMessage(cause,"Kiểm tra lại phiên bản và điều kiện hồ sơ."));if(scope===detailScope.current)try{const c=await service.get(reviewed.id);if(scope===detailScope.current)setCurrent(c);}catch{/* Keep entered reason. */}}
    finally{mutex.current=false;setBusy(false);}
  }
  async function proof(id:string){const tab=window.open("","_blank");try{const url=await storageService.getViewUrl(id);if(tab){tab.opener=null;tab.location.href=url;}}catch(cause){tab?.close();toast.error(getApiErrorMessage(cause,"Không mở được chứng cứ."));}}
  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Tiếp nhận vụ việc, yêu cầu bổ sung, ghi kết luận và theo dõi thực hiện. Quá hạn không tự chấp thuận hoặc ghi nhận tiền.</p>
    <div className="flex flex-wrap gap-3">
      <label>Trạng thái <select aria-label="Trạng thái khiếu nại" value={status} className="rounded border p-2" onChange={e=>{setLoading(true);setStatus(e.target.value);setPage(1);}}><option value="">Tất cả</option><option value="OPEN">Hai bên trao đổi</option><option value="ESCALATED">HomeSpace xử lý</option><option value="RESOLVED">Đã đóng / thống nhất</option></select></label>
      <label>Nhóm <select aria-label="Nhóm khiếu nại" value={category} className="rounded border p-2" onChange={e=>{setLoading(true);setCategory(e.target.value);setPage(1);}}><option value="">Tất cả</option>{Object.entries(complaintCategories).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={overdue} onChange={e=>{setLoading(true);setOverdue(e.target.checked);setPage(1);}}/>Chỉ quá hạn</label><button type="button" className={button} onClick={()=>{setLoading(true);void refresh();}}>Tải lại</button>
    </div>
    {error&&<p role="alert" className="text-red-700">{error}</p>}
    {loading?<p>Đang tải khiếu nại…</p>:<div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Mở lúc / hạn</th><th className="p-3">Nhóm và nội dung</th><th className="p-3">Tiến trình</th><th className="p-3">Thao tác</th></tr></thead><tbody>{rows.map(c=><tr key={c.id} className="border-t"><td className="p-3">{date(c.openedAt)}<p className={c.overdue?"text-amber-800":"text-muted-foreground"}>{date(c.respondBy)}{c.overdue?" · Quá hạn":""}</p></td><td className="max-w-sm p-3"><strong>{complaintCategories[c.category]}</strong><p>{c.reason}</p></td><td className="p-3">{complaintStages[c.stage]??c.stage}<p className="text-xs">{c.assignedTo===profile?.id?"Bạn đang xử lý":c.assignedTo?"Đã có người tiếp nhận":""}</p></td><td className="p-3"><button type="button" className={button} onClick={()=>void open(c.id)}>Xem khiếu nại</button></td></tr>)}{rows.length===0&&<tr><td colSpan={4} className="p-4">Chưa có hồ sơ khớp bộ lọc.</td></tr>}</tbody></table></div>}
    <div className="flex justify-between"><button type="button" className={button} disabled={page===1||loading} onClick={()=>{setLoading(true);setPage(v=>v-1);}}>Trước</button><span>Trang {page}</span><button type="button" className={button} disabled={!hasMore||loading} onClick={()=>{setLoading(true);setPage(v=>v+1);}}>Tiếp</button></div>
    {current&&<section aria-label="Chi tiết khiếu nại" className="space-y-4 rounded-xl border p-5">
      <div className="flex justify-between gap-3"><h2 className="font-bold">{complaintCategories[current.category]} · {complaintStages[current.stage]??current.stage}</h2><button type="button" className={button} onClick={()=>{detailScope.current++;setCurrent(null);}}>Đóng</button></div>
      <p>{current.reason}</p><p className="text-xs text-muted-foreground">Hồ sơ thuê: {current.rentalRequestId}{current.contractId?" · Hợp đồng: "+current.contractId:""}</p>
      {current.decision&&<div className="rounded border bg-blue-50 p-3 text-sm text-blue-950"><strong>Kết luận đang theo dõi</strong><p>{current.decision}</p><p>Đã có kết luận chưa đồng nghĩa đã nhận tiền.</p></div>}
      {current.settlement&&<div className="rounded-lg border p-3"><p className="font-semibold">Quyết toán hiện tại · Phiên bản {current.settlement.version}</p><p>Khấu trừ {money(current.settlement.deduction)} · Hoàn {money(current.settlement.refund)} · Trả thêm {money(current.settlement.balance)}</p><p>{current.settlement.note}</p><p>{current.settlement.ownerApproved?"Chủ nhà đã đồng ý đề xuất admin":"Chưa có đồng ý của chủ nhà cho đề xuất admin"} · {current.settlement.accepted?"Người thuê đã chấp thuận quyết toán":"Chưa chấp thuận quyết toán"}</p></div>}
      <div className="flex flex-wrap gap-2">{current.evidenceIds.map((id,i)=><button type="button" key={id} className={button} onClick={()=>void proof(id)}>Xem chứng cứ {i+1}</button>)}</div>
      {current.status==="RESOLVED"&&current.closingReason&&<p>Lý do đóng / thống nhất: {current.closingReason}</p>}
      <ComplaintHistory complaint={current} onProof={id=>void proof(id)}/>
      {current.allowedActions.length>0&&<div className="space-y-3">
        <textarea aria-label="Căn cứ xử lý khiếu nại" value={reason} maxLength={500} onChange={e=>setReason(e.target.value)} placeholder="Căn cứ / yêu cầu bổ sung / kết luận (10–500 ký tự)" className="min-h-24 w-full rounded-lg border p-3"/>
        {current.allowedActions.includes("CLAIM")&&<button type="button" className={button} disabled={busy||!valid} onClick={()=>void act("CLAIM")}>{current.assignedTo&&current.assignedTo!==profile?.id?"Chuyển xử lý về tôi":"Tiếp nhận khiếu nại"}</button>}
        {current.allowedActions.includes("REQUEST_INFO")&&<div className="flex gap-2"><select aria-label="Bên cần bổ sung" value={requestedFrom} onChange={e=>setRequestedFrom(e.target.value)} className="rounded border p-2"><option value="TENANT">Người thuê</option><option value="LANDLORD">Chủ nhà</option></select><button type="button" className={button} disabled={busy||!valid} onClick={()=>void act("REQUEST_INFO")}>Yêu cầu bổ sung</button></div>}
        {current.allowedActions.includes("DECIDE")&&<div className="space-y-3 rounded-lg border p-3">
          <select aria-label="Hướng giải quyết khiếu nại" value={outcome} onChange={e=>setOutcome(e.target.value as typeof outcome)} className="max-w-full rounded border p-2"><option value="RECORD_FINDING">Ghi kết luận và theo dõi thực hiện</option><option value="REVISE_SETTLEMENT" disabled={current.category!=="DEPOSIT_SETTLEMENT"||!current.settlement||current.settlement.accepted}>Lập lại đề xuất quyết toán cọc để hai bên đồng ý</option></select>
          {outcome==="REVISE_SETTLEMENT"&&<div className="space-y-2"><label className="block">Tổng khấu trừ mới (đ)<input aria-label="Khấu trừ admin đề xuất" type="number" min={0} max={1000000000} step={1} value={deduction} onChange={e=>setDeduction(e.target.value)} className="ml-2 rounded border p-2"/></label><input aria-label="Căn cứ khoản khấu trừ" maxLength={300} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Mô tả khoản khấu trừ; để trống nếu hoàn đủ cọc" className="w-full rounded border p-2"/><label className="flex gap-2"><input type="checkbox" checked={verifiedSource} onChange={e=>setVerifiedSource(e.target.checked)}/>Tôi đã kiểm tra phiên bản nguồn, nội dung bàn giao và chứng cứ; đề xuất này vẫn cần hai bên đồng ý.</label></div>}
          <p className="text-xs text-muted-foreground">Không ghi nhận tiền, xóa nợ hoặc trả phòng từ kết luận. Đề xuất cọc phải qua chủ nhà đồng ý, người thuê xác nhận và bước thực nhận tiền.</p>
          <button type="button" className={button} disabled={busy||!valid||(outcome==="REVISE_SETTLEMENT"&&!validSettlement)} onClick={()=>void act("DECIDE")}>Ghi kết luận khiếu nại</button>
        </div>}
        {current.allowedActions.includes("CLOSE")&&<button type="button" className={button} disabled={busy||!valid} onClick={()=>void act("CLOSE")}>Đóng theo kết luận</button>}
      </div>}
    </section>}
  </div>;
}
