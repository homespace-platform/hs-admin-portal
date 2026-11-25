import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './helpers/kyc-runtime.mjs';

const { kycFlowReducer: reduce, initialKycFlowState: init, phaseForStatus, canStartKyc, canCancelKyc } = load('src/lib/kyc-flow.ts');
const plain = v => JSON.parse(JSON.stringify(v)); // vm-realm objects differ by prototype

const STATUSES = ['NOT_VERIFIED', 'PENDING', 'REVIEW_REQUIRED', 'VERIFIED', 'REJECTED', 'EXPIRED'];
const kyc = status => ({ status, verifiedAt: null, provider: 'VNPT', sessionId: null, sessionUrl: null });
const session = { sessionId: 's1', expiresAt: '2099-01-01', maxImageMb: 5 };
const run = (state, ...events) => events.reduce(reduce, state);
const at = status => run(init, { type: 'LOADED', kyc: kyc(status) });
const capturing = () => run(at('NOT_VERIFIED'), { type: 'START' }, { type: 'SESSION_CREATED', session });

test('starts in loading', () => assert.equal(init.phase, 'loading'));

const SCREEN = { NOT_VERIFIED: 'ready', PENDING: 'ready', REVIEW_REQUIRED: 'result', VERIFIED: 'result', REJECTED: 'result', EXPIRED: 'result' };
for (const status of STATUSES) test(`backend ${status} -> ${SCREEN[status]} screen`, () => {
  assert.equal(phaseForStatus(status), SCREEN[status]);
  const state = at(status);
  assert.equal(state.phase, SCREEN[status]);
  assert.equal(state.kyc.status, status);
});

test('start / cancel rules per backend status', () => {
  assert.deepEqual(STATUSES.filter(canStartKyc), ['NOT_VERIFIED', 'PENDING', 'REJECTED', 'EXPIRED']);
  assert.deepEqual(STATUSES.filter(canCancelKyc), ['PENDING', 'REVIEW_REQUIRED']);
});

for (const status of ['VERIFIED', 'REVIEW_REQUIRED']) test(`cannot start when ${status}`, () => {
  const state = at(status);
  assert.equal(reduce(state, { type: 'START' }), state);
  assert.equal(reduce(state, { type: 'START' }).phase, 'result');
});

for (const status of ['NOT_VERIFIED', 'PENDING', 'REJECTED', 'EXPIRED']) test(`can start when ${status}`, () => {
  assert.equal(reduce(at(status), { type: 'START' }).phase, 'starting');
});

test('VERIFIED can never reach starting through any event sequence', () => {
  const events = [{ type: 'START' }, { type: 'RETRY' }, { type: 'SESSION_CREATED', session }, { type: 'START_FAILED', message: 'x' },
    { type: 'CANCEL_REQUEST' }, { type: 'CANCELLED', kyc: kyc('VERIFIED') }, { type: 'CANCEL_FAILED', message: 'x' }, { type: 'LOADED', kyc: kyc('VERIFIED') }];
  let state = at('VERIFIED');
  for (let i = 0; i < 3; i++) for (const e of events) { state = reduce(state, e); assert.notEqual(state.phase, 'starting'); assert.notEqual(state.phase, 'capturing'); }
});

test('happy path: loading -> ready -> starting -> capturing -> finalizing -> result', () => {
  let s = at('NOT_VERIFIED'); assert.equal(s.phase, 'ready');
  s = reduce(s, { type: 'START' }); assert.equal(s.phase, 'starting');
  s = reduce(s, { type: 'SESSION_CREATED', session }); assert.equal(s.phase, 'capturing');
  assert.equal(s.session.sessionId, 's1'); assert.equal(s.kyc.status, 'PENDING'); assert.equal(s.kyc.sessionId, 's1');
  s = reduce(s, { type: 'FINALIZE_START' }); assert.equal(s.phase, 'finalizing'); assert.equal(s.session.sessionId, 's1');
  s = reduce(s, { type: 'FINALIZED', kyc: kyc('VERIFIED') }); assert.equal(s.phase, 'result'); assert.equal(s.kyc.status, 'VERIFIED');
  assert.equal('session' in s, false);
});

for (const status of STATUSES) test(`finalize result ${status} -> ${SCREEN[status]} screen`, () => {
  assert.equal(reduce(capturing(), { type: 'FINALIZED', kyc: kyc(status) }).phase, SCREEN[status]);
  assert.equal(run(capturing(), { type: 'FINALIZE_START' }, { type: 'FINALIZED', kyc: kyc(status) }).phase, SCREEN[status]);
});

test('failed finalize returns to capturing with the same session', () => {
  const s = run(capturing(), { type: 'FINALIZE_START' }, { type: 'FINALIZE_FAILED' });
  assert.equal(s.phase, 'capturing'); assert.equal(s.session.sessionId, 's1');
});

test('rejected/expired result can retry from the result screen', () => {
  for (const status of ['REJECTED', 'EXPIRED']) {
    const s = reduce(reduce(capturing(), { type: 'FINALIZED', kyc: kyc(status) }), { type: 'START' });
    assert.equal(s.phase, 'starting');
  }
});

