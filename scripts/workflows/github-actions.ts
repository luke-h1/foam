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

function hasStderrProperty(
  error: Error,
): error is Error & { stderr?: string | Buffer | null } {
  return 'stderr' in error;
}

function extractErrorMessage(error: Error): string {
  if (!hasStderrProperty(error)) {
    return error.message;
  }

  const stderr = Buffer.isBuffer(error.stderr)
    ? error.stderr.toString().trim()
    : error.stderr?.trim();

  return stderr === '' || stderr == null ? error.message : stderr;
}

// `cause` is the exempted parameter name for a value whose type is only
// known at this I/O boundary (a caught exception of unknowable shape).
export function getCommandErrorMessage(cause: unknown): string {
  return cause instanceof Error
    ? extractErrorMessage(cause)
    : 'Unknown command failure';
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
