import { type UserCosmeticsQuery } from '@app/graphql/generated/gql';

type V4User = NonNullable<UserCosmeticsQuery['users']['user']>;

export type V4Paint = NonNullable<V4User['style']['activePaint']>;

export type V4Badge = NonNullable<V4User['style']['activeBadge']>;

export type SevenTvPaintSource = Pick<V4Paint, 'id' | 'name' | 'data'>;
