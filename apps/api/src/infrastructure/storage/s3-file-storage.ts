import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { FileStorage } from '../../domain/storage/ports/file-storage';

/** DeleteObjects accepts at most 1000 keys per call. */
const DELETE_BATCH = 1000;

export interface S3StorageConfig {
  endpoint: string;
  /** Endpoint put in signed URLs, when the app reaches storage by another address. */
  publicEndpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  urlTtlSeconds: number;
}

/** Any S3-compatible service: Cloudflare R2 in production, RustFS locally. */
export class S3FileStorage implements FileStorage {
  private readonly client: S3Client;
  private readonly signer: S3Client;

  constructor(private readonly config: S3StorageConfig) {
    const clientConfig = (endpoint: string) =>
      new S3Client({
        endpoint,
        region: config.region,
        // Path-style URLs (endpoint/bucket/key) work with R2, RustFS and MinIO.
        forcePathStyle: true,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
    this.client = clientConfig(config.endpoint);
    this.signer = clientConfig(config.publicEndpoint ?? config.endpoint);
  }

  async put(key: string, body: Uint8Array, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Keys are never reused: clients may cache forever.
        CacheControl: 'private, max-age=31536000, immutable',
      }),
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.config.bucket, Key: key }),
      );
      return true;
    } catch (error) {
      if (
        (error as { $metadata?: { httpStatusCode?: number } }).$metadata
          ?.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  async delete(keys: string[]): Promise<void> {
    for (let start = 0; start < keys.length; start += DELETE_BATCH) {
      const batch = keys.slice(start, start + DELETE_BATCH);
      const result = await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.config.bucket,
          Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
        }),
      );
      // Partial failures do not throw: report them (counts only, no key).
      if (result.Errors?.length) {
        throw new Error(
          `${result.Errors.length} of ${batch.length} objects not deleted`,
        );
      }
    }
  }

  async list(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let token: string | undefined;
    do {
      const page = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.config.bucket,
          Prefix: prefix,
          ContinuationToken: token,
        }),
      );
      for (const object of page.Contents ?? []) {
        if (object.Key) keys.push(object.Key);
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
    return keys;
  }

  signedUrl(key: string): Promise<string> {
    return getSignedUrl(
      this.signer,
      new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
      { expiresIn: this.config.urlTtlSeconds },
    );
  }

  /** Development convenience: creates the bucket when it does not exist. */
  async ensureBucket(): Promise<void> {
    try {
      await this.client.send(
        new HeadBucketCommand({ Bucket: this.config.bucket }),
      );
    } catch {
      await this.client.send(
        new CreateBucketCommand({ Bucket: this.config.bucket }),
      );
    }
  }
}
