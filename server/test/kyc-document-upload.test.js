const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const models = require('../models');
const KycController = require('../controllers/KycController');
const { shortenKycFileName, KYC_MAX_FILE_BYTES } = require('../helpers/kycFiles');

function fakeRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function setup(t) {
  const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paypay-kyc-upload-'));
  const previous = process.env.UPLOADS_DIR;
  process.env.UPLOADS_DIR = uploadDir;
  t.after(() => {
    if (previous === undefined) delete process.env.UPLOADS_DIR;
    else process.env.UPLOADS_DIR = previous;
    fs.rmSync(uploadDir, { recursive: true, force: true });
  });
  t.mock.method(models.Kyc, 'findOne', async () => ({ id: 'kyc-id', userId: 7 }));
  const created = [];
  t.mock.method(models.KycDocument, 'create', async (data) => { created.push(data); return data; });
  return { uploadDir, created };
}

const upload = async (file, fileName) => {
  const res = fakeRes();
  await KycController.uploadDocument(
    { user: { userId: 7 }, body: { kycId: 'kyc-id', type: 'BI_NUIT', file, fileName } },
    res
  );
  return res;
};

const pdfDataUrl = (bytes) => `data:application/pdf;base64,${Buffer.alloc(bytes, 'a').toString('base64')}`;

test('KYC file names are shortened and normalized', () => {
  assert.equal(shortenKycFileName('Cópia do BI & NUIT (versão final).PDF', '.pdf'), 'copia-do-bi-nuit-versao-final.pdf');
  const long = shortenKycFileName(`${'documento muito comprido '.repeat(10)}.pdf`, '.pdf');
  assert.ok(long.length <= 44);
  assert.ok(!/[\s-]\.pdf$/.test(long));
  assert.equal(shortenKycFileName('###.pdf', '.pdf'), 'documento.pdf');
  assert.equal(shortenKycFileName('scan.exe', '.pdf'), 'scan.pdf');
});

test('KYC upload stores a short name and a short internal name', async (t) => {
  const { uploadDir, created } = setup(t);
  const res = await upload(pdfDataUrl(1024), `Digitalização BI e NUIT de ${'x'.repeat(200)}.pdf`);

  assert.equal(res.statusCode, 201);
  const doc = created[0];
  assert.ok(doc.originalName.length <= 44);
  assert.match(doc.originalName, /^digitalizacao-bi-e-nuit-de-x+\.pdf$/);
  assert.match(doc.internalName, /^[a-z0-9]{12,24}\.pdf$/);
  assert.equal(doc.extension, '.pdf');
  assert.equal(doc.size, 1024);
  assert.ok(fs.existsSync(path.join(uploadDir, 'kyc', doc.internalName)));
});

test('KYC upload accepts exactly 10 MB and rejects bigger files', async (t) => {
  const { uploadDir, created } = setup(t);

  const ok = await upload(pdfDataUrl(KYC_MAX_FILE_BYTES), 'bi.pdf');
  assert.equal(ok.statusCode, 201);

  const tooBig = await upload(pdfDataUrl(KYC_MAX_FILE_BYTES + 1), 'bi.pdf');
  assert.equal(tooBig.statusCode, 413);
  assert.match(tooBig.body.error, /10 MB/);
  assert.equal(created.length, 1);
  assert.equal(fs.readdirSync(path.join(uploadDir, 'kyc')).length, 1);
});

test('KYC upload rejects invalid or unsupported files', async (t) => {
  const { created } = setup(t);
  assert.equal((await upload('not-a-data-url', 'bi.pdf')).statusCode, 400);
  assert.equal((await upload('data:text/html;base64,PGgxPg==', 'bi.pdf')).statusCode, 400);
  assert.equal(created.length, 0);
});
