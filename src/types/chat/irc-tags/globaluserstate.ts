import { UserStateTags } from './userstate';

export interface GlobalUserStateTags
  extends Pick<
    UserStateTags,
    | 'badges'
    | 'color'
    | 'display-name'
    | 'emote-sets'
    | 'turbo'
    | 'user-id'
    | 'user-type'
  > {
  'badge-info': string;
}
