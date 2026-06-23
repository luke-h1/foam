import { execFileSync } from 'node:child_process';
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

export function getCommandErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Unknown command failure';
  }

  const commandError = error as Error & {
    stderr?: string | Buffer | null;
  };
  const stderr =
    typeof commandError.stderr === 'string'
      ? commandError.stderr.trim()
      : commandError.stderr?.toString().trim();

  return stderr === '' || stderr == null ? error.message : stderr;
}

export type RunToolOptions = {
  env?: NodeJS.ProcessEnv;
  stdio?: 'pipe' | 'inherit';
};

export type ToolRunner = (
  command: string,
  args: string[],
  options?: RunToolOptions,
) => string;

export const runTool: ToolRunner = (command, args, options = {}) => {
  const result = execFileSync(command, args, {
    encoding: 'utf8',
    env: options.env,
    stdio: options.stdio === 'inherit' ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });

  return result == null ? '' : result;
};
