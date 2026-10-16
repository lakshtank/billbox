const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

/**
 * Storage Service for BillBox
 * Supports:
 *  - 'local' (Default): Local disk storage in server/uploads/ with base64 database caching
 *  - 's3': Amazon Web Services S3 Object Storage
 *  - 'r2': Cloudflare R2 (S3-compatible, zero-egress fees)
 *
 * Implements native AWS Signature Version 4 (SigV4) to support S3 & R2
 * without requiring heavy external SDK packages.
 */

class StorageService {
  constructor() {
    this.uploadDir = path.resolve(
      __dirname,
      '..',
      process.env.UPLOAD_DIR || 'uploads'
    );
    if (!fs.existsSync(this.uploadDir)) {
      try {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      } catch (err) {
        console.warn('[StorageService] Unable to create upload directory:', err.message);
      }
    }

    this.initConfiguration();
  }

  /**
   * Initializes or refreshes storage configuration from environment variables
   */
  initConfiguration() {
    this.provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

    // S3 & Cloudflare R2 credentials
    this.accessKeyId =
      process.env.STORAGE_ACCESS_KEY_ID ||
      process.env.AWS_ACCESS_KEY_ID ||
      process.env.R2_ACCESS_KEY_ID ||
      null;

    this.secretAccessKey =
      process.env.STORAGE_SECRET_ACCESS_KEY ||
      process.env.AWS_SECRET_ACCESS_KEY ||
      process.env.R2_SECRET_ACCESS_KEY ||
      null;

    this.bucketName =
      process.env.STORAGE_BUCKET ||
      process.env.AWS_BUCKET_NAME ||
      process.env.R2_BUCKET_NAME ||
      null;

    this.region =
      process.env.STORAGE_REGION ||
      process.env.AWS_REGION ||
      (this.provider === 'r2' ? 'auto' : 'us-east-1');

    this.endpoint =
      process.env.STORAGE_ENDPOINT ||
      process.env.R2_ENDPOINT ||
      (this.provider === 's3' && this.region
        ? `https://s3.${this.region}.amazonaws.com`
        : null);

    this.publicUrlPrefix =
      process.env.STORAGE_PUBLIC_URL ||
      process.env.CDN_URL ||
      null;

    this.isCloud = Boolean(
      (this.provider === 's3' || this.provider === 'r2') &&
        this.accessKeyId &&
        this.secretAccessKey &&
        this.bucketName
    );
  }

  /**
   * Returns whether cloud storage is active and configured
   */
  isCloudConfigured() {
    return this.isCloud;
  }

  /**
   * Returns current active storage provider info
   */
  getStorageInfo() {
    return {
      provider: this.isCloud ? this.provider : 'local',
      isCloud: this.isCloud,
      bucket: this.isCloud ? this.bucketName : null,
      region: this.isCloud ? this.region : null,
      publicUrlPrefix: this.publicUrlPrefix,
    };
  }

  /**
   * Saves a file buffer to storage.
   * In local mode, writes to server/uploads/.
   * In cloud mode (S3/R2), uploads directly to bucket.
   *
   * @param {Object} options
   * @param {Buffer} options.buffer
   * @param {string} options.filename
   * @param {string} options.mimeType
   * @returns {Promise<{ key: string, url: string, provider: string }>}
   */
  async saveFile({ buffer, filename, mimeType }) {
    if (!buffer || !filename) {
      throw new Error('StorageService.saveFile requires buffer and filename.');
    }

    const cleanFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `receipts/${Date.now()}-${cleanFilename}`;

    if (this.isCloud) {
      try {
        await this._uploadToS3(key, buffer, mimeType || 'application/octet-stream');
        const url = this.publicUrlPrefix
          ? `${this.publicUrlPrefix.replace(/\/$/, '')}/${key}`
          : await this.getDownloadUrl(key);

        return {
          key,
          url,
          provider: this.provider,
        };
      } catch (err) {
        console.warn(`[StorageService] Cloud upload failed (${err.message}), falling back to local disk.`);
      }
    }

    // Local Disk Strategy
    const localFilePath = path.join(this.uploadDir, cleanFilename);
    fs.writeFileSync(localFilePath, buffer);

    return {
      key: cleanFilename,
      url: `/uploads/${cleanFilename}`,
      provider: 'local',
    };
  }

  /**
   * Retrieves a file as a Buffer.
   * @param {string} key
   * @returns {Promise<Buffer>}
   */
  async getFileBuffer(key) {
    if (!key) throw new Error('Key is required to retrieve file.');

    if (this.isCloud && key.startsWith('receipts/')) {
      return this._downloadFromS3(key);
    }

    // Local Disk fallback
    const cleanFilename = path.basename(key);
    const localPath = path.join(this.uploadDir, cleanFilename);
    if (!fs.existsSync(localPath)) {
      throw new Error(`Local file not found: ${cleanFilename}`);
    }
    return fs.readFileSync(localPath);
  }

