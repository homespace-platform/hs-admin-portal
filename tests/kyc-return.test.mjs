import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './helpers/kyc-runtime.mjs';

const { safeReturnTo, parseKycParams, kycUrl, settingsReturnTo, DEFAULT_RETURN_TO } = load('src/lib/kyc-return.ts');
const plain = v => JSON.parse(JSON.stringify(v)); // vm-realm objects differ by prototype
const FALLBACK = '/settings/account-security';

test('default return target is the account & security settings page', () => {
  assert.equal(DEFAULT_RETURN_TO, FALLBACK);
  assert.equal(safeReturnTo(undefined), FALLBACK);
});

for (const ok of [
  '/settings/account-security', '/settings/profile?tab=1', '/dashboard#section', '/properties/view?id=a-b_c&x=1#top',
  '/a%20b', '/a%2Fb', '/search?q=https://example.com', '/x?next=//y', '/', '/kycx', '/settings/kyc',
  '/' + 'a'.repeat(299),
]) test(`accepts ${ok.slice(0, 40)}`, () => assert.equal(safeReturnTo(ok), ok));

for (const bad of [
  '//evil.com', '///evil.com', 'https://evil.com', 'http://evil.com/x', 'javascript:alert(1)', 'data:text/html,x', 'evil.com', 'settings', '',
  '\\\\evil', '\\evil', '/\\evil', '/ok\\evil', '/a/\\b',
  '%2F%2Fevil.com', '%2f%2fevil.com', '/%2Fevil.com', '/%2f%2fevil.com', '%5Cevil', '/%5Cevil', '/%5cevil', '%2F%5Cevil',
  '/ok\nLocation:x', '/ok\r\nSet-Cookie: a=b', '/ok%0aLocation:x', '/ok%0D%0Ax', '/\t/evil.com', '/%09/evil.com', '/ok\u0000', '/ok%00', '/\u007f',
  ' /ok', ' //evil.com', '%20//evil.com', '/%', '/%E0%A4%A', 
  '/' + 'a'.repeat(300), 'a'.repeat(301),
  '/kyc', '/kyc?returnTo=/kyc', '/kyc/', '/KYC#x'.toLowerCase(), '/kyc#x',
]) test(`rejects ${JSON.stringify(bad).slice(0, 50)}`, () => assert.equal(safeReturnTo(bad), FALLBACK));

test('rejects non-string values', () => {
  for (const v of [null, undefined, 0, 1, true, {}, ['/ok'], ['//evil.com'], [], () => '/ok', Symbol('x')]) assert.equal(safeReturnTo(v), FALLBACK);
});

test('custom fallback is returned for unsafe input', () => assert.equal(safeReturnTo('//x', '/dashboard'), '/dashboard'));

test('length limit is exactly 300 characters', () => {
  assert.equal(safeReturnTo('/' + 'a'.repeat(299)).length, 300);
  assert.equal(safeReturnTo('/' + 'a'.repeat(300)), FALLBACK);
});

test('a valid-looking value never resolves to another origin', () => {
  for (const v of ['/a', '/a?b=//c', '/a#//c', '/a/../b', '/%2e%2e/b']) {
    const out = safeReturnTo(v);
    assert.equal(new URL(out, 'https://admin.example').origin, 'https://admin.example');
  }
});

test('parseKycParams reads returnTo from a query string or URLSearchParams', () => {
  assert.deepEqual(plain(parseKycParams('?returnTo=%2Fsettings%2Fprofile%3Ftab%3D1')), { returnTo: '/settings/profile?tab=1' });
  assert.deepEqual(plain(parseKycParams(new URLSearchParams({ returnTo: '/dashboard' }))), { returnTo: '/dashboard' });
  assert.deepEqual(plain(parseKycParams('')), { returnTo: FALLBACK });
  assert.deepEqual(plain(parseKycParams('?returnTo=')), { returnTo: FALLBACK });
});

test('parseKycParams rejects unsafe, double-encoded-slash and repeated values', () => {
  for (const q of [
    '?returnTo=%2F%2Fevil.com', '?returnTo=https%3A%2F%2Fevil.com', '?returnTo=%252F%252Fevil.com', '?returnTo=%2F%255Cevil',
    '?returnTo=javascript%3Aalert(1)', '?returnTo=%5Cevil', '?returnTo=%2Fok%0ALocation%3Ax', '?returnTo=%2Fa&returnTo=%2Fb',
    '?returnTo=%2F%252F%252Fevil.com%2F%2F',
  ]) {
    const { returnTo } = parseKycParams(q);
    assert.ok(returnTo === FALLBACK || !/^\/[/\\]/.test(returnTo), q);
  }
  for (const q of ['?returnTo=%2F%2Fevil.com', '?returnTo=https%3A%2F%2Fevil.com', '?returnTo=%252F%252Fevil.com', '?returnTo=javascript%3Aalert(1)', '?returnTo=%5Cevil', '?returnTo=%2Ffoo&returnTo=%2Fbar'])
    assert.equal(parseKycParams(q).returnTo, FALLBACK, q);
});

test('parseKycParams ignores every other query parameter (no client= mode in admin)', () => {
  assert.deepEqual(plain(parseKycParams('?client=mobile&returnTo=%2Fdashboard&x=1')), { returnTo: '/dashboard' });
  assert.equal(Object.keys(parseKycParams('?client=mobile')).join(), 'returnTo');
});

test('kycUrl builds /kyc?returnTo=<encoded> and round-trips through parseKycParams', () => {
  assert.equal(kycUrl('/settings/account-security'), '/kyc?returnTo=%2Fsettings%2Faccount-security');
  const url = kycUrl('/settings/profile?tab=1&x=2#h');
  assert.equal(parseKycParams(url.slice(url.indexOf('?'))).returnTo, '/settings/profile?tab=1&x=2#h');
  assert.equal(kycUrl('//evil.com'), '/kyc?returnTo=%2Fsettings%2Faccount-security');
});

test('settingsReturnTo keeps a /settings/* page, otherwise uses the account & security page', () => {
  assert.equal(settingsReturnTo('/settings/profile', '?a=1'), '/settings/profile?a=1');
  assert.equal(settingsReturnTo('/settings/account-security'), '/settings/account-security');
  assert.equal(settingsReturnTo('/dashboard', ''), FALLBACK);
  assert.equal(settingsReturnTo('/settingsx/a'), FALLBACK);
  assert.equal(settingsReturnTo('/settings//evil.com'), '/settings//evil.com'); // still a same-origin path
  assert.equal(settingsReturnTo('/settings/a\b'), FALLBACK);
});

// Login return (allowKyc): the dashboard guard sends the admin back to /kyc?returnTo=... after signing in.
test('a login return keeps /kyc and its query (allowKyc), while returnTo itself still refuses /kyc', () => {
  const target = '/kyc?returnTo=%2Fsettings%2Faccount-security';
  assert.equal(safeReturnTo(target, '/dashboard', true), target);
  assert.equal(safeReturnTo('/kyc', '/dashboard', true), '/kyc');
  assert.equal(safeReturnTo(target, '/dashboard'), '/dashboard');
});

for (const bad of ['//evil.com', 'https://evil.com', '/\\evil', '/%2F%2Fevil.com', '/kyc\nLocation:x', 'javascript:alert(1)', '']) {
  test(`allowKyc never lets ${JSON.stringify(bad)} through`, () => assert.equal(safeReturnTo(bad, '/dashboard', true), '/dashboard'));
}
