/**
 * Object Storage Interface
 *
 * Provider-neutral abstraction for object storage.
 * Concrete implementations (S3, GCS, local) registered per environment.
 *
 * Future domains:
 * - Report/document upload (Prompt 111)
 * - Profile photo upload
 * - Insurance document storage
 *
 * Owned by: Platform Foundation (Prompt 87)
 */

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface StorageClient {
  /**
   * Upload an object. Returns the storage key.
   */
  put(key: string, data: Buffer, contentType: string, metadata?: Record<string, string>): Promise<string>;

  /**
   * Download an object as a Buffer.
   */
  get(key: string): Promise<Buffer>;

  /**
   * Delete an object.
   */
  delete(key: string): Promise<void>;

  /**
   * Check if an object exists.
   */
  exists(key: string): Promise<boolean>;

  /**
   * Generate a time-limited signed URL for client download.
   * Never expose permanent storage URLs.
   */
  createSignedDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;

  /**
   * Generate a time-limited signed URL for client upload.
   */
  createSignedUploadUrl(
    key: string,
    contentType: string,
    maxSizeBytes: number,
    expiresInSeconds: number,
  ): Promise<string>;
}

// ---------------------------------------------------------------------------
// Null storage (for tests / environments without object storage)
// ---------------------------------------------------------------------------

export class NullStorageClient implements StorageClient {
  private readonly _store = new Map<string, { data: Buffer; contentType: string }>();

  async put(key: string, data: Buffer, contentType: string): Promise<string> {
    this._store.set(key, { data, contentType });
    return key;
  }

  async get(key: string): Promise<Buffer> {
    const entry = this._store.get(key);
    if (!entry) throw new Error(`Object not found: ${key}`);
    return entry.data;
  }

  async delete(key: string): Promise<void> {
    this._store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this._store.has(key);
  }

  async createSignedDownloadUrl(key: string, _expiresInSeconds: number): Promise<string> {
    return `http://localhost:8080/storage/${key}?signed=test`;
  }

  async createSignedUploadUrl(key: string, _contentType: string, _maxSizeBytes: number, _expiresInSeconds: number): Promise<string> {
    return `http://localhost:8080/storage/${key}/upload?signed=test`;
  }
}
