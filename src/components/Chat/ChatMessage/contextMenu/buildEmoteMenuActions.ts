import type { MenuAction } from '@expo/ui/community/menu';
import type { EmoteImageScale } from '@app/types/emote';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { deriveEmoteImageVariantsFromUrl } from '@app/utils/emote/emoteImageVariants';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import { getEmoteDisplayName } from '@app/utils/emote/getEmoteDisplayName';
import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

const COPY_IMAGE_VARIANT_ACTIONS = [
  { id: 'copy-emote-url-2x', label: 'Copy 2x image URL', scale: '2x' },
  { id: 'copy-emote-url-4x', label: 'Copy 4x image URL', scale: '4x' },
] as const;

export const EMOTE_MENU_ACTION_IDS = {
  copyName: 'copy-emote-name',
  copyUrl: 'copy-emote-url',
  preview: 'preview-emote',
} as const;

function resolveEmoteMenuContext(
  part: ParsedPart<'emote'>,
  disableAnimations: boolean,
) {
  const resolvedImageVariants =
    part.image_variants ?? deriveEmoteImageVariantsFromUrl(part.url);
  const preferredVariantKind = disableAnimations ? 'static' : 'animated';
  const alternateVariantKind =
    preferredVariantKind === 'static' ? 'animated' : 'static';
  const displayUrl = getDisplayEmoteUrl({
    image_variants: resolvedImageVariants,
    url: part.url,
    static_url: part.static_url,
    disableAnimations,
  });
  const scaledImageUrls = COPY_IMAGE_VARIANT_ACTIONS.reduce<
    Partial<Record<EmoteImageScale, string>>
  >((result, action) => {
    const url =
      resolvedImageVariants?.[preferredVariantKind]?.[action.scale] ??
      resolvedImageVariants?.[alternateVariantKind]?.[action.scale];
    if (url) {
      result[action.scale] = url;
    }
    return result;
  }, {});
  const previewPart =
    displayUrl && displayUrl !== part.url ? { ...part, url: displayUrl } : part;

  return {
    displayUrl,
    previewPart,
    scaledImageUrls,
  };
}

export function buildEmoteMenuActions({
  part,
  disableAnimations,
  includePreview,
}: {
  part: ParsedPart<'emote'>;
  disableAnimations: boolean;
  includePreview: boolean;
}): MenuAction[] {
  const { displayUrl, scaledImageUrls } = resolveEmoteMenuContext(
    part,
    disableAnimations,
  );
  const emoteName = getEmoteDisplayName(part);

  const actions: MenuAction[] = [];

  if (emoteName) {
    actions.push({
      id: EMOTE_MENU_ACTION_IDS.copyName,
      title: 'Copy name',
      image: 'doc.on.doc',
    });
  }

  if (displayUrl) {
    actions.push({
      id: EMOTE_MENU_ACTION_IDS.copyUrl,
      title: 'Copy image URL',
      image: 'doc.on.doc',
    });
  }

  for (const action of COPY_IMAGE_VARIANT_ACTIONS) {
    if (scaledImageUrls[action.scale]) {
      actions.push({
        id: action.id,
        title: action.label,
        image: 'doc.on.doc',
      });
    }
  }

  if (includePreview) {
    actions.push({
      id: EMOTE_MENU_ACTION_IDS.preview,
      title: 'Preview',
      image: 'arrow.up.right.square',
    });
  }

  return actions;
}

export function createEmoteMenuActionHandler({
  part,
  disableAnimations,
  onPreview,
}: {
  part: ParsedPart<'emote'>;
  disableAnimations: boolean;
  onPreview?: (part: ParsedPart<'emote'>) => void;
}): (actionId: string) => void {
  const { displayUrl, previewPart, scaledImageUrls } = resolveEmoteMenuContext(
    part,
    disableAnimations,
  );

  return actionId => {
    switch (actionId) {
      case EMOTE_MENU_ACTION_IDS.copyName: {
        const text = getEmoteDisplayName(part);
        if (!text) {
          return;
        }
        void Clipboard.setStringAsync(text).then(() => {
          toast.success('Emote name copied to clipboard');
        });
        return;
      }
      case EMOTE_MENU_ACTION_IDS.copyUrl: {
        if (!displayUrl) {
          return;
        }
        void Clipboard.setStringAsync(displayUrl).then(() => {
          toast.success('Emote URL copied to clipboard');
        });
        return;
      }
      case 'copy-emote-url-2x':
      case 'copy-emote-url-4x': {
        const scale = actionId === 'copy-emote-url-2x' ? '2x' : '4x';
        const url = scaledImageUrls[scale];
        if (!url) {
          return;
        }
        void Clipboard.setStringAsync(url).then(() => {
          toast.success(`${scale} emote URL copied to clipboard`);
        });
        return;
      }
      case EMOTE_MENU_ACTION_IDS.preview: {
        onPreview?.(previewPart);
        return;
      }
      default:
        return;
    }
  };
}
