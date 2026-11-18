import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { load, hookRuntime, icons } from './helpers/kyc-runtime.mjs';

const nodes=node=>!node||typeof node!=='object'?[]:[node,...React.Children.toArray(node.props?.children).flatMap(nodes)];
const text=node=>typeof node==='string'?node:!node||typeof node!=='object'?'':React.Children.toArray(node.props?.children).map(text).join('');
const redux=(role='ADMIN')=>({auth:{authenticated:true,userId:'actor'},user:{status:'succeeded',profile:{id:'actor',role,onBoarded:false}}});
const hooks=runtime=>({'@/store/hooks':{useAppDispatch:()=>()=>({}),useAppSelector:fn=>fn(runtime.state)}});

function fixture(role, getStatus, setInitialPassword=async()=>{}) {
 const runtime=hookRuntime();
 runtime.state=redux(role);
 const Component=load('src/features/onboarding/OnboardingInitializer.tsx',{
  react:runtime.hooks,'lucide-react':icons,
  '@/services/user.service':{__esModule:true,default:{getOnboardingStatus:getStatus,setInitialPassword}},
  ...hooks(runtime),
  sonner:{toast:{success(){},error(){}}},
 },{},'\nmodule.exports.AccountOnboarding=AccountOnboarding;').AccountOnboarding;
 runtime.mount(Component);
 return runtime;
}
// Legacy 4-step payload plus the additive fields; `extra` overrides any of them.
const status=(extra={})=>({completed:false,nextStep:'PROFILE',completedSteps:['PASSWORD'],
 requiredSteps:['PROFILE','ADDRESS','PASSWORD','BANK_ACCOUNT'],version:2,
 passwordSet:true,missingRequirements:[],serviceReady:true,...extra});

for(const role of ['ADMIN','SUPER_ADMIN']) {
 test(`${role}: no modal when a password is set, even with profile/address/bank/KYC missing`,async()=>{
  const runtime=fixture(role,async()=>status({nextStep:'PROFILE',completed:false,missingRequirements:['PROFILE','ADDRESS','BANK_ACCOUNT','KYC']}));
  await runtime.settle();assert.equal(runtime.tree,null);runtime.unmount();
 });
}

test('modal shows only the password step when no password is set',async()=>{
 const runtime=fixture('ADMIN',async()=>status({passwordSet:false,completedSteps:[],nextStep:'PROFILE'}));
 await runtime.settle();
 const names=nodes(runtime.tree).map(n=>n.type?.name);
 assert.ok(names.includes('PasswordStep'));
 for(const gone of ['ProfileStep','AddressStep','BankStep','StepIndicator'])assert.ok(!names.includes(gone));
 runtime.unmount();
});

test('falls back to completedSteps when passwordSet is absent',async()=>{
 const legacy=(completedSteps)=>{const s=status({completedSteps});delete s.passwordSet;return s;};
 const without=fixture('ADMIN',async()=>legacy(['PROFILE']));
 await without.settle();assert.ok(nodes(without.tree).some(n=>n.type?.name==='PasswordStep'));without.unmount();
 const withPw=fixture('ADMIN',async()=>legacy(['PASSWORD']));
 await withPw.settle();assert.equal(withPw.tree,null);withPw.unmount();
});

test('passwordSet wins over a stale completedSteps list',async()=>{
 const runtime=fixture('ADMIN',async()=>status({passwordSet:false,completedSteps:['PASSWORD']}));
 await runtime.settle();assert.ok(nodes(runtime.tree).some(n=>n.type?.name==='PasswordStep'));runtime.unmount();
});

test('a status failure does not block the portal',async()=>{
 const runtime=fixture('ADMIN',async()=>{throw Error('Status unavailable');});
 await runtime.settle();assert.equal(runtime.tree,null);runtime.unmount();
});

test('finishing the password step closes the modal without requiring completed=true',async()=>{
 let submitted;
 const runtime=fixture('ADMIN',async()=>status({passwordSet:false,completed:false}),async req=>{submitted=req;});
 await runtime.settle();
 const step=nodes(runtime.tree).find(n=>n.type?.name==='PasswordStep');
 await step.props.onSubmit('Secret123');await runtime.settle();
 assert.equal(submitted.newPassword,'Secret123');
 assert.equal(runtime.tree,null);runtime.unmount();
});

test('a failed password save keeps the modal open and shows the error',async()=>{
 const runtime=fixture('ADMIN',async()=>status({passwordSet:false}),async()=>{throw Error('Weak password');});
 await runtime.settle();
 const step=nodes(runtime.tree).find(n=>n.type?.name==='PasswordStep');
 await assert.rejects(step.props.onSubmit('Secret123'));await runtime.settle();
 assert.equal(nodes(runtime.tree).find(n=>n.type?.name==='PasswordStep').props.error,'Không thể tạo mật khẩu. Vui lòng thử lại.');runtime.unmount();
});

function reminder(getStatus) {
 const runtime=hookRuntime();
 runtime.state=redux('ADMIN');
 const Component=load('src/features/onboarding/ProfileReminder.tsx',{
  react:runtime.hooks,'lucide-react':icons,
  'react-router-dom':{Link:function Link(){return null;}},
  '@/services/user.service':{__esModule:true,default:{getOnboardingStatus:getStatus}},
  ...hooks(runtime),
 }).default;
 runtime.mount(Component);
 return runtime;
}

test('profile reminder appears only when PROFILE is missing and never mentions bank/KYC/address',async()=>{
 const runtime=reminder(async()=>status({missingRequirements:['PROFILE','ADDRESS','BANK_ACCOUNT','KYC']}));
 await runtime.settle();
 assert.equal(runtime.tree.props.role,'status');
 const copy=text(runtime.tree);
 assert.match(copy,/thông tin cá nhân/);assert.doesNotMatch(copy,/ngân hàng|KYC|địa chỉ/i);
 assert.equal(nodes(runtime.tree).find(n=>n.type?.name==='Link').props.to,'/settings/profile');
 runtime.unmount();
});

for(const [name,payload] of [
 ['only address/bank/KYC missing',status({missingRequirements:['ADDRESS','BANK_ACCOUNT','KYC']})],
 ['nothing missing',status()],
 ['legacy backend without missingRequirements',(()=>{const s=status();delete s.missingRequirements;return s;})()],
]) test(`profile reminder hidden: ${name}`,async()=>{
 const runtime=reminder(async()=>payload);await runtime.settle();assert.equal(runtime.tree,null);runtime.unmount();
});

test('profile reminder stays hidden when the status request fails',async()=>{
 const runtime=reminder(async()=>{throw Error('down');});await runtime.settle();assert.equal(runtime.tree,null);runtime.unmount();
});

test('profile reminder refetches and clears after the stored profile changes',async()=>{
 let missing=['PROFILE'],calls=0;
 const runtime=reminder(async()=>{calls++;return status({missingRequirements:missing});});
 await runtime.settle();assert.ok(runtime.tree);
 missing=[];runtime.state.user.profile={...runtime.state.user.profile,firstName:'An'};
 runtime.update({});await runtime.settle();
 assert.equal(calls,2);assert.equal(runtime.tree,null);runtime.unmount();
});
