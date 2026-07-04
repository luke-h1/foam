const HEADING_REGEXP =
  /^##\s+v?(\d+\.\d+\.\d+)(?:-(internal|testflight|preview))?\s*$/gm;

function changelogVariantLabel(suffix: string | undefined): string {
  switch (suffix) {
    case 'internal':
      return 'Internal';
    case 'testflight':
      return 'TestFlight';
    case 'preview':
      return 'Preview';
    default:
      return 'Production';
  }
}

export function applyEnvironmentLabelsToChangelogHeadings(
  content: string,
): string {
  return content.replace(
    HEADING_REGEXP,
    (_match, version: string, suffix: string | undefined) =>
      `## ${version} (${changelogVariantLabel(suffix)})`,
  );
}
