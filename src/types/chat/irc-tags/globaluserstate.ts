import { UserState } from './userstate';

export interface GlobalUserStateTags
  extends Pick<
    UserState,
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
