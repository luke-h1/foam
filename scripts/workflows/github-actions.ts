import { appendFileSync } from 'node:fs';

export function getRequiredArg(
  args: string[],
  name: string,
  fallback?: string,
): string {
  const flag = `--${name}`;
  const index = args.indexOf(flag);

  if (index !== -1) {
    const value = args[index + 1];

    if (value == null || value.startsWith('--')) {
      throw new Error(`Missing value for ${flag}`);
    }

    return value;
  }

  if (fallback != null) {
    return fallback;
  }

  throw new Error(`Missing required argument ${flag}`);
}

export function writeGithubOutput(name: string, value: string): void {
  const outputPath = process.env.GITHUB_OUTPUT;

  if (outputPath == null || outputPath === '') {
    throw new Error('GITHUB_OUTPUT is not set');
  }

  appendFileSync(outputPath, `${name}=${value}\n`, 'utf8');
}
