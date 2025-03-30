import { OmitStrict } from '../util';
import { StvRawBadge } from './emote';

export type StvBadge = OmitStrict<StvRawBadge, 'users'>;
