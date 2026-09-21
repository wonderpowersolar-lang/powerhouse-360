import { Client as MinioClient } from "minio";

/**
 * Objektspeicher-Abstraktion (WP-1.5, Masterplan §3 Files): Metadaten leben in
 * Postgres (`Document`), Inhalte hier. Adapter-Prinzip: MinIO ist die
 * Dev-/Prod-Implementierung, `MemoryStorage` trägt die Tests — die Fachlogik
 * (`storeDocumentContent`) kennt nur das Interface.
 */
export type ObjectStorage = {
  put: (key: string, bytes: Buffer, contentType: string) => Promise<void>;
  get: (key: string) => Promise<Buffer>;
  delete: (key: string) => Promise<void>;
};

export class MemoryStorage implements ObjectStorage {
  readonly objects = new Map<string, { bytes: Buffer; contentType: string }>();
  async put(key: string, bytes: Buffer, contentType: string): Promise<void> {
    this.objects.set(key, { bytes, contentType });
  }
  async get(key: string): Promise<Buffer> {
    const obj = this.objects.get(key);
    if (!obj) throw new Error(`Objekt ${key} nicht gefunden`);
    return obj.bytes;
  }
  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }
}

export type MinioConfig = {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
};

/** Dev-Defaults = docker-compose (ph360-minio); Prod setzt alles per Env. */
export function minioConfigFromEnv(): MinioConfig {
  return {
    endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
    port: Number(process.env.MINIO_PORT ?? "9000"),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY ?? "ph360",
    secretKey: process.env.MINIO_SECRET_KEY ?? "ph360_dev_secret",
    bucket: process.env.MINIO_BUCKET ?? "ph360-documents",
  };
}

export class MinioStorage implements ObjectStorage {
  private readonly client: MinioClient;
  private readonly bucket: string;
  private bucketEnsured = false;

  constructor(config: MinioConfig = minioConfigFromEnv()) {
    this.client = new MinioClient({
      endPoint: config.endPoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
    this.bucket = config.bucket;
  }

  private async ensureBucket(): Promise<void> {
    if (this.bucketEnsured) return;
    if (!(await this.client.bucketExists(this.bucket))) {
      await this.client.makeBucket(this.bucket);
    }
    this.bucketEnsured = true;
  }

  async put(key: string, bytes: Buffer, contentType: string): Promise<void> {
    await this.ensureBucket();
    await this.client.putObject(this.bucket, key, bytes, bytes.length, {
      "Content-Type": contentType,
    });
  }

  async get(key: string): Promise<Buffer> {
    await this.ensureBucket();
    const stream = await this.client.getObject(this.bucket, key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    await this.ensureBucket();
    await this.client.removeObject(this.bucket, key);
  }
}
