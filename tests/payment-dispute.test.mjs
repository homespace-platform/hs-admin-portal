import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url),ts=require("typescript"),React=require("react"),{renderToStaticMarkup}=require("react-dom/server");
function compile(file,dependencies){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("../"+file,import.meta.url),"utf8"),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:name=>dependencies[name]??require(name),window:{open:()=>null}});return module.exports;}
const labels=compile("src/types/payment-dispute.type.ts",{});
const example=()=>({id:"case",paymentId:"payment",payerId:"tenant",payeeId:"owner",openedBy:"tenant",reason:"Cần kiểm tra khoản tiền",openedAt:"2026-11-03T03:00:00Z",status:"ESCALATED",paymentStatus:"DISPUTED",amount:3000000,currency:"VND",revision:7,allowedActions:["CLAIM"],events:[],evidences:[{storageId:"proof"}]});
function page(options={}){
  const c={...example(),...options.case};let index=0,refIndex=0;
  const states=[[c],c,"ESCALATED",1,false,false,"",false,options.reason??"Đã đọc toàn bộ ý kiến và chứng cứ",options.resolution??"REVIEW_TRANSFER"],updates=states.map(()=>[]),refs=[],calls=[],errors=[];
  const api={list:async()=>({result:[c],hasMore:false}),get:async id=>{calls.push({kind:"get",id});return {...c,revision:8};},act:async(...args)=>{calls.push({kind:"act",args});if(options.error)throw options.error;return c;}};
  const hooks={...React,useState(initial){const i=index++;return [i<states.length?states[i]:initial,value=>updates[i].push(value)];},useRef(initial){const i=refIndex++;return refs[i]??(refs[i]={current:initial});},useCallback(fn){return fn;},useEffect(){}};
  const C=compile("src/pages/operations/ComplaintsPage.tsx",{
    react:hooks,"@/features/auth/useAuth":{useAuth:()=>({profile:{id:"admin"}})},"@/services/admin-payment-dispute.service":{adminPaymentDisputeService:api},
    "@/services/storage.service":{default:{}},"@/types/payment-dispute.type":labels,"@/utils/apiError":{getApiErrorMessage:e=>e.message},sonner:{toast:{success(){},error:e=>errors.push(e)}}
  }).default;
  const tree=C();return {tree,html:renderToStaticMarkup(tree),calls,errors,updates};
}
function text(n){if(n==null||typeof n==="boolean")return "";if(Array.isArray(n))return n.map(text).join("");if(typeof n!=="object")return String(n);return text(n.props?.children);}
function find(n,predicate){if(!n||typeof n!=="object")return;if(Array.isArray(n)){for(const item of n){const found=find(item,predicate);if(found)return found;}return;}if(predicate(n))return n;return find(n.props?.children,predicate);}
function button(f,label){const found=find(f.tree,n=>n.type==="button"&&text(n)===label);assert.ok(found,`button ${label}`);return found;}
const tick=()=>new Promise(setImmediate);

test("unclaimed case offers explicit claim and never a decision or receipt action",()=>{
  const f=page();assert.ok(button(f,"Tiếp nhận xử lý"));assert.equal(find(f.tree,n=>n.type==="button"&&text(n)==="Áp dụng hướng xử lý"),undefined);
  assert.equal(find(f.tree,n=>n.type==="button"&&/Xác nhận.*nhận tiền/.test(text(n))),undefined);assert.match(f.html,/Bên nhận phải tự xác nhận/);
});
test("admin decision sends reviewed revision and workflow route without amount or receipt changes",async()=>{
  const f=page({case:{assignedTo:"admin",allowedActions:["CLAIM","DECIDE"]}});button(f,"Áp dụng hướng xử lý").props.onClick();await tick();
  const request=f.calls.find(c=>c.kind==="act");assert.deepEqual(request.args,["case","DECIDE",7,"Đã đọc toàn bộ ý kiến và chứng cứ","REVIEW_TRANSFER"]);
});
test("stale admin decision reloads the case and keeps the reason without posting another decision",async()=>{
  const f=page({case:{assignedTo:"admin",allowedActions:["DECIDE"]},error:new Error("Phiên bản đã thay đổi")});button(f,"Áp dụng hướng xử lý").props.onClick();await tick();
  assert.equal(f.calls.filter(c=>c.kind==="act").length,1);assert.equal(f.calls.filter(c=>c.kind==="get").length,1);assert.equal(f.updates[8].length,0);assert.match(f.errors[0],/đã thay đổi/);
});
test("taking over another admin is an explicit claim with a reviewed version",async()=>{
  const f=page({case:{assignedTo:"other-admin",allowedActions:["CLAIM"]}});button(f,"Chuyển việc xử lý về tôi").props.onClick();await tick();
  const request=f.calls.find(c=>c.kind==="act");assert.equal(request.args[1],"CLAIM");assert.equal(request.args[2],7);assert.equal(request.args[4],undefined);
});
test("review is disabled when no evidence exists",()=>{
  const f=page({case:{assignedTo:"admin",allowedActions:["DECIDE"],evidences:[]}});assert.equal(button(f,"Áp dụng hướng xử lý").props.disabled,true);assert.match(f.html,/Chưa có chứng cứ/);
});

test("audit shows the route from each proposal and tolerates old metadata",()=>{
  const f=page({case:{events:[{revision:1,action:"PROPOSE",actorRole:"TENANT",reason:"Cần báo lại chứng từ",metadataJson:'{"resolution":"REOPEN_TRANSFER"}'}]}});
  assert.match(f.html,/Mở lại bước gửi chứng từ/);
  assert.equal(labels.eventResolution('null'),undefined);
  assert.equal(labels.eventResolution('{broken'),undefined);
});
