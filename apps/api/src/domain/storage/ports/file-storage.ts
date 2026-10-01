/** Private object storage (Cloudflare R2 in production, RustFS locally). */
export interface FileStorage {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  /** Missing keys are ignored. */
  delete(keys: string[]): Promise<void>;
  /** Every key starting with `prefix` (e.g. all the files of a user). */
  list(prefix: string): Promise<string[]>;
  /** Short-lived URL giving read access to a private object. */
  signedUrl(key: string): Promise<string>;
}

export const FILE_STORAGE = Symbol('FileStorage');
