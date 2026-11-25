import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { load, hookRuntime, icons, html } from './helpers/kyc-runtime.mjs';

const read = file => fs.readFileSync(file, 'utf8');
const flatten = node => !node || typeof node !== 'object' ? [] : [node, ...React.Children.toArray(node.props?.children).flatMap(flatten)];
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const sources = walk('src').filter(f => /\.tsx?$/.test(f)).map(f => [f.replaceAll('\\', '/'), read(f)]);

test('/kyc route exists inside the AuthGuard-protected admin layout', () => {
  const router = read('src/router/index.tsx');
  const guarded = router.slice(router.indexOf('<AuthGuard>'), router.indexOf('</Routes>'));
  assert.match(guarded, /<Route path="\/kyc" element=\{<KycPage \/>\} \/>/);
  assert.ok(router.indexOf('path="/kyc"') > router.indexOf('<AuthGuard>'), '/kyc must be below AuthGuard, never next to the public login route');
  assert.ok(router.indexOf('path="/kyc"') < router.indexOf('path="*"'));
  assert.match(read('src/pages/kyc/KycPage.tsx'), /<KycFlow \/>/);
  assert.match(read('src/features/auth/AuthGuard.tsx'), /!authenticated[\s\S]*<Navigate to="\/" state=\{\{ from: location \}\}/);
});

