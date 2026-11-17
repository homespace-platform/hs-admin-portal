import {useState} from "react";
import {useSearchParams} from "react-router-dom";
import RentalComplaintsPanel from "./RentalComplaintsPanel";
import PaymentDisputesPanel from "./PaymentDisputesPanel";
export default function ComplaintsPage(){
  const [tab,setTab]=useState("rental");
  const [search,setSearch]=useSearchParams();
  const selected=search.has("caseId")?"rental":tab;
  function select(value:string){setTab(value);if(search.has("caseId")){const next=new URLSearchParams(search);next.delete("caseId");setSearch(next);}}
  return <div className="space-y-5">
    <h1 className="text-2xl font-bold">Khiếu nại & đối soát</h1>
    <nav aria-label="Loại hồ sơ" className="flex gap-2">
      <button type="button" aria-pressed={selected==="rental"} onClick={()=>select("rental")} className="rounded-lg border px-4 py-2">Khiếu nại hồ sơ thuê</button>
      <button type="button" aria-pressed={selected==="payment"} onClick={()=>select("payment")} className="rounded-lg border px-4 py-2">Đối soát chuyển tiền</button>
    </nav>
    {selected==="rental"?<RentalComplaintsPanel/>:<PaymentDisputesPanel/>}
  </div>;
}
