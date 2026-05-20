'use strict';

// Reads release-assets.txt from CWD, signs every file using RSA-SHA256,
// copies all files (preserving relative paths) to <output-dir>, and writes
// manifest.json there. Caller zips <output-dir> as the final release archive.
//
// Usage: node build-release.js <output-dir>
// Env:   SIGN_KEY        — PEM-encoded encrypted private key (PKCS#8)
//        SIGN_PASSPHRASE — passphrase for the encrypted key

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ASSETS_FILE = 'release-assets.txt';
const MANIFEST_NAME = 'manifest.json';

const outDir = process.argv[2];
if (!outDir) {
  console.error('Usage: node build-release.js <output-dir>');
  process.exit(1);
}

const signKey = process.env.SIGN_KEY;
const signPassphrase = process.env.SIGN_PASSPHRASE;
if (!signKey || !signPassphrase) {
  console.error('Error: SIGN_KEY and SIGN_PASSPHRASE environment variables must be set');
  process.exit(1);
}

const privateKey = { key: signKey, passphrase: signPassphrase };

function collectFiles(entryPath) {
  if (!fs.existsSync(entryPath)) return [];
  const stat = fs.statSync(entryPath);
  if (stat.isFile()) return [entryPath];
  if (stat.isDirectory()) {
    return fs.readdirSync(entryPath).sort().flatMap(child =>
      collectFiles(path.join(entryPath, child))
    );
  }
  return [];
}

const entries = fs.readFileSync(ASSETS_FILE, 'utf8')
  .split('\n')
  .map(line => line.replace(/#.*$/, '').trim())
  .filter(line => line.length > 0)
  .filter(entry => fs.existsSync(entry));

const manifest = [];
for (const entry of entries) {
  for (const filePath of collectFiles(entry)) {
    const content = fs.readFileSync(filePath);
    const rsa_sha256 = crypto.sign('sha256', content, privateKey).toString('base64');
    manifest.push({ path: filePath.split(path.sep).join('/'), rsa_sha256 });

    const destPath = path.join(outDir, filePath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(filePath, destPath);
  }
}

fs.writeFileSync(
  path.join(outDir, MANIFEST_NAME),
  JSON.stringify(manifest, null, 2) + '\n'
);

console.log(`Processed ${manifest.length} files + manifest.json → ${outDir}`);