test('login keeps the full /kyc URL (path + query) and validates it before using it as redirect', () => {
  const login = read('src/pages/login/LoginPage.tsx');
  assert.match(login, /from\.search/);
  assert.match(login, /safeReturnTo\(/);
  assert.match(login, /login\(target\)/);
  assert.match(read('src/features/auth/useAuth.ts'), /redirectUri: window\.location\.origin \+ path/);
});

test('KycSection sends the admin to /kyc and no longer captures or creates sessions', () => {
  const section = read('src/components/settings/sections/KycSection.tsx');
  assert.match(section, /kycUrl\(settingsReturnTo\(pathname, search\)\)/);
  assert.match(section, /navigate\(/);
  assert.doesNotMatch(section, /createVnptSession|VnptKycCapture|finalizeVnpt|vnptStep/);
  assert.match(section, /<KycVerifiedDetailsPanel/);
});

test('createVnptSession is called only from KycFlow', () => {
  const users = sources.filter(([, text]) => text.includes('createVnptSession')).map(([file]) => file).sort();
  assert.deepEqual(users, ['src/components/kyc/KycFlow.tsx', 'src/services/kyc.service.ts']);
  assert.deepEqual(sources.filter(([, t]) => /VnptKycCapture/.test(t)).map(([f]) => f).sort(),
    ['src/components/kyc/KycFlow.tsx', 'src/components/settings/sections/VnptKycCapture.tsx']);
});

test('no other component links straight into capture; /kyc is the only entry', () => {
  for (const [file, text] of sources) if (!/^src\/(lib\/kyc-return|router\/index|layouts\/AdminLayout|components\/settings\/sections\/KycSection)/.test(file))
    assert.doesNotMatch(text, /["'`]\/kyc[?"'`]/, file);
});

test('camera permission, nonce and origin pinning stay in VnptKycCapture', () => {
  const capture = read('src/components/settings/sections/VnptKycCapture.tsx');
  assert.match(capture, /allow="camera"/);
  assert.match(capture, /src="\/kyc\/vnpt-frame\.html"/);
  assert.match(capture, /event\.origin !== window\.location\.origin/);
  assert.match(capture, /event\.source !== frame\.current\?\.contentWindow/);
  assert.match(capture, /crypto\.randomUUID\(\)/);
  assert.match(capture, /data\.nonce !== nonce/);
  assert.match(capture, /postMessage\(\{ \.\.\.data, nonce \}, window\.location\.origin\)/);
  assert.match(capture, /variant\?: "dialog" \| "page"/);
});

test('VnptKycCapture: dialog variant is a modal dialog, page variant is inline, both keep the camera iframe', () => {
  for (const [variant, tag] of [[undefined, 'dialog'], ['dialog', 'dialog'], ['page', 'div']]) {
    const runtime = hookRuntime();
    const Capture = load('src/components/settings/sections/VnptKycCapture.tsx', {
      react: runtime.hooks, 'lucide-react': icons, '@/types/kyc.type': load('src/types/kyc.type.ts'), '@/services/kyc.service': { __esModule: true, default: {} },
    }, { window: { addEventListener() {}, removeEventListener() {}, setTimeout() { return 1; }, clearTimeout() {}, location: { origin: 'http://x' } }, crypto }).default;
    const tree = runtime.mount(Capture, { session: { sessionId: 's', maxImageMb: 1 }, onResult() {}, onCancel() {}, variant });
    assert.equal(tree.type, tag, String(variant));
    assert.equal(flatten(tree).find(n => n.type === 'iframe').props.allow, 'camera');
    assert.match(html(runtime), /Xác minh VNPT eKYC/);
    runtime.unmount();
  }
});

test('Settings dialog closes itself on navigation so it cannot cover /kyc', () => {
  const modal = read('src/components/settings/SettingsModal.tsx');
  assert.match(modal, /useLocation\(\)/);
  assert.match(modal, /openedAt\.current !== pathname[\s\S]*onCloseRef\.current\(\)/);
});

// ---- behaviour of KycFlow with a real reducer and fake services ----
function mountFlow({ status, search = '', session = { sessionId: 's1', expiresAt: '2099', maxImageMb: 1 }, startError, loadError }) {
  const runtime = hookRuntime(), calls = [], navigations = [], capture = () => null;
  const hooks = { ...runtime.hooks, useReducer(reducer, initial) { const [s, set] = runtime.hooks.useState(initial); return [s, a => set(prev => reducer(prev, a))]; } };
  const Flow = load('src/components/kyc/KycFlow.tsx', {
    react: hooks, 'lucide-react': icons,
    'react-router-dom': { useNavigate: () => (to, opts) => navigations.push([to, opts]), useSearchParams: () => [new URLSearchParams(search)] },
    '@/services/kyc.service': { __esModule: true, default: {
      getStatus: async () => { calls.push('status'); if (loadError) throw new Error('x'); return { status, provider: 'VNPT', verifiedAt: null, sessionId: null, sessionUrl: null }; },
      createVnptSession: async () => { calls.push('create'); if (startError) throw startError; return session; },
      cancelSession: async () => { calls.push('cancel'); return { status: 'EXPIRED', provider: 'VNPT', verifiedAt: null, sessionId: null, sessionUrl: null }; },
    } },
    '@/components/settings/sections/VnptKycCapture': { __esModule: true, default: capture },
    '@/components/kyc/kycStatusMeta': load('src/components/kyc/kycStatusMeta.ts', { 'lucide-react': icons }),
    '@/lib/kyc-flow': load('src/lib/kyc-flow.ts'), '@/lib/kyc-return': load('src/lib/kyc-return.ts'),
    '@/features/user/userSlice': { fetchCurrentUser: a => a },
    '@/store/hooks': { useAppDispatch: () => () => {}, useAppSelector: fn => fn({ auth: { userId: 'alice' } }) },
  }, {}, '\nmodule.exports.default=AccountKycFlow;').default;
  runtime.mount(Flow);
  const button = text => flatten(runtime.tree).find(n => n.type === 'button' && JSON.stringify(n.props.children).includes(text));
  return { runtime, calls, navigations, capture, button };
}

test('VERIFIED goes straight to the result screen and never offers or runs a new session', async () => {
  const { runtime, calls, button } = mountFlow({ status: 'VERIFIED' });
  await runtime.settle();
  assert.match(html(runtime), /Danh tính đã được xác minh/);
  assert.doesNotMatch(html(runtime), /Xác minh ngay|Xác minh lại|Tiếp tục xác minh/);
  assert.equal(button('Xác minh'), undefined);
  assert.deepEqual(calls, ['status']);
  assert.ok(button('Quay lại'));
  runtime.unmount();
});

test('Back goes to the validated returnTo with replace; unsafe returnTo falls back to settings', async () => {
  for (const [search, expected] of [
    ['?returnTo=%2Fsettings%2Fprofile%3Ftab%3D1', '/settings/profile?tab=1'], ['', '/settings/account-security'],
    ['?returnTo=%2F%2Fevil.com', '/settings/account-security'], ['?returnTo=https%3A%2F%2Fevil.com', '/settings/account-security'],
    ['?returnTo=%5Cevil', '/settings/account-security'], ['?returnTo=%2Fkyc', '/settings/account-security'],
  ]) {
    const { runtime, navigations, button } = mountFlow({ status: 'VERIFIED', search });
    await runtime.settle();
    button('Quay lại').props.onClick();
    assert.equal(navigations.length, 1); assert.equal(navigations[0][0], expected); assert.equal(navigations[0][1].replace, true);
    runtime.unmount();
  }
});

test('NOT_VERIFIED starts exactly one session and mounts the full-page capture', async () => {
  const { runtime, calls, capture, button } = mountFlow({ status: 'NOT_VERIFIED' });
  await runtime.settle();
  assert.ok(button('Xác minh ngay'));
  const start = flatten(runtime.tree).find(n => n.type === 'button' && /bg-primary/.test(n.props.className));
  start.props.onClick(); await runtime.settle();
  assert.deepEqual(calls, ['status', 'create']);
  const node = flatten(runtime.tree).find(n => n.type === capture);
  assert.equal(node.props.variant, 'page'); assert.equal(node.props.session.sessionId, 's1');
  runtime.unmount();
});

test('every failure shows an error with Thử lại and Quay lại', async () => {
  const load1 = mountFlow({ status: 'NOT_VERIFIED', loadError: true });
  await load1.runtime.settle();
  assert.match(html(load1.runtime), /Không tải được trạng thái KYC/);
  assert.ok(load1.button('Thử lại')); assert.ok(load1.button('Quay lại'));
  load1.runtime.unmount();

  const start = mountFlow({ status: 'NOT_VERIFIED', startError: Object.assign(new Error('x'), { isAxiosError: true, response: { data: { code: 2501 } } }) });
  await start.runtime.settle();
  flatten(start.runtime.tree).find(n => n.type === 'button' && /bg-primary/.test(n.props.className)).props.onClick(); await start.runtime.settle();
  assert.match(html(start.runtime), /VNPT eKYC chưa được cấu hình/);
  assert.ok(start.button('Thử lại')); assert.ok(start.button('Quay lại'));
  start.runtime.unmount();
});

test('loading screen already offers a way back', () => {
  const { runtime, button } = mountFlow({ status: 'NOT_VERIFIED' });
  assert.match(html(runtime), /Đang tải trạng thái KYC/);
  assert.ok(button('Quay lại'));
  runtime.unmount();
});
