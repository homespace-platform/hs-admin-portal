import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url),ts=require("typescript"),React=require("react"),{renderToStaticMarkup}=require("react-dom/server");
function compile(file,dependencies={}){const loaded={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("../"+file,import.meta.url),"utf8"),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:loaded,exports:loaded.exports,require:name=>dependencies[name]??require(name),window:{open:()=>null}});return loaded.exports;}
const labels=compile("src/types/complaint.type.ts"),History=compile("src/components/complaint/ComplaintHistory.tsx",{"@/types/complaint.type":labels}).default;
const example=()=>({id:"case",rentalRequestId:"rental",contractId:"contract",tenantId:"tenant",landlordId:"owner",category:"DEPOSIT_SETTLEMENT",reason:"Phản đối khấu trừ cọc",openedBy:"tenant",openedAt:"2026-11-03T03:00:00Z",status:"ESCALATED",stage:"UNDER_REVIEW",revision:9,assignedTo:"admin",overdue:false,allowedActions:["CLAIM","REQUEST_INFO","DECIDE"],events:[],evidenceIds:[],settlement:{version:3,status:"DISPUTED",deduction:100000,refund:19900000,balance:0,note:"Ghi chú nguồn",ownerApproved:false,accepted:false}});
function page(options={}){
  const c={...example(),...options.case},states=[[],c,"ESCALATED","",false,1,false,false,"",false,"Đã kiểm tra đầy đủ chứng cứ hai bên",options.outcome??"RECORD_FINDING","TENANT","50000","Thay khóa theo hiện trạng",options.verified??false],updates=states.map(()=>[]);
  let index=0,refIndex=0;const refs=[],calls=[],errors=[];
  const hooks={...React,useState(initial){const i=index++;return [i<states.length?states[i]:initial,v=>updates[i].push(v)];},useRef(initial){const i=refIndex++;return refs[i]??(refs[i]={current:initial});},useCallback:fn=>fn,useEffect(){}};
  const api={list:async(...args)=>{calls.push({kind:"list",args});return {result:[],hasMore:false};},get:async(...args)=>{calls.push({kind:"get",args});return c;},act:async(...args)=>{calls.push({kind:"act",args});if(options.error)throw options.error;return options.pending??c;}};
  const C=compile("src/pages/operations/RentalComplaintsPanel.tsx",{react:hooks,"@/features/auth/useAuth":{useAuth:()=>({profile:{id:"admin"}})},"@/services/admin-complaint.service":{adminComplaintService:api},"@/services/storage.service":{default:{}},"@/types/complaint.type":labels,"@/components/complaint/ComplaintHistory":{__esModule:true,default:History},"@/utils/apiError":{getApiErrorMessage:e=>e.message},sonner:{toast:{success(){},error:e=>errors.push(e)}}}).default;
  const tree=C();return {tree,html:renderToStaticMarkup(tree),calls,errors,updates};
}
function text(n){if(n==null||typeof n==="boolean")return "";if(Array.isArray(n))return n.map(text).join("");return typeof n==="object"?text(n.props?.children):String(n);}
function find(n,p){if(!n||typeof n!=="object")return;if(Array.isArray(n)){for(const v of n){const f=find(v,p);if(f)return f;}return;}return p(n)?n:find(n.props?.children,p);}
function button(f,label){const n=find(f.tree,n=>n.type==="button"&&text(n)===label);assert.ok(n,"missing button: "+label);return n;}
const tick=()=>new Promise(setImmediate);
test("unclaimed case can only be claimed, without receipt or money confirmation actions",()=>{
  const f=page({case:{allowedActions:["CLAIM"],assignedTo:undefined,stage:"WAITING_ADMIN"}});
  assert.ok(button(f,"Tiếp nhận khiếu nại"));assert.equal(find(f.tree,n=>n.type==="button"&&text(n)==="Ghi kết luận khiếu nại"),undefined);assert.doesNotMatch(f.html,/>Xác nhận đã nhận tiền</);
});
test("ordinary finding sends exact reviewed revision without editing financial obligation",async()=>{
  const f=page();button(f,"Ghi kết luận khiếu nại").props.onClick();await tick();const payload=f.calls.find(c=>c.kind==="act").args[2];
  assert.deepEqual(JSON.parse(JSON.stringify(payload)),{expectedRevision:9,reason:"Đã kiểm tra đầy đủ chứng cứ hai bên",outcome:"RECORD_FINDING"});assert.match(f.html,/Không ghi nhận tiền, xóa nợ/);
});
test("revised settlement requires unchecked-by-default source verification",async()=>{
  const f=page({outcome:"REVISE_SETTLEMENT"});const submit=button(f,"Ghi kết luận khiếu nại");assert.equal(submit.props.disabled,true);submit.props.onClick();await tick();assert.equal(f.calls.length,0);
});
test("verified revised settlement carries current proposal version and still needs both parties",async()=>{
  const f=page({outcome:"REVISE_SETTLEMENT",verified:true});button(f,"Ghi kết luận khiếu nại").props.onClick();await tick();const p=f.calls.find(c=>c.kind==="act").args[2];
  assert.equal(p.expectedRevision,9);assert.equal(p.settlement.expectedProposalVersion,3);assert.equal(p.settlement.otherDeduction,50000);assert.equal(p.settlement.vacantPossessionConfirmed,true);assert.equal(p.settlement.deductions[0].amount,50000);assert.match(f.html,/hai bên đồng ý/);
});
test("stale admin action reloads but never retries or clears the entered reason",async()=>{
  const f=page({error:new Error("Phiên bản đã thay đổi")});button(f,"Ghi kết luận khiếu nại").props.onClick();await tick();
  assert.equal(f.calls.filter(c=>c.kind==="act").length,1);assert.equal(f.calls.filter(c=>c.kind==="get").length,1);assert.equal(f.updates[10].length,0);assert.match(f.errors[0],/đã thay đổi/);
});
test("information request targets a real participant selected by role",async()=>{
  const f=page();button(f,"Yêu cầu bổ sung").props.onClick();await tick();const call=f.calls.find(c=>c.kind==="act");assert.equal(call.args[1],"REQUEST_INFO");assert.equal(call.args[2].requestedFrom,"tenant");
});
test("closing a view during an action prevents its late response from reopening the old detail",async()=>{
  let release;const pending=new Promise(resolve=>{release=resolve;});const f=page({pending});button(f,"Ghi kết luận khiếu nại").props.onClick();button(f,"Đóng").props.onClick();release({});await tick();assert.equal(f.updates[1].at(-1),null);assert.equal(f.updates[10].length,0);
});
test("payment disputes remain available in their own existing panel",()=>{
  const C=compile("src/pages/operations/ComplaintsPage.tsx",{react:{...React,useState:()=>["payment",()=>{}]},"./RentalComplaintsPanel":{__esModule:true,default:()=>React.createElement("p",null,"Rental")},"./PaymentDisputesPanel":{__esModule:true,default:()=>React.createElement("p",null,"Existing payment disputes")}});
  const html=renderToStaticMarkup(C.default());assert.match(html,/Existing payment disputes/);assert.match(html,/Khiếu nại hồ sơ thuê/);
});
test("history shows original agreement and settlement grounds, never raw JSON or forged receipt",()=>{
  const c=example();c.events=[{revision:1,action:"DECIDE",actorRole:"ADMIN",occurredAt:c.openedAt,reason:"Căn cứ ban đầu",metadataJson:'{"settlement":{"otherDeduction":50000},"proposalVersion":3,"evidenceIds":["proof"]}'}];
  const html=renderToStaticMarkup(React.createElement(History,{complaint:c,onProof(){}}));assert.match(html,/50.000 đ/);assert.match(html,/Phiên bản 3/);assert.match(html,/Chứng cứ của phản hồi này/);
  assert.deepEqual(JSON.parse(JSON.stringify(labels.complaintEventContext("broken"))),{evidenceIds:[]});
});


test("admin can read a handover source without a financial calculation",()=>{const c=example();c.sources=[{workflowId:"w",kind:"MOVE_IN",revision:1,status:"PROPOSED",capturedAt:c.openedAt,proposal:{reason:"Hiện trạng đã cùng đối chiếu"},history:[],evidenceIds:["proof"],rentCalculation:{},documents:[]}];const html=renderToStaticMarkup(React.createElement(History,{complaint:c,onProof(){}}));assert.match(html,/Căn cứ: Biên bản nhận nhà/);assert.match(html,/Bằng chứng nguồn 1/);assert.doesNotMatch(html,/Tiền thuê kỳ cuối/);});
