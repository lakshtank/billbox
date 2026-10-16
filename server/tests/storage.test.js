const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { StorageService, storageService } = require('../services/storage.service');

test('StorageService - Local Storage Mode', async (t) => {
  const testFilename = `test-receipt-${Date.now()}.txt`;
  const testContent = Buffer.from('Test receipt content for BillBox unit tests');

  await t.test('Initializes with local provider by default', () => {
    const info = storageService.getStorageInfo();
    assert.equal(info.provider, 'local');
    assert.equal(info.isCloud, false);
  });

  await t.test('saveFile saves buffer to local disk and returns relative URL', async () => {
    const res = await storageService.saveFile({
      buffer: testContent,
      filename: testFilename,
      mimeType: 'text/plain',
    });

    assert.equal(res.provider, 'local');
    assert.equal(res.key, testFilename);
    assert.equal(res.url, `/uploads/${testFilename}`);

    // Verify file actually exists in uploads dir
    const uploadedPath = path.join(storageService.uploadDir, testFilename);
    assert.ok(fs.existsSync(uploadedPath));
  });

  await t.test('getFileBuffer retrieves saved file content matching original buffer', async () => {
    const retrieved = await storageService.getFileBuffer(testFilename);
    assert.deepEqual(retrieved, testContent);
  });

  await t.test('getDownloadUrl returns /uploads/ filename in local mode', async () => {
    const url = await storageService.getDownloadUrl(testFilename);
    assert.equal(url, `/uploads/${testFilename}`);
  });

  await t.test('getPresignedUploadUrl returns /api/upload fallback in local mode', async () => {
    const res = await storageService.getPresignedUploadUrl(testFilename, 'text/plain');
    assert.equal(res.uploadUrl, '/api/upload');
    assert.equal(res.provider, 'local');
  });

  await t.test('deleteFile removes file from local disk', async () => {
    const deleted = await storageService.deleteFile(testFilename);
    assert.equal(deleted, true);

    const uploadedPath = path.join(storageService.uploadDir, testFilename);
    assert.ok(!fs.existsSync(uploadedPath));
  });
});

test('StorageService - S3 / R2 Cloud Mode Simulation', async (t) => {
  // Create an instance configured with mock S3 credentials
  const originalEnv = { ...process.env };

  process.env.STORAGE_PROVIDER = 's3';
  process.env.AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
  process.env.AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
  process.env.AWS_BUCKET_NAME = 'billbox-test-bucket';
  process.env.AWS_REGION = 'us-east-1';

  const cloudStorage = new StorageService();

  await t.test('Identifies as configured cloud storage', () => {
    assert.equal(cloudStorage.isCloudConfigured(), true);
    const info = cloudStorage.getStorageInfo();
    assert.equal(info.provider, 's3');
    assert.equal(info.isCloud, true);
    assert.equal(info.bucket, 'billbox-test-bucket');
    assert.equal(info.region, 'us-east-1');
  });

  await t.test('Generates valid SigV4 presigned download URL', () => {
    const signedUrl = cloudStorage.generatePresignedUrl('GET', 'receipts/test.pdf', 3600);
    assert.ok(signedUrl.startsWith('https://s3.us-east-1.amazonaws.com/billbox-test-bucket/receipts/test.pdf?'));
    assert.ok(signedUrl.includes('X-Amz-Algorithm=AWS4-HMAC-SHA256'));
    assert.ok(signedUrl.includes('X-Amz-Credential=AKIAIOSFODNN7EXAMPLE'));
    assert.ok(signedUrl.includes('X-Amz-Signature='));
    assert.ok(signedUrl.includes('X-Amz-Expires=3600'));
  });

  await t.test('Generates presigned upload URL for direct S3 PUT', async () => {
    const res = await cloudStorage.getPresignedUploadUrl('new-invoice.pdf', 'application/pdf', 900);
    assert.equal(res.provider, 's3');
    assert.ok(res.key.startsWith('receipts/'));
    assert.ok(res.uploadUrl.includes('X-Amz-Algorithm=AWS4-HMAC-SHA256'));
    assert.ok(res.uploadUrl.includes('X-Amz-Expires=900'));
  });

  // Restore env
  process.env = originalEnv;
});
