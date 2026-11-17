import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url),ts=require("typescript"),React=require("react"),{renderToStaticMarkup}=require("react-dom/server");
function compile(file,dependencies={}){const loaded={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("../"+file,import.meta.url),"utf8"),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:loaded,exports:loaded.exports,require:name=>dependencies[name]??require(name),window:{open:()=>null}});return loaded.exports;}
const labels=compile("src/types/complaint.type.ts"),History=compile("src/components/complaint/ComplaintHistory.tsx",{"@/types/complaint.type":labels}).default;
const example=()=>({id:"case",rentalRequestId:"rental",contractId:"contract",tenantId:"tenant",landlordId:"owner",category:"DEPOSIT_SETTLEMENT",reason:"Phản đối khấu trừ cọc",openedBy:"tenant",openedAt:"2026-11-03T03:00:00Z",status:"ESCALATED",stage:"UNDER_REVIEW",revision:9,assignedTo:"admin",overdue:false,adminReviewCount:0,adminReviewLimit:2,finalClosed:false,allowedActions:["CLAIM","REQUEST_INFO","DECIDE"],events:[],evidenceIds:[],settlement:{version:3,status:"DISPUTED",deduction:100000,refund:19900000,balance:0,note:"Ghi chú nguồn",ownerApproved:false,accepted:false}});
function page(options={}){
  const c={...example(),...options.case},states=[[],c,"ESCALATED","",false,1,false,false,"",false,"Đã kiểm tra đầy đủ chứng cứ hai bên","TENANT"],updates=states.map(()=>[]);
  let index=0,refIndex=0;const refs=[],calls=[],errors=[];
  const hooks={...React,useState(initial){const i=index++;return [i<states.length?states[i]:initial,v=>updates[i].push(v)];},useRef(initial){const i=refIndex++;return refs[i]??(refs[i]={current:initial});},useCallback:fn=>fn,useEffect(){}};
  const api={list:async(...args)=>{calls.push({kind:"list",args});return {result:[],hasMore:false};},get:async(...args)=>{calls.push({kind:"get",args});return c;},act:async(...args)=>{calls.push({kind:"act",args});if(options.error)throw options.error;return options.pending??c;}};
  const C=compile("src/pages/operations/RentalComplaintsPanel.tsx",{react:hooks,"@/features/auth/useAuth":{useAuth:()=>({profile:{id:options.actor??"admin"}})},"@/services/admin-complaint.service":{adminComplaintService:api},"@/services/storage.service":{default:{}},"@/types/complaint.type":labels,"@/components/complaint/ComplaintHistory":{__esModule:true,default:History},"@/utils/apiError":{getApiErrorMessage:e=>e.message},sonner:{toast:{success(){},error:e=>errors.push(e)}}}).default;
  const tree=C();return {tree,html:renderToStaticMarkup(tree),calls,errors,updates};
}
function text(n){if(n==null||typeof n==="boolean")return "";if(Array.isArray(n))return n.map(text).join("");return typeof n==="object"?text(n.props?.children):String(n);}
function find(n,p){if(!n||typeof n!=="object")return;if(Array.isArray(n)){for(const v of n){const f=find(v,p);if(f)return f;}return;}return p(n)?n:find(n.props?.children,p);}
function button(f,label){const n=find(f.tree,n=>n.type==="button"&&text(n)===label);assert.ok(n,"missing button: "+label);return n;}
const tick=()=>new Promise(setImmediate);
test("unclaimed case can only be claimed, without receipt or money confirmation actions",()=>{
  const f=page({case:{allowedActions:["CLAIM"],assignedTo:undefined,stage:"WAITING_ADMIN"}});
  assert.ok(button(f,"Tiếp nhận khiếu nại"));assert.equal(find(f.tree,n=>n.type==="button"&&text(n)==="Gửi kết luận lần 1"),undefined);assert.doesNotMatch(f.html,/>Xác nhận đã nhận tiền</);
});
test("ordinary finding sends exact reviewed revision without editing financial obligation",async()=>{
  const f=page();button(f,"Gửi kết luận lần 1").props.onClick();await tick();const payload=f.calls.find(c=>c.kind==="act").args[2];
  assert.deepEqual(JSON.parse(JSON.stringify(payload)),{expectedRevision:9,reason:"Đã kiểm tra đầy đủ chứng cứ hai bên",outcome:"RECORD_FINDING"});assert.match(f.html,/Không sửa hợp đồng, quyết toán/);
});
test("admin has no settlement editor and always submits a text finding",async()=>{
  const f=page();assert.doesNotMatch(f.html,/Khấu trừ admin đề xuất|Lập lại đề xuất|Hướng giải quyết khiếu nại/);
  button(f,"Gửi kết luận lần 1").props.onClick();await tick();
  const payload=f.calls.find(c=>c.kind==="act").args[2];assert.equal(payload.outcome,"RECORD_FINDING");assert.equal(payload.settlement,undefined);
});
test("claimed admin can exchange messages without a decision",async()=>{
  const f=page({case:{allowedActions:["COMMENT","REQUEST_INFO","DECIDE"]}});button(f,"Gửi trao đổi").props.onClick();await tick();
  const call=f.calls.find(c=>c.kind==="act");assert.equal(call.args[1],"COMMENT");assert.deepEqual(JSON.parse(JSON.stringify(call.args[2])),{expectedRevision:9,reason:"Đã kiểm tra đầy đủ chứng cứ hai bên"});
});
test("admin details are rendered inside a labelled modal",()=>{
  const f=page();assert.ok(find(f.tree,n=>n.type==="dialog"&&n.props["aria-labelledby"]==="complaint-admin-title"));
});

