import "server-only";

import { mkdirSync, writeFileSync, existsSync } from "fs";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export type StoredObject = {
  /** Public URL used by the browser */
  url: string;
  /** Storage key / relative path */
  key: string;
};

function r2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL,
  );
}

let s3Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (s3Client) return s3Client;
  s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return s3Client;
}

function ensureLocalUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Store a binary object in Cloudflare R2 when configured, otherwise under
 * `public/uploads` for local/dev.
 */
export async function storeMediaObject(params: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<StoredObject> {
  const { key, body, contentType } = params;

  if (r2Configured()) {
    const bucket = process.env.R2_BUCKET_NAME!;
    const publicBase = process.env.R2_PUBLIC_URL!.replace(/\/$/, "");
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return { key, url: `${publicBase}/${key}` };
  }

  ensureLocalUploadsDir();
  const filename = key.replace(/^uploads\//, "").replace(/\//g, "-");
  const diskPath = path.join(UPLOADS_DIR, filename);
  writeFileSync(diskPath, body);
  return { key: `uploads/${filename}`, url: `/uploads/${filename}` };
}

export function isR2Enabled(): boolean {
  return r2Configured();
}

async function streamToBuffer(
  body: ReadableStream | NodeJS.ReadableStream | Blob | undefined,
): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  if (body instanceof Blob) {
    return Buffer.from(await body.arrayBuffer());
  }
  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array | string>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/** Read a JSON document from R2 (null if missing / R2 off). */
export async function readJsonFromR2<T>(key: string): Promise<T | null> {
  if (!r2Configured()) return null;
  try {
    const result = await getR2Client().send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      }),
    );
    const buf = await streamToBuffer(
      result.Body as ReadableStream | NodeJS.ReadableStream | undefined,
    );
    return JSON.parse(buf.toString("utf8")) as T;
  } catch {
    return null;
  }
}

/** Persist a JSON document to R2 when configured. */
export async function writeJsonToR2(key: string, data: unknown): Promise<boolean> {
  if (!r2Configured()) return false;
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: Buffer.from(JSON.stringify(data, null, 2), "utf8"),
      ContentType: "application/json",
      CacheControl: "no-store",
    }),
  );
  return true;
}
