import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url), ts = require('typescript');
const source = fs.readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
const module = { exports: {} };
const mocks = { vite: { defineConfig: value => value }, '@vitejs/plugin-react': () => {}, '@tailwindcss/vite': () => {} };
vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { URL })(name => mocks[name] ?? require(name), module, module.exports);
const validate = module.exports.validateNotificationEnvironment;
const keys = ['VITE_WEB_APP_URL', 'VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_APP_ID', 'VITE_FIREBASE_VAPID_KEY'];
const valid = Object.fromEntries(keys.map(key => [key, key === 'VITE_WEB_APP_URL' ? 'https://web.homespace.test' : 'public-test-value']));

test('missing public notification configuration fails by field name without leaking values', () => {
  for (const key of keys) {
    assert.throws(() => validate({ ...valid, [key]: '' }), error => error.message === `${key} is required`);
  }
});
test('web app destination must be a plain HTTP(S) origin', () => {
  assert.doesNotThrow(() => validate(valid));
  for (const value of ['https://user:password@web.test', 'javascript:alert(1)', 'https://web.test/path', 'https://web.test?key=private', 'https://web.test#private']) {
    assert.throws(() => validate({ ...valid, VITE_WEB_APP_URL: value }), /HTTP\(S\) origin/);
  }
});
