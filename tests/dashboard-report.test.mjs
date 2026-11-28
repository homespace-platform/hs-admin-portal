import test from 'node:test';
import assert from 'node:assert/strict';
import { load, hookRuntime, clock, icons } from './helpers/kyc-runtime.mjs';

const report = load('src/lib/dashboard-report.ts');
const permissions = load('src/config/permissions.ts');

test('CSV quotes values and neutralizes formula prefixes after controls or whitespace', () => {
  for (const text of ['=SUM(A1)', ' \t@SUM(A1)', '\u0001+cmd', '\r\n-2+3']) assert.equal(report.csvField(text), `"'${text}"`);
  assert.equal(report.csvField('Quận "1", TP.HCM'), '"Quận ""1"", TP.HCM"');
  assert.equal(report.csvField(null), '""');
});

test('Explorer links allow only validated Sepolia transaction hashes', () => {
  const hash = `0x${'a'.repeat(64)}`;
  assert.equal(report.explorerLink(11155111, hash), `https://sepolia.etherscan.io/tx/${hash}`);
  for (const value of ['javascript:alert(1)', 'https://evil.test', `${hash}/oops`, null]) assert.equal(report.explorerLink(11155111, value), null);
  assert.equal(report.explorerLink(1, hash), null);
});

test('Date range validation covers inclusive boundaries, reverse dates and invalid calendar dates', () => {
  assert.equal(report.statisticsRangeError('2026-01-01', '2026-04-02', 'DAY'), null);
  assert.ok(report.statisticsRangeError('2026-01-01', '2026-04-03', 'DAY'));
  assert.ok(report.statisticsRangeError('2026-02-30', '2026-03-01', 'DAY'));
  assert.ok(report.statisticsRangeError('2026-12-01', '2026-11-01', 'MONTH'));
  assert.equal(report.statisticsRangeError('2024-01-01', '2026-12-31', 'MONTH'), null);
  assert.ok(report.statisticsRangeError('2024-01-01', '2027-01-01', 'MONTH'));
});

test('Money formatting preserves exact decimal strings beyond the safe integer range', () => {
  assert.equal(report.money('9007199254740993.25'), '9.007.199.254.740.993,25 ₫');
  assert.equal(report.money('-0.50'), '-0,50 ₫');
  assert.equal(report.money(null), '—');
  assert.equal(report.money(Infinity), '—');
  assert.equal(report.age(null), '—');
  assert.equal(report.age(86400), '1 ngày');
  assert.equal(report.money('1.234567890123456789e+18'), '1.234.567.890.123.456.789 ₫');
  assert.equal(report.money('-5e-3'), '-0,005 ₫');
});

test('Raw response parsing preserves money decimals and arrays without changing strings or safe counts', () => {
  const raw = '{"code":1000,"result":{"revenueToday":9007199254740993.25,"revenueMonth":123.45,"kpi":{"gmvVnd":{"value":9007199254740993,"previous":2.5e+3}},"series":{"membershipByTier":{"PRO":[1.234567890123456789e18,42]}},"city":"Escaped \\"amountVnd\\": 1.23", "count":10,"available":true,"missing":null}}';
  const parsed = report.parseDashboardResponse(raw);
  assert.equal(parsed.code, 1000);
  assert.equal(parsed.result.revenueToday, '9007199254740993.25');
  assert.equal(parsed.result.revenueMonth, '123.45');
  assert.equal(parsed.result.kpi.gmvVnd.value, '9007199254740993');
  assert.equal(parsed.result.kpi.gmvVnd.previous, '2.5e+3');
  assert.equal(parsed.result.series.membershipByTier.PRO[0], '1.234567890123456789e18');
  assert.equal(parsed.result.series.membershipByTier.PRO[1], 42);
  assert.equal(parsed.result.count, 10);
  assert.equal(parsed.result.city, 'Escaped "amountVnd": 1.23');
  assert.equal(parsed.result.available, true);
  assert.equal(parsed.result.missing, null);
});

