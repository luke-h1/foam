import { existsSync } from 'node:fs';
import { runTool, type ToolRunner } from './github-actions';

export type S3Copier = {
  download: (source: string, target: string) => boolean;
  upload: (source: string, target: string) => void;
};

export type S3Entry = {
  remote: string;
  local: string;
};

export function requireBucketName(value: string): void {
  if (value === '' || value.startsWith('s3://') || value.includes('/')) {
    throw new Error(`Expected an S3 bucket name, received: ${value}`);
  }
}

export function restoreEntries(copier: S3Copier, entries: S3Entry[]): number {
  let restored = 0;

  for (const entry of entries) {
    if (copier.download(entry.remote, entry.local)) {
      restored += 1;
    }
  }

  return restored;
}

export function saveEntries(
  copier: S3Copier,
  entries: S3Entry[],
  options: { onMissing?: 'throw' | 'skip' } = {},
): void {
  const onMissing = options.onMissing ?? 'throw';

  for (const entry of entries) {
    if (existsSync(entry.local)) {
      copier.upload(entry.local, entry.remote);
    } else if (onMissing === 'throw') {
      throw new Error(`Cache file does not exist: ${entry.local}`);
    }
  }
}

export function createAwsCopier(
  env: NodeJS.ProcessEnv,
  run: ToolRunner = runTool,
): S3Copier {
  const cp = (source: string, target: string): void => {
    run('aws', ['s3', 'cp', source, target, '--only-show-errors'], { env });
  };

  return {
    download(source, target) {
      try {
        cp(source, target);
        return true;
      } catch {
        return false;
      }
    },
    upload(source, target) {
      cp(source, target);
    },
  };
}
