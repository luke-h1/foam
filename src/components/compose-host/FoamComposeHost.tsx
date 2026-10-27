import { Host, type HostProps } from '@expo/ui/jetpack-compose';

import { foamMaterialColorOverrides } from '@app/styles/compose-material-colors';

/**
 * Jetpack Compose host pinned to foam-dark. A plain `Host` with
 * `colorScheme="dark"` still takes its accent from the wallpaper.
 */
export function FoamComposeHost(
  props: Omit<HostProps, 'colorOverrides' | 'colorScheme'>,
) {
  return (
    <Host
      {...props}
      colorOverrides={foamMaterialColorOverrides}
      colorScheme='dark'
    />
  );
}