test('Admin routes require their matching permissions and KYC does not inherit USER_VIEW', () => {
  for (const [path, permission] of [['/analytics/statistics', 'STATISTICS_VIEW'], ['/blockchain', 'BLOCKCHAIN_VIEW'], ['/users/kyc', 'KYC_VIEW']]) {
    const rule = permissions.ruleForPath(path);
    assert.equal(permissions.hasPermission([], rule.permission, rule.mode), false);
    assert.equal(permissions.hasPermission([permission], rule.permission, rule.mode), true);
    assert.equal(permissions.hasPermission(['USER_VIEW'], rule.permission, rule.mode), false);
  }
  const overview = permissions.ruleForPath('/dashboard');
  assert.equal(permissions.hasPermission(['LISTING_VIEW'], overview.permission, overview.mode), true);
  assert.equal(permissions.hasPermission([], overview.permission, overview.mode), false);
});

test('Dashboard requests abort and hide the previous owner or permission response before the next render', async () => {
  const runtime = hookRuntime();
  let profile = { id: 'owner-a' };
  let granted = ['STATISTICS_VIEW'];
  const pending = [];
  const loader = (path, signal) => new Promise(resolve => pending.push({ path, signal, resolve }));
  const { useDashboardData } = load('src/hooks/useDashboardData.ts', {
    react: runtime.hooks,
    '@/store/hooks': { useAppSelector: callback => callback({ user: { profile }, permission: { granted } }) },
    '@/services/admin-dashboard.service': { getDashboardData: loader },
    '@/utils/userUtils': { getApiErrorMessage: () => 'Request failed' },
  }, { AbortController });
  runtime.mount(() => useDashboardData('/report'));
  pending[0].resolve({ privateTotal: 10 });
  await runtime.settle();
  assert.equal(runtime.tree.data.privateTotal, 10);
  profile = { id: 'owner-b' };
  runtime.update();
  assert.equal(runtime.tree.data, undefined);
  assert.equal(pending[0].signal.aborted, true);
  pending[1].resolve({ privateTotal: 20 });
  await runtime.settle();
  assert.equal(runtime.tree.data.privateTotal, 20);
  granted = [];
  runtime.update();
  assert.equal(runtime.tree.data, undefined);
  assert.equal(pending[1].signal.aborted, true);
  runtime.unmount();
});

test('Blockchain refreshes only the visible current page while proofs are open and status cards apply filters', async () => {
  const runtime = hookRuntime();
  const timer = clock();
  const document = { visibilityState: 'visible' };
  const refreshed = [];
  const paths = [];
  const refreshSummary = () => refreshed.push('summary');
  const refreshProofs = () => refreshed.push('proofs');
  const refreshPayments = () => refreshed.push('payments');
  const summary = {
    network: { name: 'Sepolia', chainId: 11155111, enabled: true },
    counts: { PENDING: 1, SUBMITTED: 0, CONFIRMED: 2, FAILED: 1 },
    integrity: { counts: {} }, byErrorCode: {},
  };
  const stub = () => null;
  const { default: BlockchainPage } = load('src/pages/blockchain/BlockchainExplorerPage.tsx', {
    react: runtime.hooks,
    'lucide-react': icons,
    '@/components/ui/button': { Button: stub },
    '@/config/permissions': permissions,
    '@/hooks/usePermission': { useHasPermission: () => true },
    '@/components/dashboard/DashboardParts': { Empty: stub, MetricCard: stub, PageHeading: stub, QueryFeedback: stub, Section: stub, Status: stub, controlClass: '' },
    '@/components/dashboard/ReportDialog': { __esModule: true, default: stub },
    '@/lib/dashboard-report': report,
    '@/services/admin-dashboard.service': { getDashboardPage: stub, checkProof: stub },
    '@/utils/userUtils': { getApiErrorMessage: () => 'Request failed' },
    '@/hooks/useDashboardData': { useDashboardData: path => {
      paths.push(path);
      if (path?.endsWith('/summary')) return { data: summary, refresh: refreshSummary };
      return { refresh: path?.includes('membership-eth-payments') ? refreshPayments : refreshProofs };
    } },
  }, { window: timer.globals, document });
  const elements = node => Array.isArray(node) ? node.flatMap(elements) : node?.props ? [node, ...elements(node.props.children)] : [];
  runtime.mount(BlockchainPage);
  await timer.advance(14999);
  assert.deepEqual(refreshed, []);
  await timer.advance(1);
  assert.deepEqual(refreshed, ['summary', 'proofs']);
  document.visibilityState = 'hidden';
  await timer.advance(15000);
  assert.equal(refreshed.length, 2);
  document.visibilityState = 'visible';
  elements(runtime.tree).find(node => node.props.role === 'tab' && node.props.children === 'Thanh toán ETH').props.onClick();
  runtime.update();
  await timer.advance(15000);
  assert.deepEqual(refreshed.slice(-2), ['summary', 'payments']);
  elements(runtime.tree).find(node => node.props['aria-label']?.startsWith('Lọc bằng chứng:') && node.key === 'FAILED').props.onClick();
  runtime.update();
  assert.ok(paths.some(path => path?.includes('/proofs?status=FAILED&page=1&size=20')));
  assert.equal(elements(runtime.tree).find(node => node.props.name === 'status').props.value, 'FAILED');
  summary.counts.PENDING = 0;
  runtime.update();
  assert.equal(timer.size, 0);
  const previous = refreshed.length;
  await timer.advance(30000);
  assert.equal(refreshed.length, previous);
  runtime.unmount();
  assert.equal(timer.size, 0);
});

