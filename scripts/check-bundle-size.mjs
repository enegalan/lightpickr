import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { promisify } from 'node:util';

const gzipAsync = promisify(zlib.gzip);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function padEndVisible(str, width) {
  const visibleLength = [...str].length;
  const pad = Math.max(0, width - visibleLength);
  return str + ' '.repeat(pad);
}

async function collectDistFiles(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectDistFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

async function main() {
  if (!fs.existsSync(distDir)) {
    console.error('dist/ not found. Run npm run build first.');
    process.exit(1);
  }

  const absolutePaths = await collectDistFiles(distDir);
  if (absolutePaths.length === 0) {
    console.error('dist/ is empty. Run npm run build first.');
    process.exit(1);
  }

  let totalRaw = 0;
  let totalGzip = 0;
  const rows = [];

  for (const absolutePath of absolutePaths) {
    const buffer = await fs.promises.readFile(absolutePath);
    const gzipped = await gzipAsync(buffer, { level: 9 });
    const relativePath = path.relative(distDir, absolutePath);
    totalRaw += buffer.length;
    totalGzip += gzipped.length;
    rows.push({
      relativePath,
      raw: buffer.length,
      gzip: gzipped.length
    });
  }

  const nameWidth = Math.max(...rows.map((row) => [...row.relativePath].length), 12);

  console.log('Distribution sizes (dist/)\n');
  console.log(
    `${padEndVisible('file', nameWidth)}  ${padEndVisible('raw', 12)}  gzip (level 9)`
  );
  console.log(`${'-'.repeat(nameWidth)}  ${'-'.repeat(12)}  ${'-'.repeat(16)}`);

  for (const row of rows) {
    console.log(
      `${padEndVisible(row.relativePath, nameWidth)}  ${padEndVisible(formatBytes(row.raw), 12)}  ${formatBytes(row.gzip)}`
    );
  }

  console.log(`${'-'.repeat(nameWidth)}  ${'-'.repeat(12)}  ${'-'.repeat(16)}`);
  console.log(
    `${padEndVisible('total', nameWidth)}  ${padEndVisible(formatBytes(totalRaw), 12)}  ${formatBytes(totalGzip)}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