test("stale admin action reloads but never retries or clears the entered reason",async()=>{
  const f=page({error:new Error("Phiên bản đã thay đổi")});button(f,"Gửi kết luận lần 1").props.onClick();await tick();
  assert.equal(f.calls.filter(c=>c.kind==="act").length,1);assert.equal(f.calls.filter(c=>c.kind==="get").length,1);assert.equal(f.updates[10].length,0);assert.match(f.errors[0],/đã thay đổi/);
});
test("information request targets a real participant selected by role",async()=>{
  const f=page();button(f,"Yêu cầu bổ sung").props.onClick();await tick();const call=f.calls.find(c=>c.kind==="act");assert.equal(call.args[1],"REQUEST_INFO");assert.equal(call.args[2].requestedFrom,"tenant");
});
test("closing a view during an action prevents its late response from reopening the old detail",async()=>{
  let release;const pending=new Promise(resolve=>{release=resolve;});const f=page({pending});button(f,"Gửi kết luận lần 1").props.onClick();button(f,"Đóng").props.onClick();release({});await tick();assert.equal(f.updates[1].at(-1),null);assert.equal(f.updates[10].length,0);
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


test("admin can read an early-exit source without a financial calculation",()=>{const c=example();c.sources=[{workflowId:"w",kind:"EARLY_EXIT",revision:1,status:"PROPOSED",capturedAt:c.openedAt,proposal:{reason:"Hiện trạng đã cùng đối chiếu",endExclusive:"2026-12-20"},history:[],evidenceIds:["proof"],rentCalculation:{},documents:[]}];const html=renderToStaticMarkup(React.createElement(History,{complaint:c,onProof(){}}));assert.match(html,/Căn cứ: Thỏa thuận chấm dứt sớm/);assert.match(html,/Bằng chứng nguồn 1/);assert.doesNotMatch(html,/Tiền thuê kỳ cuối/);});

test("second admin review clearly warns that the conclusion closes the case",async()=>{
  const f=page({case:{adminReviewCount:1}});assert.match(f.html,/Kết luận lần 2 sẽ đóng hồ sơ/);
  button(f,"Kết luận lần 2 và đóng hồ sơ").props.onClick();await tick();const call=f.calls.find(c=>c.kind==="act");
  assert.equal(call.args[1],"DECIDE");assert.deepEqual(JSON.parse(JSON.stringify(call.args[2])),{expectedRevision:9,reason:"Đã kiểm tra đầy đủ chứng cứ hai bên",outcome:"RECORD_FINDING"});
});
test("first concluded case waits for participants rather than letting admin intervene immediately",()=>{
  const f=page({case:{status:"OPEN",stage:"FOLLOW_UP",adminReviewCount:1,allowedActions:[]}});
  assert.match(f.html,/admin chỉ xử lý lần 2 khi một bên chuyển lại hồ sơ/);assert.equal(find(f.tree,n=>n.type==="textarea"),undefined);
});
test("final closed case and party-admin access both explain their read-only state",()=>{
  const final=page({case:{status:"RESOLVED",adminReviewCount:2,finalClosed:true,allowedActions:[]}});
  assert.match(final.html,/Đã kết luận lần 2 và đóng hồ sơ/);assert.equal(find(final.tree,n=>n.type==="textarea"),undefined);
  const own=page({actor:"owner",case:{allowedActions:[]}});assert.match(own.html,/không được tự xử lý khiếu nại/);
});