test('KYC queue applies the same filters to totals and zero-based pages and opens the selected account only', () => {
  const runtime = hookRuntime();
  const paths = [];
  const stub = () => null;
  const { default: QueuePage } = load('src/pages/users/KycQueuePage.tsx', {
    react: runtime.hooks,
    '@/components/ui/button': { Button: stub },
    '@/components/users/UserKycPanel': { __esModule: true, default: stub },
    '@/components/dashboard/ReportDialog': { __esModule: true, default: stub },
    '@/components/dashboard/DashboardParts': { Empty: stub, MetricCard: stub, PageHeading: stub, QueryFeedback: stub, Section: stub, Status: stub, controlClass: '' },
    '@/lib/dashboard-report': report,
    '@/hooks/useDashboardData': { useDashboardData: path => {
      paths.push(path);
      return { data: path.includes('/counts') ? [{ status: 'PENDING', count: 2 }] : { items: [{ userId: 'opaque-account-id', status: 'PENDING', provider: 'VNPT' }], total: 41, size: 20 }, refresh: stub };
    } },
  }, { FormData: class { constructor(values) { this.values = values; } get(key) { return this.values[key]; } } });
  const elements = node => Array.isArray(node) ? node.flatMap(elements) : node?.props ? [node, ...elements(node.props.children)] : [];
  runtime.mount(QueuePage);
  assert.ok(paths.includes('/api/v1/admin/kyc?page=0&size=20'));
  elements(runtime.tree).find(node => node.props.children === 'Tiếp').props.onClick();
  runtime.update();
  assert.ok(paths.includes('/api/v1/admin/kyc?page=1&size=20'));
  elements(runtime.tree).find(node => node.type === 'form').props.onSubmit({ preventDefault() {}, currentTarget: { status: 'PENDING', provider: 'VNPT', overdue: 'true' } });
  runtime.update();
  assert.ok(paths.includes('/api/v1/admin/kyc?status=PENDING&provider=VNPT&overdue=true&page=0&size=20'));
  assert.ok(paths.includes('/api/v1/admin/kyc/counts?status=PENDING&provider=VNPT&overdue=true'));
  assert.equal(elements(runtime.tree).filter(node => node.props.userId).length, 0);
  elements(runtime.tree).find(node => node.props.children === 'Xem KYC').props.onClick();
  runtime.update();
  assert.deepEqual(elements(runtime.tree).filter(node => node.props.userId).map(node => node.props.userId), ['opaque-account-id']);
  runtime.unmount();
});
