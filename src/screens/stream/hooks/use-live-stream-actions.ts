import { useCallback, useRef } from 'react';

import { toast } from 'sonner-native';

import { notification } from '@app/lib/haptics';
import type { LogMetadataValue } from '@app/lib/sentry';
import { twitchService } from '@app/services/twitch-service';
import { addCreatedClip } from '@app/store/created-clips/actions/created-clips';
import { openLinkInBrowser } from '@app/utils/browser/open-link-in-browser';
import { logger } from '@app/utils/logger';
import { shareDeepLink } from '@app/utils/sharing/share-deep-link';

interface UseLiveStreamActionsOptions {
  authState: { isAnonAuth: boolean; isLoggedIn: boolean } | undefined;
  broadcasterName: string | undefined;
  resolvedChannelId: string | undefined;
  resolvedChannelLogin: string | undefined;
}

/**
 * The two things a viewer can do with the stream itself: share a deep link to
 * it, and clip it. Clipping is guarded by a ref rather than state because a
 * second tap must be dropped without re-rendering the player.
 */
export function useLiveStreamActions({
  authState,
  broadcasterName,
  resolvedChannelId,
  resolvedChannelLogin,
}: UseLiveStreamActionsOptions) {
  // Clipping needs a real Twitch account, not the anonymous session.
  const canCreateClip = Boolean(
    authState?.isLoggedIn && !authState.isAnonAuth && resolvedChannelId,
  );

  const isCreatingClipRef = useRef(false);

  const handleSharePress = useCallback(() => {
    if (!resolvedChannelLogin) {
      return;
    }

    void shareDeepLink({
      kind: 'liveStream',
      login: resolvedChannelLogin,
      displayName: broadcasterName,
    });
  }, [broadcasterName, resolvedChannelLogin]);

  const handleCreateClipPress = useCallback(() => {
    if (!resolvedChannelId || isCreatingClipRef.current) {
      return;
    }

    isCreatingClipRef.current = true;

    void twitchService
      .createClip(resolvedChannelId)
      .then(clip => {
        if (!clip) {
          notification('error');
          toast.error('Clipping is not available for this stream right now');
          return;
        }

        addCreatedClip({
          id: clip.id,
          broadcasterLogin: resolvedChannelLogin ?? '',
          broadcasterName: broadcasterName ?? resolvedChannelLogin ?? '',
          createdAt: Date.now(),
        });

        notification('success');

        toast.success('Clip created', {
          action: {
            label: 'Edit',
            onClick: () => openLinkInBrowser(clip.edit_url),
          },
        });
      })
      .catch((error: LogMetadataValue) => {
        logger.twitch.warn('Failed to create clip', {
          error,
          channel_id: resolvedChannelId,
        });

        notification('error');
        toast.error("Couldn't create clip");
      })
      .finally(() => {
        isCreatingClipRef.current = false;
      });
  }, [broadcasterName, resolvedChannelId, resolvedChannelLogin]);

  return { canCreateClip, handleCreateClipPress, handleSharePress };
}
