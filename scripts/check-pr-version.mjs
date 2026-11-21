import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { parseAppVersion } from '../src/services/app-version.js';

export function checkPrVersion(baseVersion, nextVersion, lockVersion) {
  const base = parseAppVersion(baseVersion);
  const next = parseAppVersion(nextVersion);
  if (!base || !next) throw new Error('package versions must use MAJOR.MINOR.PATCH');
  if (nextVersion !== lockVersion) throw new Error('package-lock.json must match package.json');

  const [major, minor, patch] = base;
  const allowed = [`${major}.${minor}.${patch + 1}`, `${major}.${minor + 1}.0`, `${major + 1}.0.0`];
  if (!allowed.includes(nextVersion)) {
    throw new Error(`Every PR must bump the base version ${baseVersion} once: ${allowed.join(', ')}`);
  }
}

export function runCheckPrVersion(baseRef = process.env.VERSION_BASE_SHA) {
  if (!baseRef || !/^[a-zA-Z0-9_./-]+$/.test(baseRef)) throw new Error('Provide a valid VERSION_BASE_SHA');
  const basePackage = JSON.parse(execFileSync('git', ['show', `${baseRef}:package.json`], { encoding: 'utf8' }));
  const currentPackage = JSON.parse(readFileSync('package.json', 'utf8'));
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  checkPrVersion(basePackage.version, currentPackage.version, lock.version);
  if (lock.packages?.['']?.version !== currentPackage.version) {
    throw new Error('package-lock.json root package version must match package.json');
  }
  return currentPackage.version;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const version = runCheckPrVersion(process.argv[2]);
    process.stdout.write(`PR version bump verified: ${version}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