test('load failure -> error with a retry that reloads', () => {
  let s = reduce(init, { type: 'LOAD_FAILED', message: 'boom' });
  assert.deepEqual(plain(s), { phase: 'error', message: 'boom', kyc: null, retry: 'load' });
  s = reduce(s, { type: 'RETRY' }); assert.equal(s.phase, 'loading');
  assert.equal(reduce(s, { type: 'LOADED', kyc: kyc('PENDING') }).phase, 'ready');
});

test('start failure -> error keeping kyc; retry starts again', () => {
  let s = run(at('REJECTED'), { type: 'START' }, { type: 'START_FAILED', message: 'no vnpt' });
  assert.equal(s.phase, 'error'); assert.equal(s.message, 'no vnpt'); assert.equal(s.retry, 'start'); assert.equal(s.kyc.status, 'REJECTED');
  s = reduce(s, { type: 'RETRY' }); assert.equal(s.phase, 'starting');
});

test('cancel: capturing/ready(PENDING)/result(REVIEW_REQUIRED) -> cancelling -> cancelled', () => {
  for (const s0 of [capturing(), at('PENDING'), at('REVIEW_REQUIRED')]) {
    const s = reduce(s0, { type: 'CANCEL_REQUEST' });
    assert.equal(s.phase, 'cancelling'); assert.equal('session' in s, false, 'capture must unmount while cancelling');
    const done = reduce(s, { type: 'CANCELLED', kyc: kyc('EXPIRED') });
    assert.equal(done.phase, 'cancelled'); assert.equal(done.kyc.status, 'EXPIRED');
    assert.equal(reduce(done, { type: 'START' }).phase, 'starting');
  }
});

test('cancel is refused for statuses that have no cancellable session and while finalizing', () => {
  for (const status of ['NOT_VERIFIED', 'VERIFIED', 'REJECTED', 'EXPIRED']) {
    const s = at(status); assert.equal(reduce(s, { type: 'CANCEL_REQUEST' }), s);
  }
  const f = run(capturing(), { type: 'FINALIZE_START' });
  assert.equal(reduce(f, { type: 'CANCEL_REQUEST' }), f);
});

test('cancel failure -> error whose retry reloads the real status', () => {
  let s = run(capturing(), { type: 'CANCEL_REQUEST' }, { type: 'CANCEL_FAILED', message: 'x' });
  assert.equal(s.phase, 'error'); assert.equal(s.retry, 'load');
  assert.equal(reduce(s, { type: 'RETRY' }).phase, 'loading');
});

test('invalid transitions are ignored (same state object returned)', () => {
  const cases = [
    [init, { type: 'START' }], [init, { type: 'SESSION_CREATED', session }], [init, { type: 'FINALIZED', kyc: kyc('VERIFIED') }],
    [init, { type: 'CANCELLED', kyc: kyc('EXPIRED') }], [init, { type: 'RETRY' }], [init, { type: 'FINALIZE_START' }],
    [at('NOT_VERIFIED'), { type: 'LOADED', kyc: kyc('VERIFIED') }], [at('NOT_VERIFIED'), { type: 'SESSION_CREATED', session }],
    [at('NOT_VERIFIED'), { type: 'FINALIZE_START' }], [at('NOT_VERIFIED'), { type: 'FINALIZED', kyc: kyc('VERIFIED') }],
    [at('NOT_VERIFIED'), { type: 'RETRY' }], [at('NOT_VERIFIED'), { type: 'START_FAILED', message: 'x' }],
    [capturing(), { type: 'START' }], [capturing(), { type: 'LOADED', kyc: kyc('NOT_VERIFIED') }], [capturing(), { type: 'SESSION_CREATED', session }],
    [capturing(), { type: 'FINALIZE_FAILED' }], [capturing(), { type: 'CANCELLED', kyc: kyc('EXPIRED') }],
    [at('VERIFIED'), { type: 'FINALIZED', kyc: kyc('NOT_VERIFIED') }], [at('VERIFIED'), { type: 'FINALIZE_START' }],
    [run(at('NOT_VERIFIED'), { type: 'START' }), { type: 'START' }], [run(at('NOT_VERIFIED'), { type: 'START' }), { type: 'RETRY' }],
  ];
  for (const [state, event] of cases) assert.equal(reduce(state, event), state, `${state.phase} + ${event.type}`);
});

test('late async events cannot resurrect a finished flow', () => {
  const done = run(capturing(), { type: 'FINALIZED', kyc: kyc('VERIFIED') });
  for (const e of [{ type: 'SESSION_CREATED', session }, { type: 'START_FAILED', message: 'x' }, { type: 'CANCELLED', kyc: kyc('EXPIRED') },
    { type: 'LOAD_FAILED', message: 'x' }, { type: 'CANCEL_FAILED', message: 'x' }, { type: 'FINALIZE_FAILED' }])
    assert.equal(reduce(done, e), done, e.type);
});

test('every non-capturing terminal phase keeps enough data to render a result or an error message', () => {
  for (const s of [at('VERIFIED'), at('REJECTED'), run(capturing(), { type: 'CANCEL_REQUEST' }, { type: 'CANCELLED', kyc: kyc('EXPIRED') })]) assert.ok(s.kyc.status);
  assert.ok(reduce(init, { type: 'LOAD_FAILED', message: 'm' }).message);
});
