const test = require('node:test');
const assert = require('node:assert/strict');
const { Setting } = require('../models');
const controller = require('../controllers/SettingsController');

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

const withdrawal = { withdrawalFeeAmount: 5.5, withdrawalMinValue: 20, withdrawalMaxValue: 5000 };

test('saving withdrawal settings preserves branding and company data', async (t) => {
  const branding = {
    platformName: 'Existing platform', logoImg: '/logo.png', contacts: 'Existing contact',
    address: 'Existing address', emails: 'existing@example.invalid',
    ownerName: 'Existing owner', additionalInfo: 'Existing information'
  };
  const settings = {
    ...branding,
    async update(payload) {
      assert.deepEqual(payload, withdrawal);
      Object.assign(this, payload);
    }
  };
  t.mock.method(Setting, 'findOne', async () => settings);
  const res = response();
  await controller.saveSettings({ body: { withdrawalFeeAmount: '5.50', withdrawalMinValue: '20', withdrawalMaxValue: '5000', platformName: 'Ignored' } }, res);
  assert.equal(res.statusCode, 200);
  for (const [key, value] of Object.entries(branding)) assert.equal(settings[key], value);
  for (const [key, value] of Object.entries(withdrawal)) assert.equal(settings[key], value);
});

test('first withdrawal settings save uses model defaults for unrelated fields', async (t) => {
  t.mock.method(Setting, 'findOne', async () => null);
  t.mock.method(Setting, 'create', async (payload) => {
    assert.deepEqual(payload, withdrawal);
    return { platformName: 'SAMPAY', ...payload };
  });
  const res = response();
  await controller.saveSettings({ body: withdrawal }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.platformName, 'SAMPAY');
});

test('zero withdrawal fees and disabled limits remain supported', async (t) => {
  t.mock.method(Setting, 'findOne', async () => null);
  t.mock.method(Setting, 'create', async (payload) => payload);
  const res = response();
  await controller.saveSettings({ body: { withdrawalFeeAmount: '0', withdrawalMinValue: '0', withdrawalMaxValue: '0' } }, res);
  assert.deepEqual(res.body, { withdrawalFeeAmount: 0, withdrawalMinValue: 0, withdrawalMaxValue: 0 });
});
