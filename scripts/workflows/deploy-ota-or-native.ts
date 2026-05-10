import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import {
  compareFingerprints,
  decideDeployType,
  getFinalReleaseTag,
  getPreliminaryReleaseTag,
  parsePublishedUpdateJson,
} from "./deploy-ota-or-native-utils";
import { getRequiredArg, writeGithubOutput } from "./github-actions";

function getCommandErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Unknown command failure";
  }

  const commandError = error as Error & {
    stderr?: string | Buffer | null;
  };
  const stderr =
    typeof commandError.stderr === "string"
      ? commandError.stderr.trim()
      : commandError.stderr?.toString().trim();

  return stderr === "" || stderr == null ? error.message : stderr;
}

function readFingerprint(
  cacheDir: string,
  platform: "ios" | "android"
): string | null {
  const path = `${cacheDir}/${platform}`;

  if (!existsSync(path)) {
    return null;
  }

  return readFileSync(path, "utf8").trim();
}

function compareFingerprintsCommand(args: string[]): void {
  const cacheDir = getRequiredArg(args, "cache-dir");
  const currentIos = getRequiredArg(args, "current-ios");
  const currentAndroid = getRequiredArg(args, "current-android");
  const previous = {
    ios: readFingerprint(cacheDir, "ios"),
    android: readFingerprint(cacheDir, "android"),
  };
  const current = {
    ios: currentIos,
    android: currentAndroid,
  };
  const changed = compareFingerprints(previous, current);

  if (previous.ios == null) {
    console.log("ℹ️ No previous iOS fingerprint found (first run)");
  } else if (previous.ios !== current.ios) {
    console.log(`⚠️ iOS fingerprint changed: ${previous.ios} → ${current.ios}`);
  } else {
    console.log("✅ iOS fingerprint unchanged");
  }

  if (previous.android == null) {
    console.log("ℹ️ No previous Android fingerprint found (first run)");
  } else if (previous.android !== current.android) {
    console.log(
      `⚠️ Android fingerprint changed: ${previous.android} → ${current.android}`
    );
  } else {
    console.log("✅ Android fingerprint unchanged");
  }

  writeGithubOutput("changed", String(changed));
}

function decideDeployTypeCommand(args: string[]): void {
  const manualType = getRequiredArg(args, "manual-type", "auto") as
    | "auto"
    | "ota"
    | "build";
  const fingerprintChanged =
    getRequiredArg(args, "fingerprint-changed", "false") === "true";
  const deployType = decideDeployType(manualType, fingerprintChanged);

  if (manualType === "ota") {
    console.log("📦 Manual: OTA update requested");
  } else if (manualType === "build") {
    console.log("🔨 Manual: Native build requested");
  } else if (deployType === "build") {
    console.log("🔨 Auto: Native changes detected - build required");
  } else {
    console.log("📦 Auto: No native changes - OTA update");
  }

  writeGithubOutput("deploy-type", deployType);
}

function preliminaryTagCommand(args: string[]): void {
  const version = getRequiredArg(args, "version");
  const deployType = getRequiredArg(args, "deploy-type") as "ota" | "build";
  const tag = getPreliminaryReleaseTag(version, deployType);

  if (deployType === "ota") {
    console.log(
      "🏷️ OTA release - final tag will be determined after update (ota-{updateId})"
    );
  } else {
    console.log(`🏷️ Native release tag: ${tag}`);
  }

  writeGithubOutput("tag", tag);
}

function publishOtaCommand(args: string[]): void {
  const platform = getRequiredArg(args, "platform", "ios");
  const message = getRequiredArg(args, "message");
  const platformArgs =
    platform === "all" ? ["--platform", "all"] : ["--platform", platform];

  let updateOutput = "[]";

  try {
    updateOutput = execFileSync(
      "eas",
      [
        "update",
        "--channel",
        "production",
        "--environment",
        "production",
        "--message",
        message,
        ...platformArgs,
        "--non-interactive",
        "--clear-cache",
        "--json",
      ],
      {
        encoding: "utf8",
        env: Object.fromEntries(
          Object.entries({
            ...process.env,
            APP_VARIANT: "production",
          }).map(([key, value]) => [key, value == null ? "" : String(value)])
        ) as NodeJS.ProcessEnv,
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
  } catch (error) {
    throw new Error(
      `Failed to publish OTA update. ${getCommandErrorMessage(error)}`
    );
  }

  const parsed = parsePublishedUpdateJson(updateOutput);

  writeGithubOutput("ios_update_id", parsed.iosUpdateId);
  writeGithubOutput("android_update_id", parsed.androidUpdateId);
  writeGithubOutput("update_group_id", parsed.updateGroupId);

  console.log("📦 Published OTA Update:");
  console.log(`  iOS Update ID: ${parsed.iosUpdateId}`);
  console.log(`  Android Update ID: ${parsed.androidUpdateId}`);
  console.log(`  Update Group ID: ${parsed.updateGroupId}`);
}

function finalTagCommand(args: string[]): void {
  const tag = getFinalReleaseTag({
    deployType: getRequiredArg(args, "deploy-type") as "ota" | "build",
    version: getRequiredArg(args, "version"),
    updateGroupId: getRequiredArg(args, "update-group-id", ""),
    runNumber: Number.parseInt(getRequiredArg(args, "run-number"), 10),
  });

  console.log(`🏷️ Release tag: ${tag}`);
  writeGithubOutput("tag", tag);
}

function main(): void {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "compare-fingerprints":
      compareFingerprintsCommand(args);
      return;
    case "decide-deploy-type":
      decideDeployTypeCommand(args);
      return;
    case "preliminary-tag":
      preliminaryTagCommand(args);
      return;
    case "publish-ota":
      publishOtaCommand(args);
      return;
    case "final-tag":
      finalTagCommand(args);
      return;
    default:
      throw new Error(`Unknown command: ${command ?? "<missing>"}`);
  }
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`::error::${message}`);
  process.exit(1);
}