  /**
   * Deletes a file from storage.
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async deleteFile(key) {
    if (!key) return false;

    if (this.isCloud && key.startsWith('receipts/')) {
      try {
        await this._deleteFromS3(key);
        return true;
      } catch (err) {
        console.warn(`[StorageService] S3 delete error: ${err.message}`);
      }
    }

    const cleanFilename = path.basename(key);
    const localPath = path.join(this.uploadDir, cleanFilename);
    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
        return true;
      } catch (err) {
        console.warn(`[StorageService] Local delete error: ${err.message}`);
      }
    }
    return false;
  }

  /**
   * Generates a temporary secure download/view URL.
   * For S3/R2: generates a presigned GET URL with expiration.
   * For local: returns standard application `/uploads/:filename` path.
   *
   * @param {string} key
   * @param {number} expiresInSeconds (default 3600 = 1 hour)
   * @returns {Promise<string>}
   */
  async getDownloadUrl(key, expiresInSeconds = 3600) {
    if (!key) return '';

    if (this.isCloud && key.startsWith('receipts/')) {
      return this.generatePresignedUrl('GET', key, expiresInSeconds);
    }

    const cleanFilename = path.basename(key);
    return `/uploads/${cleanFilename}`;
  }

  /**
   * Generates a presigned PUT URL for direct client-to-bucket upload.
   * Allows frontend to bypass backend server compute when uploading large PDFs/images.
   *
   * @param {string} filename
   * @param {string} mimeType
   * @param {number} expiresInSeconds (default 900 = 15 mins)
   * @returns {Promise<{ uploadUrl: string, key: string, provider: string }>}
   */
  async getPresignedUploadUrl(filename, mimeType, expiresInSeconds = 900) {
    const cleanFilename = path.basename(filename || 'receipt.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `receipts/${Date.now()}-${cleanFilename}`;

    if (this.isCloud) {
      const uploadUrl = await this.generatePresignedUrl('PUT', key, expiresInSeconds, {
        'content-type': mimeType || 'application/octet-stream',
      });
      return {
        uploadUrl,
        key,
        provider: this.provider,
      };
    }

    // Local mode does not support direct presigned PUT, client must POST to /api/upload
    return {
      uploadUrl: '/api/upload',
      key: cleanFilename,
      provider: 'local',
    };
  }

  // ─── Native SigV4 S3 / R2 Request & Presigning Implementation ─────────────────

  /**
   * Generates an AWS Signature Version 4 Presigned URL
   */
  generatePresignedUrl(method, objectKey, expiresInSeconds = 3600, extraHeaders = {}) {
    if (!this.isCloud) {
      return `/uploads/${path.basename(objectKey)}`;
    }

    const now = new Date();
    const dateStamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '').substring(0, 8);
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');

    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const host = this._getHost();

    const queryParams = {
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${this.accessKeyId}/${credentialScope}`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': String(expiresInSeconds),
      'X-Amz-SignedHeaders': 'host',
    };

    const canonicalQueryString = Object.keys(queryParams)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
      .join('&');

    const canonicalUri = `/${this.bucketName}/${encodeURI(objectKey)}`;
    const canonicalHeaders = `host:${host}\n`;
    const signedHeaders = 'host';

    const canonicalRequest = [
      method.toUpperCase(),
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      'UNSIGNED-PAYLOAD',
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const signingKey = this._getSignatureKey(this.secretAccessKey, dateStamp, this.region, 's3');
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    const protocol = this.endpoint && this.endpoint.startsWith('http://') ? 'http' : 'https';
    return `${protocol}://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
  }

  _getHost() {
    if (this.endpoint) {
      return this.endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
    return `s3.${this.region}.amazonaws.com`;
  }

  _getSignatureKey(key, dateStamp, regionName, serviceName) {
    const kDate = crypto.createHmac('sha256', `AWS4${key}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(regionName).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(serviceName).digest();
    return crypto.createHmac('sha256', kService).update('aws4_request').digest();
  }

  async _uploadToS3(key, buffer, contentType) {
    const url = new URL(this.generatePresignedUrl('PUT', key, 300));
    return new Promise((resolve, reject) => {
      const client = url.protocol === 'http:' ? http : https;
      const req = client.request(
        url,
        {
          method: 'PUT',
          headers: {
            'Content-Type': contentType,
            'Content-Length': buffer.length,
          },
        },
        (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`S3 upload returned HTTP status ${res.statusCode}`));
          }
        }
      );
      req.on('error', reject);
      req.write(buffer);
      req.end();
    });
  }

  async _downloadFromS3(key) {
    const url = new URL(this.generatePresignedUrl('GET', key, 300));
    return new Promise((resolve, reject) => {
      const client = url.protocol === 'http:' ? http : https;
      client
        .get(url, (res) => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`S3 download returned HTTP status ${res.statusCode}`));
          }
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks)));
        })
        .on('error', reject);
    });
  }

  async _deleteFromS3(key) {
    const url = new URL(this.generatePresignedUrl('DELETE', key, 300));
    return new Promise((resolve, reject) => {
      const client = url.protocol === 'http:' ? http : https;
      const req = client.request(url, { method: 'DELETE' }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`S3 delete returned HTTP status ${res.statusCode}`));
        }
      });
      req.on('error', reject);
      req.end();
    });
  }
}

// Export singleton instance
const storageService = new StorageService();

module.exports = {
  StorageService,
  storageService,
};
