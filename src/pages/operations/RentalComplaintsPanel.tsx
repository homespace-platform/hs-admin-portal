import {useCallback,useEffect,useRef,useState} from "react";
import {toast} from "sonner";
import {adminComplaintService as service} from "@/services/admin-complaint.service";
import storageService from "@/services/storage.service";
import {getApiErrorMessage} from "@/utils/apiError";
import {useAuth} from "@/features/auth/useAuth";
import {complaintCategories,complaintStages,type ComplaintCase,type ComplaintAction} from "@/types/complaint.type";
import ComplaintHistory from "@/components/complaint/ComplaintHistory";
import {useSearchParams} from "react-router-dom";
import {usePersonalNotifications} from "@/features/notifications/personalNotificationContext";
const button="rounded-lg border px-3 py-2 text-sm disabled:opacity-50";
const date=(value?:string)=>value?new Date(value).toLocaleString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"}):"—";
export default function RentalComplaintsPanel(){
  const {profile}=useAuth();
  const [search]=useSearchParams();
  const caseId=search.get("caseId");
  const {version:notificationVersion}=usePersonalNotifications();
  const [rows,setRows]=useState<ComplaintCase[]>([]),[current,setCurrent]=useState<ComplaintCase|null>(null);
  const [status,setStatus]=useState("ESCALATED"),[category,setCategory]=useState(""),[overdue,setOverdue]=useState(false),[page,setPage]=useState(1),[hasMore,setHasMore]=useState(false);
  const [loading,setLoading]=useState(true),[error,setError]=useState(""),[busy,setBusy]=useState(false),[reason,setReason]=useState("");
  const [requestedFrom,setRequestedFrom]=useState("TENANT");
  const dialog=useRef<HTMLDialogElement>(null);
  const generation=useRef(0),detailScope=useRef(0),mutex=useRef(false);
  const lastNotification=useRef(notificationVersion);
  const refresh=useCallback(()=>{
    const token=++generation.current;
    return service.list({status:status||undefined,category:category||undefined,overdue:overdue||undefined,page})
      .then(result=>{if(token===generation.current){setRows(result.result);setHasMore(result.hasMore);setError("");}})
      .catch(cause=>{if(token===generation.current)setError(getApiErrorMessage(cause,"Không tải được danh sách khiếu nại."));})
      .finally(()=>{if(token===generation.current)setLoading(false);});
  },[status,category,overdue,page]);
  useEffect(()=>{const scope=generation;void refresh();return()=>{scope.current++;};},[refresh,notificationVersion]);
  useEffect(()=>{const scope=detailScope;return()=>{scope.current++;};},[]);
  useEffect(()=>{
    const scope=detailScope;
    if(!caseId||!/^[A-Za-z0-9_-]{1,100}$/.test(caseId)||profile?.role?.toUpperCase()!=="ADMIN")return;
    const token=++scope.current;
    void service.get(caseId).then(c=>{if(scope.current===token){setCurrent(c);setReason("");}})
      .catch(cause=>{if(scope.current===token)toast.error(getApiErrorMessage(cause,"Không có quyền hoặc hồ sơ không còn khả dụng."));});
    return()=>{scope.current++;};
  },[caseId,profile?.role]);
  useEffect(()=>{
    if(lastNotification.current===notificationVersion)return;
    lastNotification.current=notificationVersion;
    if(!current?.id||mutex.current)return;
    const scope=detailScope.current;
    void service.get(current.id).then(c=>{if(scope===detailScope.current)setCurrent(previous=>previous?.id===c.id&&c.revision>=previous.revision?c:previous);})
      .catch(()=>{/* Keep the current detail and entered reply; explicit reload remains available. */});
  },[notificationVersion,current?.id]);
  async function open(id:string){const token=++detailScope.current;setCurrent(null);setReason("");
    try{const c=await service.get(id);if(token===detailScope.current){setCurrent(c);}}
    catch(cause){if(token===detailScope.current)toast.error(getApiErrorMessage(cause,"Không tải được hồ sơ khiếu nại."));}
  }
  useEffect(()=>{
    const element=dialog.current;if(!current?.id||!element)return;
    if(!element.open)element.showModal();
    const overflow=document.body.style.overflow;document.body.style.overflow="hidden";
    return()=>{element.close();document.body.style.overflow=overflow;};
  },[current?.id]);
  const valid=reason.trim().length>=10&&reason.trim().length<=500;
  async function act(action:string){
    if(!current||mutex.current||!valid||!current.allowedActions.includes(action))return;
    const reviewed=current,scope=detailScope.current;mutex.current=true;setBusy(true);
    const payload:ComplaintAction={expectedRevision:reviewed.revision,reason:reason.trim()};
    if(action==="REQUEST_INFO")payload.requestedFrom=requestedFrom==="TENANT"?reviewed.tenantId:reviewed.landlordId;
    if(action==="DECIDE")payload.outcome="RECORD_FINDING";
    try{const c=await service.act(reviewed.id,action,payload);if(scope===detailScope.current){setCurrent(c);setReason("");}await refresh();toast.success("Đã cập nhật hồ sơ khiếu nại.");}
    catch(cause){toast.error(getApiErrorMessage(cause,"Kiểm tra lại phiên bản và điều kiện hồ sơ."));if(scope===detailScope.current)try{const c=await service.get(reviewed.id);if(scope===detailScope.current)setCurrent(c);}catch{/* Keep entered reason. */}}
    finally{mutex.current=false;setBusy(false);}
  }
  async function proof(id:string,source?:NonNullable<NonNullable<ComplaintCase["sources"]>[number]["documents"]>[number]){
    const tab=window.open("","_blank");if(!tab){toast.error("Vui lòng cho phép mở cửa sổ để xem chứng cứ.");return;}tab.opener=null;
    try{
      if(source?.purpose==="SIGNED_FINAL"){
        const blob=await service.sourcePdf(source);if(tab.closed)return;
        const url=URL.createObjectURL(blob);tab.location.href=url;setTimeout(()=>URL.revokeObjectURL(url),60000);
      }else{const url=await storageService.getViewUrl(id);if(!tab.closed)tab.location.href=url;}
    }catch(cause){tab.close();toast.error(getApiErrorMessage(cause,"Không mở được chứng cứ."));}
  }
  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Tiếp nhận hồ sơ, trao đổi với hai bên và ghi kết luận hỗ trợ. Khiếu nại không sửa hợp đồng hay quyết toán.</p>
    <div className="flex flex-wrap gap-3">
      <label>Trạng thái <select aria-label="Trạng thái khiếu nại" value={status} className="rounded border p-2" onChange={e=>{setLoading(true);setStatus(e.target.value);setPage(1);}}><option value="">Tất cả</option><option value="OPEN">Hai bên trao đổi</option><option value="ESCALATED">HomeSpace xử lý</option><option value="RESOLVED">Đã đóng / thống nhất</option></select></label>
      <label>Nhóm <select aria-label="Nhóm khiếu nại" value={category} className="rounded border p-2" onChange={e=>{setLoading(true);setCategory(e.target.value);setPage(1);}}><option value="">Tất cả</option>{Object.entries(complaintCategories).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={overdue} onChange={e=>{setLoading(true);setOverdue(e.target.checked);setPage(1);}}/>Chỉ quá hạn</label><button type="button" className={button} onClick={()=>{setLoading(true);void refresh();}}>Tải lại</button>
    </div>
    {error&&<p role="alert" className="text-red-700">{error}</p>}
    {loading?<p>Đang tải khiếu nại…</p>:<div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Mở lúc / hạn</th><th className="p-3">Nhóm và nội dung</th><th className="p-3">Tiến trình</th><th className="p-3">Thao tác</th></tr></thead><tbody>{rows.map(c=><tr key={c.id} className="border-t"><td className="p-3">{date(c.openedAt)}<p className={c.overdue?"text-amber-800":"text-muted-foreground"}>{date(c.respondBy)}{c.overdue?" · Quá hạn":""}</p></td><td className="max-w-sm p-3"><strong>{complaintCategories[c.category]}</strong><p>{c.reason}</p></td><td className="p-3">{complaintStages[c.stage]??c.stage}<p className="text-xs text-muted-foreground">Kết luận {c.adminReviewCount??0}/{c.adminReviewLimit??2}</p><p className="text-xs">{c.assignedTo===profile?.id?"Bạn đang xử lý":c.assignedTo?"Đã có người tiếp nhận":""}</p></td><td className="p-3"><button type="button" className={button} onClick={()=>void open(c.id)}>Xem khiếu nại</button></td></tr>)}{rows.length===0&&<tr><td colSpan={4} className="p-4">Chưa có hồ sơ khớp bộ lọc.</td></tr>}</tbody></table></div>}
    <div className="flex justify-between"><button type="button" className={button} disabled={page===1||loading} onClick={()=>{setLoading(true);setPage(v=>v-1);}}>Trước</button><span>Trang {page}</span><button type="button" className={button} disabled={!hasMore||loading} onClick={()=>{setLoading(true);setPage(v=>v+1);}}>Tiếp</button></div>
    <dialog ref={dialog} aria-labelledby="complaint-admin-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-3xl overflow-y-auto rounded-2xl border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/50" onCancel={e=>{e.preventDefault();detailScope.current++;setCurrent(null);}}>
    {current&&<section aria-label="Chi tiết khiếu nại" className="space-y-4 p-5">
      <div className="flex justify-between gap-3"><h2 id="complaint-admin-title" className="font-bold">{complaintCategories[current.category]} · {complaintStages[current.stage]??current.stage}</h2><button type="button" className={button} onClick={()=>{detailScope.current++;setCurrent(null);}}>Đóng</button></div>
      <p className="text-sm text-muted-foreground">Admin đã kết luận {current.adminReviewCount??0}/{current.adminReviewLimit??2} lần.</p>
      {[current.tenantId,current.landlordId].includes(profile?.id??"")&&<p role="status" className="rounded-lg border p-3 text-sm">Bạn là một bên của hợp đồng này nên chỉ được xem, không được tự xử lý khiếu nại.</p>}
      {current.finalClosed&&<p role="status" className="rounded-lg border p-3 text-sm">Đã kết luận lần 2 và đóng hồ sơ. Hồ sơ chỉ còn để xem lịch sử.</p>}
      {current.status==="OPEN"&&(current.adminReviewCount??0)===1&&<p role="status" className="rounded-lg border p-3 text-sm">Đã kết luận lần 1. Hai bên tiếp tục trao đổi; admin chỉ xử lý lần 2 khi một bên chuyển lại hồ sơ.</p>}
      <p>{current.reason}</p><p className="text-xs text-muted-foreground">Hồ sơ thuê: {current.rentalRequestId}{current.contractId?" · Hợp đồng: "+current.contractId:""}</p>
      {current.decision&&<div className="rounded border bg-blue-50 p-3 text-sm text-blue-950"><strong>Kết luận HomeSpace · Lần {current.adminReviewCount??1}</strong><p>{current.decision}</p><p>Đã có kết luận chưa đồng nghĩa đã nhận tiền.</p></div>}
      <div className="flex flex-wrap gap-2">{current.evidenceIds.map((id,i)=><button type="button" key={id} className={button} onClick={()=>void proof(id)}>Xem chứng cứ {i+1}</button>)}</div>
      {current.status==="RESOLVED"&&current.closingReason&&<p>Lý do đóng / thống nhất: {current.closingReason}</p>}
      <ComplaintHistory complaint={current} onProof={(id,document)=>void proof(id,document)}/>
      {current.allowedActions.length>0&&<div className="space-y-3">
        <textarea aria-label="Căn cứ xử lý khiếu nại" value={reason} maxLength={500} onChange={e=>setReason(e.target.value)} placeholder="Nội dung trao đổi / yêu cầu bổ sung / kết luận (10–500 ký tự)" className="min-h-24 w-full rounded-lg border p-3"/>
        {current.allowedActions.includes("CLAIM")&&<button type="button" className={button} disabled={busy||!valid} onClick={()=>void act("CLAIM")}>{current.assignedTo&&current.assignedTo!==profile?.id?"Chuyển xử lý về tôi":"Tiếp nhận khiếu nại"}</button>}
        {current.allowedActions.includes("REQUEST_INFO")&&<div className="flex gap-2"><select aria-label="Bên cần bổ sung" value={requestedFrom} onChange={e=>setRequestedFrom(e.target.value)} className="rounded border p-2"><option value="TENANT">Người thuê</option><option value="LANDLORD">Chủ nhà</option></select><button type="button" className={button} disabled={busy||!valid} onClick={()=>void act("REQUEST_INFO")}>Yêu cầu bổ sung</button></div>}
        {current.allowedActions.includes("COMMENT")&&<button type="button" className={button} disabled={busy||!valid} onClick={()=>void act("COMMENT")}>Gửi trao đổi</button>}
        {current.allowedActions.includes("DECIDE")&&<div className="space-y-2"><p className="text-xs text-muted-foreground">{(current.adminReviewCount??0)===0?"Kết luận lần 1 để hai bên tiếp tục trao đổi. Hai bên có thể tự đóng hoặc yêu cầu xem xét lần 2.":"Kết luận lần 2 sẽ đóng hồ sơ và kết thúc hỗ trợ trên hồ sơ này."} Không sửa hợp đồng, quyết toán hoặc ghi nhận tiền.</p><button type="button" className={button} disabled={busy||!valid} onClick={()=>void act("DECIDE")}>{(current.adminReviewCount??0)===0?"Gửi kết luận lần 1":"Kết luận lần 2 và đóng hồ sơ"}</button></div>}
      </div>}
    </section>}</dialog>
  </div>;
}
