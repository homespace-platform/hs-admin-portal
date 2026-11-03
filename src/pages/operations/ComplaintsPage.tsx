import {useState} from "react";
import RentalComplaintsPanel from "./RentalComplaintsPanel";
import PaymentDisputesPanel from "./PaymentDisputesPanel";
export default function ComplaintsPage(){
  const [tab,setTab]=useState("rental");
  return <div className="space-y-5">
    <h1 className="text-2xl font-bold">Khiếu nại & đối soát</h1>
    <nav aria-label="Loại hồ sơ" className="flex gap-2">
      <button type="button" aria-pressed={tab==="rental"} onClick={()=>setTab("rental")} className="rounded-lg border px-4 py-2">Khiếu nại hồ sơ thuê</button>
      <button type="button" aria-pressed={tab==="payment"} onClick={()=>setTab("payment")} className="rounded-lg border px-4 py-2">Đối soát chuyển tiền</button>
    </nav>
    {tab==="rental"?<RentalComplaintsPanel/>:<PaymentDisputesPanel/>}
  </div>;
}
