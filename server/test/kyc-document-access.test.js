const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const jwt = require('jsonwebtoken');
const models = require('../models');

test('KYC documents are served only to their owner or staff, never from public uploads', async (t) => {
  const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paypay-kyc-access-'));
  const kycDir = path.join(uploadDir, 'kyc');
  fs.mkdirSync(kycDir, { recursive: true });
  fs.mkdirSync(path.join(uploadDir, 'settings'), { recursive: true });
  const fileContent = Buffer.from('%PDF-1.7\nprivate KYC test document\n%%EOF');
  const brandContent = Buffer.from('public brand asset');
  fs.writeFileSync(path.join(kycDir, 'owner-document.pdf'), fileContent);
  fs.writeFileSync(path.join(uploadDir, 'settings', 'brand.txt'), brandContent);
  const previousUploadsDir = process.env.UPLOADS_DIR;
  const previousJwtSecret = process.env.JWT_SECRET;
  process.env.UPLOADS_DIR = uploadDir;
  process.env.JWT_SECRET = 'kyc-document-access-test';
  t.after(() => {
    if (previousUploadsDir === undefined) delete process.env.UPLOADS_DIR;
    else process.env.UPLOADS_DIR = previousUploadsDir;
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
    fs.rmSync(uploadDir, { recursive: true, force: true });
  });

  t.mock.method(models.User, 'findByPk', async (id) => ({
    id: Number(id),
    roleId: Number(id) === 1 ? 1 : 2,
    isActive: true,
    Role: { name: Number(id) === 1 ? 'admin' : 'user' }
  }));
  t.mock.method(models.KycDocument, 'findByPk', async (id) => (
    id === 'document-id'
      ? { id, kycId: 'kyc-id', internalName: 'owner-document.pdf', mimeType: 'application/pdf' }
      : id === 'traversal-id'
        ? { id, kycId: 'kyc-id', internalName: '..\\secret.pdf', mimeType: 'application/pdf' }
      : null
  ));
  t.mock.method(models.Kyc, 'findByPk', async (id) => (
    id === 'kyc-id' ? { id, userId: 7 } : null
  ));

  const { getUploadsDir } = require('../config/uploadStorage');
  const router = require('../routes/kycRoutes');
  const app = express();
  app.use(express.json());
  app.use('/api/uploads/kyc', (_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use('/api/uploads/settings', express.static(path.join(getUploadsDir(), 'settings')));
  app.use('/api/kyc', router);
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(() => { server.closeAllConnections(); server.close(); });

  const tokens = {
    owner: jwt.sign({ userId: 7, type: 'session' }, process.env.JWT_SECRET),
    other: jwt.sign({ userId: 8, type: 'session' }, process.env.JWT_SECRET),
    admin: jwt.sign({ userId: 1, type: 'session' }, process.env.JWT_SECRET)
  };
  const request = async (url, token) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${url}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response;
  };

  const publicFile = await request('/api/uploads/kyc/owner-document.pdf');
  assert.equal(publicFile.status, 404);
  const publicBrand = await request('/api/uploads/settings/brand.txt');
  assert.equal(publicBrand.status, 200);
  assert.deepEqual(Buffer.from(await publicBrand.arrayBuffer()), brandContent);
  const traversalPublic = await request('/api/uploads/settings/..%2Fkyc/owner-document.pdf');
  assert.equal(traversalPublic.status, 404);

  const anonymous = await request('/api/kyc/documents/document-id/file');
  assert.equal(anonymous.status, 401);

  const deniedOwner = await request('/api/kyc/documents/document-id/file', tokens.other);
  assert.equal(deniedOwner.status, 403);

  const traversal = await request('/api/kyc/documents/traversal-id/file', tokens.owner);
  assert.equal(traversal.status, 404);

  const owner = await request('/api/kyc/documents/document-id/file', tokens.owner);
  assert.equal(owner.status, 200);
  assert.equal(owner.headers.get('content-type'), 'application/pdf');
  assert.equal(owner.headers.get('cache-control'), 'private, no-store');
  assert.equal(owner.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(Buffer.from(await owner.arrayBuffer()), fileContent);

  const staff = await request('/api/kyc/admin/documents/document-id/file', tokens.admin);
  assert.equal(staff.status, 200);
  assert.deepEqual(Buffer.from(await staff.arrayBuffer()), fileContent);

  const nonStaff = await request('/api/kyc/admin/documents/document-id/file', tokens.other);
  assert.equal(nonStaff.status, 403);
});
