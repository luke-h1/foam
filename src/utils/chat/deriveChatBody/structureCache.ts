import { MessageStructure } from '@app/utils/chat/deriveChatBody/types';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

export const structureCache = new WeakMap<ParsedPart[], MessageStructure>();
