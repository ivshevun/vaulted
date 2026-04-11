#!/usr/bin/env node
/**
 * Load test: 24 parallel full upload flows
 * Flow per request: get-upload-data → PUT to S3 → confirm-upload
 */

import { unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const BASE_URL = process.env.LOAD_TEST_BASE_URL ?? 'http://localhost:3001';
const TOKEN = process.env.LOAD_TEST_TOKEN;

if (!TOKEN) {
  console.error('Missing LOAD_TEST_TOKEN env variable');
  process.exit(1);
}
const CONCURRENCY = 100;

const CONTENT_TYPE = 'text/plain';

function authHeaders() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };
}

function makeTempFile(index) {
  const path = join(tmpdir(), `vaulted-load-test-${index}.txt`);
  writeFileSync(path, `load test file #${index} — ${Date.now()}`);
  return path;
}

async function getUploadData(filename) {
  const params = new URLSearchParams({ filename, contentType: CONTENT_TYPE });
  const res = await fetch(`${BASE_URL}/files/upload-data?${params}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`get-upload-data failed [${res.status}]: ${body}`);
  }

  return res.json(); // { url, key }
}

async function uploadToS3(url, filePath) {
  const fileContent = await import('fs').then((fs) =>
    fs.promises.readFile(filePath),
  );

  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': CONTENT_TYPE },
    body: fileContent,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`S3 upload failed [${res.status}]: ${body}`);
  }
}

async function confirmUpload(key) {
  const res = await fetch(`${BASE_URL}/files/confirm-upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ key }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`confirm-upload failed [${res.status}]: ${body}`);
  }

  return res.json();
}

async function runFlow(index) {
  const filename = `load-test-${index}-${Date.now()}.txt`;
  const tmpPath = makeTempFile(index);
  const start = Date.now();

  try {
    // Step 1: get presigned upload URL + key
    const t1 = Date.now();
    const { url, key } = await getUploadData(filename);
    const t1ms = Date.now() - t1;

    // Step 2: PUT file directly to S3
    const t2 = Date.now();
    await uploadToS3(url, tmpPath);
    const t2ms = Date.now() - t2;

    // Step 3: confirm upload
    const t3 = Date.now();
    await confirmUpload(key);
    const t3ms = Date.now() - t3;

    const total = Date.now() - start;
    return {
      index,
      ok: true,
      key,
      timings: {
        getUploadData: t1ms,
        s3Upload: t2ms,
        confirmUpload: t3ms,
        total,
      },
    };
  } catch (err) {
    return {
      index,
      ok: false,
      error: `${err.message}${err.cause ? ` | cause: ${err.cause}` : ''}`,
      elapsed: Date.now() - start,
    };
  } finally {
    try {
      unlinkSync(tmpPath);
    } catch {}
  }
}

async function main() {
  console.log(`Launching ${CONCURRENCY} parallel upload flows...\n`);
  const globalStart = Date.now();

  const results = await Promise.allSettled(
    Array.from({ length: CONCURRENCY }, (_, i) => runFlow(i + 1)),
  );

  const elapsed = Date.now() - globalStart;

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    const val =
      r.status === 'fulfilled'
        ? r.value
        : { ok: false, error: r.reason?.message, index: '?' };
    if (val.ok) {
      passed++;
      const {
        getUploadData: g,
        s3Upload: s,
        confirmUpload: c,
        total,
      } = val.timings;
      console.log(
        `[${String(val.index).padStart(2)}] OK  key=${val.key}  get=${g}ms s3=${s}ms confirm=${c}ms total=${total}ms`,
      );
    } else {
      failed++;
      console.error(`[${String(val.index).padStart(2)}] FAIL  ${val.error}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(
    `Passed: ${passed}/${CONCURRENCY}  Failed: ${failed}/${CONCURRENCY}`,
  );
  console.log(`Wall time: ${elapsed}ms`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
