import { type Variant, VARIANT_CONFIG } from '../../app.config';

export type GoogleServiceFileProblem = {
  severity: 'error' | 'warning';
  file: string;
  message: string;
};

type AndroidGoogleServices = {
  client?: {
    client_info?: {
      android_client_info?: {
        package_name?: string;
      };
    };
  }[];
};

export function isBuildVariant(value: string): value is Variant {
  return Object.prototype.hasOwnProperty.call(VARIANT_CONFIG, value);
}

export function getBuildVariant(value: string): Variant {
  if (!isBuildVariant(value)) {
    throw new Error(
      `Unsupported variant: ${value}. Expected one of ${Object.keys(VARIANT_CONFIG).join(', ')}`,
    );
  }

  return value;
}

export function androidPackageNames(contents: string): string[] {
  const parsed = JSON.parse(contents) as AndroidGoogleServices;

  return (parsed.client ?? []).flatMap(
    client => client.client_info?.android_client_info?.package_name ?? [],
  );
}

/**
 * Reads `BUNDLE_ID` out of a GoogleService-Info plist. Firebase writes a flat
 * `<key>`/`<string>` pair, so this does not need a plist parser.
 */
export function plistBundleId(contents: string): string | undefined {
  return /<key>BUNDLE_ID<\/key>\s*<string>([^<]*)<\/string>/.exec(
    contents,
  )?.[1];
}

/**
 * Every variant decodes the same pair of secrets, so a file that is right for
 * one is silently wrong for another.
 *
 * A missing Android client is an error because Gradle fails on it anyway, just
 * 15 minutes later in `processReleaseGoogleServices`. A mismatched iOS bundle
 * id is only a warning: nothing fails on it today, so blocking the deploy
 * would be a new failure rather than an earlier one.
 */
export function verifyGoogleServiceFiles({
  variant,
  androidContents,
  iosContents,
}: {
  variant: Variant;
  androidContents: string;
  iosContents: string;
}): GoogleServiceFileProblem[] {
  const config = VARIANT_CONFIG[variant];
  const problems: GoogleServiceFileProblem[] = [];

  let packageNames: string[] | undefined;
  try {
    packageNames = androidPackageNames(androidContents);
  } catch {
    problems.push({
      severity: 'error',
      file: config.androidGoogleServicesFile,
      message: 'is not valid JSON. Check the secret holds base64 of the file.',
    });
  }

  if (packageNames && !packageNames.includes(config.androidPackageName)) {
    problems.push({
      severity: 'error',
      file: config.androidGoogleServicesFile,
      message: `has no client for '${config.androidPackageName}'. It has ${packageNames.map(name => `'${name}'`).join(', ') || 'no clients'}. Add the app in Firebase and re-upload the file to the variant's secret.`,
    });
  }

  const bundleId = plistBundleId(iosContents);
  if (bundleId === undefined) {
    problems.push({
      severity: 'error',
      file: config.iosGoogleServicesFile,
      message: 'has no BUNDLE_ID. Check the secret holds base64 of the plist.',
    });
  } else if (bundleId !== config.iosBundleIdentifier) {
    problems.push({
      severity: 'warning',
      file: config.iosGoogleServicesFile,
      message: `is for '${bundleId}', but this variant builds '${config.iosBundleIdentifier}'. Firebase does not fail the build on this, so the app reports to the wrong project.`,
    });
  }

  return problems;
}
