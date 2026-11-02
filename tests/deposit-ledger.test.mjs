import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url),ts=require("typescript"),React=require("react"),{renderToStaticMarkup}=require("react-dom/server");
function compile(file,dependencies={}){const loaded={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("../"+file,import.meta.url),"utf8"),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:loaded,exports:loaded.exports,require:name=>dependencies[name]??require(name)});return loaded.exports;}
const Summary=compile("src/pages/contracts/DepositLedgerSummary.tsx").default;
const fixture=id=>({id,contractNumber:"HD-"+id,landlordId:"owner",tenantId:"tenant",status:"CLOSED",createdAt:"2026-11-03T03:00:00Z"});
function page(pending){
  const states=[[fixture("first"),fixture("second")],false,"","ALL",null,null,[],false,false],updates=states.map(()=>[]);let index=0;
  const hooks={...React,useState(initial){const i=index++;return [i<states.length?states[i]:initial,value=>updates[i].push(value)];},useEffect(){},useMemo:fn=>fn(),useRef:initial=>({current:initial}),useCallback:fn=>fn};
  const calls=[],errors=[];
  const api={getContractRevision:async id=>({id}),getContractDocuments:async()=>[],getContract:id=>{calls.push(id);return pending(id);}};
  const button=props=>React.createElement("button",props);
  const C=compile("src/pages/contracts/ContractsListPage.tsx",{react:hooks,"@/services/admin-contract.service":{adminContractService:api},"./ContractModuleNav":{default:()=>null,useAgreementKind:()=>({kind:"LEASE",changeKind(){}})},"./DepositLedgerSummary":{default:Summary},"@/components/ui/button":{Button:button},"@/components/ui/badge":{Badge:()=>null},"@/components/ui/input":{Input:()=>null},"@/utils/apiError":{getApiErrorMessage:e=>e.message},"react-router-dom":{Link:()=>null},sonner:{toast:{error:e=>errors.push(e)}}}).default;
  return {tree:C(),updates,calls,errors};
}
function text(n){if(n==null||typeof n==="boolean")return "";if(Array.isArray(n))return n.map(text).join("");return typeof n==="object"?text(n.props?.children):String(n);}
function findAll(n,predicate,result=[]){if(n&&typeof n==="object"){if(Array.isArray(n))n.forEach(x=>findAll(x,predicate,result));else{if(predicate(n))result.push(n);findAll(n.props?.children,predicate,result);}}return result;}
const tick=()=>new Promise(setImmediate);
test("admin summary keeps retained and actually refunded amounts separate",()=>{
  const html=renderToStaticMarkup(React.createElement(Summary,{ledger:{status:"REFUNDED",retainedAmount:100000,confirmedRefundedAmount:19900000,heldAmount:0}}));
  assert.match(html,/100.000 đ/);assert.match(html,/19.900.000 đ/);assert.match(html,/Chưa có dữ liệu/);
});
test("opening admin contract loads current ledger through the authorized detail API",async()=>{
  const detail={...fixture("first"),depositLedger:{status:"REFUND_DUE",retainedAmount:100000}};
  const f=page(async()=>detail);await findAll(f.tree,n=>text(n)==="Xem chi tiết"&&n.props?.onClick)[0].props.onClick();
  assert.deepEqual(f.calls,["first"]);assert.equal(f.updates[4].at(-1),detail);
});
test("old admin detail response cannot overwrite the ledger of a later opened contract",async()=>{
  let finishFirst;const first=new Promise(resolve=>{finishFirst=resolve;});
  const f=page(id=>id==="first"?first:Promise.resolve({...fixture(id),depositLedger:{retainedAmount:200000}}));
  const buttons=findAll(f.tree,n=>text(n)==="Xem chi tiết"&&n.props?.onClick);
  const opening=buttons[0].props.onClick();await buttons[1].props.onClick();finishFirst({...fixture("first"),depositLedger:{retainedAmount:100000}});await opening;await tick();
  assert.equal(f.updates[4].at(-1).id,"second");assert.equal(f.updates[4].at(-1).depositLedger.retainedAmount,200000);
});
