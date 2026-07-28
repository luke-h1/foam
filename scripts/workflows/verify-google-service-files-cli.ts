import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { VARIANT_CONFIG } from '../../app.config';
import { getRequiredArg } from './github-actions';
import {
  getBuildVariant,
  verifyGoogleServiceFiles,
} from './verifyGoogleServiceFiles';

function main(): void {
  const variant = getBuildVariant(
    getRequiredArg(process.argv.slice(2), 'variant'),
  );
  const config = VARIANT_CONFIG[variant];

  const read = (file: string) => {
    try {
      return readFileSync(resolve(process.cwd(), file), 'utf8');
    } catch {
      throw new Error(`${file} was not written for variant ${variant}`);
    }
  };

  const problems = verifyGoogleServiceFiles({
    variant,
    androidContents: read(config.androidGoogleServicesFile),
    iosContents: read(config.iosGoogleServicesFile),
  });

  problems.forEach(({ severity, file, message }) => {
    console.error(`::${severity}::${file} ${message}`);
  });

  if (problems.some(({ severity }) => severity === 'error')) {
    process.exit(1);
  }

  process.stdout.write(
    `Google service files checked against ${config.androidPackageName} and ${config.iosBundleIdentifier}`,
  );
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`::error::${message}`);
  process.exit(1);
}
