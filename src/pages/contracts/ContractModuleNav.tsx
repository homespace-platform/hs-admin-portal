import { Link, useSearchParams } from "react-router-dom";

export function useAgreementKind() {
  const [params,setParams]=useSearchParams();
  const kind: "LEASE"|"DEPOSIT"=params.get("kind")==="DEPOSIT"?"DEPOSIT":"LEASE";
  return {kind,changeKind:(next:string)=>setParams(p=>{p.set("kind",next);return p;})};
}
export default function ContractModuleNav({kind,onKindChange}:{kind:"LEASE"|"DEPOSIT";onKindChange?:(value:string)=>void}) {
  return <section className="space-y-3 rounded-2xl border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><strong className="text-sm">Hợp đồng & đặt cọc</strong><select aria-label="Loại văn bản" className="rounded-lg border bg-background p-2 text-sm" value={kind} onChange={e=>onKindChange?.(e.target.value)} disabled={!onKindChange}><option value="LEASE">Hợp đồng thuê</option><option value="DEPOSIT">Hợp đồng đặt cọc</option></select></div>
    <nav className="flex flex-wrap gap-4 text-sm text-primary">
      <Link to={`/contracts/fields?kind=${kind}`}>Từ điển mã trường</Link>
      <Link to={`/contracts/templates?kind=${kind}`}>Mẫu Word & phiên bản</Link>
      <Link to={`/contracts/all?kind=${kind}`}>Hồ sơ & tài liệu đã ký</Link>
      <Link to={`/contracts/guide?kind=${kind}`}>Hướng dẫn admin</Link>
    </nav>
  </section>;
}
