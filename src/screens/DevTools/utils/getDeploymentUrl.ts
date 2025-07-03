import Constants from 'expo-constants';

/**
 * Get the linked server deployment URL for the current app. This makes it easy to open
 * The Expo dashboard and check errors/analytics for the current version of the app you're using.
 */
export function getDeploymentUrl(): string {
  const deploymentId = (() => {
    // https://expo.dev/accounts/bacon/projects/expo-ai/hosting/deployments/o70t5q6t0r/requests
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const origin = Constants.expoConfig?.extra?.router?.origin as string;
    if (!origin) {
      return '';
    }
    try {
      const url = new URL(origin);
      // Should be like: https://exai--xxxxxx.expo.app
      // We need to extract the `xxxxxx` part if the URL matches `[\w\d]--([])`.
      return url.hostname.match(/(?:[^-]+)--([^.]+)\.expo\.app/)?.[1] ?? null;
    } catch {
      return '';
    }
  })();

  const dashboardUrl = (() => {
    // TODO: There might be a better way to do this, using the project ID.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string;

    if (projectId) {
      // https://expo.dev/projects/[uuid]
      return `https://expo.dev/projects/${projectId}`;
    }
    const owner = Constants.expoConfig?.owner ?? '[account]';
    const slug = Constants.expoConfig?.slug ?? '[project]';

    return `https://expo.dev/accounts/${owner}/projects/${slug}`;
  })();

  let deploymentUrl = `${dashboardUrl}/hosting/deployments`;
  if (deploymentId) {
    deploymentUrl += `/${deploymentId}/requests`;
  }
  return deploymentUrl;
}
