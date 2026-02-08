/* eslint-disable */
// @ts-nocheck
import { DocumentNode } from 'graphql';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  CustomerId: { input: string; output: string };
  DateTime: { input: string; output: string };
  Id: { input: string; output: string };
  InvoiceId: { input: string; output: string };
  JSONObject: {
    input: Record<string, unknown>;
    output: Record<string, unknown>;
  };
  StripeProductId: { input: string; output: string };
};

export type AdminPermission = {
  __typename?: 'AdminPermission';
  admin: Scalars['Boolean']['output'];
  bypassRateLimit: Scalars['Boolean']['output'];
  manageEntitlements: Scalars['Boolean']['output'];
  manageRedeemCodes: Scalars['Boolean']['output'];
  superAdmin: Scalars['Boolean']['output'];
};

export type AnyEvent = EmoteEvent | EmoteSetEvent | UserEvent;

export type BackdoorQuery = {
  __typename?: 'BackdoorQuery';
  executeSql: Scalars['String']['output'];
};

export type BackdoorQueryExecuteSqlArgs = {
  sql: Scalars['String']['input'];
};

export type Badge = {
  __typename?: 'Badge';
  createdById: Scalars['Id']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Id']['output'];
  images: Array<Image>;
  name: Scalars['String']['output'];
  searchUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  tags: Array<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type BadgePermission = {
  __typename?: 'BadgePermission';
  admin: Scalars['Boolean']['output'];
  assign: Scalars['Boolean']['output'];
  manage: Scalars['Boolean']['output'];
};

export type BadgeProgress = {
  __typename?: 'BadgeProgress';
  currentBadge?: Maybe<Badge>;
  currentBadgeId?: Maybe<Scalars['Id']['output']>;
  nextBadge?: Maybe<BadgeProgressNextBadge>;
};

export type BadgeProgressNextBadge = {
  __typename?: 'BadgeProgressNextBadge';
  badge?: Maybe<Badge>;
  badgeId: Scalars['Id']['output'];
  daysLeft: Scalars['Float']['output'];
  percentage: Scalars['Float']['output'];
};

export type BadgeQuery = {
  __typename?: 'BadgeQuery';
  badge?: Maybe<Badge>;
  badges: Array<Badge>;
};

export type BadgeQueryBadgeArgs = {
  id: Scalars['Id']['input'];
};

export type Billing = {
  __typename?: 'Billing';
  badgeProgress: BadgeProgress;
  subscriptionInfo: SubscriptionInfo;
};

export type BillingMutation = {
  __typename?: 'BillingMutation';
  cancelSubscription: SubscriptionInfo;
  getPickems: SubscribeResponse;
  reactivateSubscription: SubscriptionInfo;
  redeemCode: RedeemResponse;
  subscribe: SubscribeResponse;
};

export type BillingMutationCancelSubscriptionArgs = {
  productId: Scalars['Id']['input'];
};

export type BillingMutationGetPickemsArgs = {
  pickemsId: Scalars['Id']['input'];
  subscriptionPriceId?: InputMaybe<Scalars['StripeProductId']['input']>;
};

export type BillingMutationReactivateSubscriptionArgs = {
  productId: Scalars['Id']['input'];
};

export type BillingMutationRedeemCodeArgs = {
  code: Scalars['String']['input'];
};

export type BillingMutationSubscribeArgs = {
  variantId: Scalars['StripeProductId']['input'];
};

export type CodeEffect = CodeEffectDirectEntitlement | CodeEffectSpecialEvent;

export type CodeEffectDirectEntitlement = {
  __typename?: 'CodeEffectDirectEntitlement';
  entitlements: Array<EntitlementNodeAny>;
};

export type CodeEffectSpecialEvent = {
  __typename?: 'CodeEffectSpecialEvent';
  specialEvent?: Maybe<SpecialEvent>;
  specialEventId: Scalars['Id']['output'];
};

export type Color = {
  __typename?: 'Color';
  a: Scalars['Int']['output'];
  b: Scalars['Int']['output'];
  g: Scalars['Int']['output'];
  hex: Scalars['String']['output'];
  r: Scalars['Int']['output'];
};

export type CreateProductInput = {
  active: Scalars['Boolean']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  price: Scalars['Int']['input'];
  providerId: Scalars['String']['input'];
};

export type CreateRedeemCodeBatchInput = {
  activePeriod?: InputMaybe<TimePeriodInput>;
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  number: Scalars['Int']['input'];
  specialEventId: Scalars['Id']['input'];
  subscriptionEffect?: InputMaybe<RedeemCodeSubscriptionEffectInput>;
  tags: Array<Scalars['String']['input']>;
  uses: Scalars['Int']['input'];
};

export type CreateRedeemCodeInput = {
  activePeriod?: InputMaybe<TimePeriodInput>;
  code?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  specialEventId: Scalars['Id']['input'];
  subscriptionEffect?: InputMaybe<RedeemCodeSubscriptionEffectInput>;
  tags: Array<Scalars['String']['input']>;
  uses: Scalars['Int']['input'];
};

export type CreateSpecialEventInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  tags: Array<Scalars['String']['input']>;
};

export type EditorEmotePermission = {
  __typename?: 'EditorEmotePermission';
  admin: Scalars['Boolean']['output'];
  create: Scalars['Boolean']['output'];
  manage: Scalars['Boolean']['output'];
  transfer: Scalars['Boolean']['output'];
};

export type EditorEmotePermissionInput = {
  admin: Scalars['Boolean']['input'];
  create: Scalars['Boolean']['input'];
  manage: Scalars['Boolean']['input'];
  transfer: Scalars['Boolean']['input'];
};

export type EditorEmoteSetPermission = {
  __typename?: 'EditorEmoteSetPermission';
  admin: Scalars['Boolean']['output'];
  create: Scalars['Boolean']['output'];
  manage: Scalars['Boolean']['output'];
};

export type EditorEmoteSetPermissionInput = {
  admin: Scalars['Boolean']['input'];
  create: Scalars['Boolean']['input'];
  manage: Scalars['Boolean']['input'];
};

export type EditorUserPermission = {
  __typename?: 'EditorUserPermission';
  admin: Scalars['Boolean']['output'];
  manageBilling: Scalars['Boolean']['output'];
  manageEditors: Scalars['Boolean']['output'];
  managePersonalEmoteSet: Scalars['Boolean']['output'];
  manageProfile: Scalars['Boolean']['output'];
};

export type EditorUserPermissionInput = {
  admin: Scalars['Boolean']['input'];
  manageBilling: Scalars['Boolean']['input'];
  manageEditors: Scalars['Boolean']['input'];
  managePersonalEmoteSet: Scalars['Boolean']['input'];
  manageProfile: Scalars['Boolean']['input'];
};

export type Emote = {
  __typename?: 'Emote';
  aspectRatio: Scalars['Float']['output'];
  attribution: Array<EmoteAttribution>;
  channels: UserSearchResult;
  defaultName: Scalars['String']['output'];
  deleted: Scalars['Boolean']['output'];
  events: Array<EmoteEvent>;
  flags: EmoteFlags;
  id: Scalars['Id']['output'];
  images: Array<Image>;
  imagesPending: Scalars['Boolean']['output'];
  inEmoteSets: Array<EmoteInEmoteSetResponse>;
  owner?: Maybe<User>;
  ownerId: Scalars['Id']['output'];
  ranking?: Maybe<Scalars['Int']['output']>;
  scores: EmoteScores;
  searchUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  tags: Array<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type EmoteChannelsArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
};

export type EmoteEventsArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
};

export type EmoteInEmoteSetsArgs = {
  emoteSetIds: Array<Scalars['Id']['input']>;
};

export type EmoteRankingArgs = {
  ranking: Ranking;
};

export type EmoteAttribution = {
  __typename?: 'EmoteAttribution';
  addedAt: Scalars['DateTime']['output'];
  user?: Maybe<User>;
  userId: Scalars['Id']['output'];
};

export type EmoteBatchOperation = {
  __typename?: 'EmoteBatchOperation';
  delete: Array<Emote>;
  flags: Array<Emote>;
  merge: Array<Emote>;
  name: Array<Emote>;
  owner: Array<Emote>;
  tags: Array<Emote>;
};

export type EmoteBatchOperationDeleteArgs = {
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type EmoteBatchOperationFlagsArgs = {
  flags: EmoteFlagsInput;
};

export type EmoteBatchOperationMergeArgs = {
  with: Scalars['Id']['input'];
};

export type EmoteBatchOperationNameArgs = {
  name: Scalars['String']['input'];
};

export type EmoteBatchOperationOwnerArgs = {
  ownerId: Scalars['Id']['input'];
};

export type EmoteBatchOperationTagsArgs = {
  tags: Array<Scalars['String']['input']>;
};

export type EmoteEvent = {
  __typename?: 'EmoteEvent';
  actor?: Maybe<User>;
  actorId?: Maybe<Scalars['Id']['output']>;
  createdAt: Scalars['DateTime']['output'];
  data: EventEmoteData;
  id: Scalars['Id']['output'];
  searchUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  target?: Maybe<Emote>;
  targetId: Scalars['Id']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type EmoteFlags = {
  __typename?: 'EmoteFlags';
  animated: Scalars['Boolean']['output'];
  approvedPersonal: Scalars['Boolean']['output'];
  defaultZeroWidth: Scalars['Boolean']['output'];
  deniedPersonal: Scalars['Boolean']['output'];
  nsfw: Scalars['Boolean']['output'];
  private: Scalars['Boolean']['output'];
  publicListed: Scalars['Boolean']['output'];
};

export type EmoteFlagsInput = {
  animated?: InputMaybe<Scalars['Boolean']['input']>;
  approvedPersonal?: InputMaybe<Scalars['Boolean']['input']>;
  defaultZeroWidth?: InputMaybe<Scalars['Boolean']['input']>;
  deniedPersonal?: InputMaybe<Scalars['Boolean']['input']>;
  nsfw?: InputMaybe<Scalars['Boolean']['input']>;
  private?: InputMaybe<Scalars['Boolean']['input']>;
  publicListed?: InputMaybe<Scalars['Boolean']['input']>;
};

export type EmoteInEmoteSetResponse = {
  __typename?: 'EmoteInEmoteSetResponse';
  emote?: Maybe<EmoteSetEmote>;
  emoteSetId: Scalars['Id']['output'];
};

export type EmoteModerationRequestPermission = {
  __typename?: 'EmoteModerationRequestPermission';
  admin: Scalars['Boolean']['output'];
  manage: Scalars['Boolean']['output'];
};

export type EmoteMutation = {
  __typename?: 'EmoteMutation';
  emote: EmoteOperation;
  emotes: EmoteBatchOperation;
};

export type EmoteMutationEmoteArgs = {
  id: Scalars['Id']['input'];
};

export type EmoteMutationEmotesArgs = {
  ids: Array<Scalars['Id']['input']>;
};

export type EmoteOperation = {
  __typename?: 'EmoteOperation';
  delete: Emote;
  flags: Emote;
  merge: Emote;
  name: Emote;
  owner: Emote;
  tags: Emote;
};

export type EmoteOperationFlagsArgs = {
  flags: EmoteFlagsInput;
};

export type EmoteOperationMergeArgs = {
  targetId: Scalars['Id']['input'];
};

export type EmoteOperationNameArgs = {
  name: Scalars['String']['input'];
};

export type EmoteOperationOwnerArgs = {
  ownerId: Scalars['Id']['input'];
};

export type EmoteOperationTagsArgs = {
  tags: Array<Scalars['String']['input']>;
};

export type EmotePermission = {
  __typename?: 'EmotePermission';
  admin: Scalars['Boolean']['output'];
  delete: Scalars['Boolean']['output'];
  edit: Scalars['Boolean']['output'];
  manageAny: Scalars['Boolean']['output'];
  merge: Scalars['Boolean']['output'];
  upload: Scalars['Boolean']['output'];
  viewUnlisted: Scalars['Boolean']['output'];
};

export type EmoteQuery = {
  __typename?: 'EmoteQuery';
  emote?: Maybe<Emote>;
  search: EmoteSearchResult;
};

export type EmoteQueryEmoteArgs = {
  id: Scalars['Id']['input'];
};

export type EmoteQuerySearchArgs = {
  filters?: InputMaybe<Filters>;
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  sort: Sort;
  tags?: InputMaybe<Tags>;
};

export type EmoteScores = {
  __typename?: 'EmoteScores';
  topAllTime: Scalars['Int']['output'];
  topDaily: Scalars['Int']['output'];
  topMonthly: Scalars['Int']['output'];
  topWeekly: Scalars['Int']['output'];
  trendingDay: Scalars['Int']['output'];
  trendingMonth: Scalars['Int']['output'];
  trendingWeek: Scalars['Int']['output'];
};

export type EmoteSearchResult = {
  __typename?: 'EmoteSearchResult';
  items: Array<Emote>;
  pageCount: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

export type EmoteSet = {
  __typename?: 'EmoteSet';
  capacity?: Maybe<Scalars['Int']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  emotes: EmoteSetEmoteSearchResult;
  id: Scalars['Id']['output'];
  kind: EmoteSetKind;
  name: Scalars['String']['output'];
  owner?: Maybe<User>;
  ownerId?: Maybe<Scalars['Id']['output']>;
  searchUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  tags: Array<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type EmoteSetEmotesArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};

export type EmoteSetEmote = {
  __typename?: 'EmoteSetEmote';
  addedAt: Scalars['DateTime']['output'];
  addedById?: Maybe<Scalars['Id']['output']>;
  alias: Scalars['String']['output'];
  emote: Emote;
  flags: EmoteSetEmoteFlags;
  id: Scalars['Id']['output'];
  originSetId?: Maybe<Scalars['Id']['output']>;
};

export type EmoteSetEmoteFlags = {
  __typename?: 'EmoteSetEmoteFlags';
  overrideConflicts: Scalars['Boolean']['output'];
  zeroWidth: Scalars['Boolean']['output'];
};

export type EmoteSetEmoteFlagsInput = {
  overrideConflicts: Scalars['Boolean']['input'];
  zeroWidth: Scalars['Boolean']['input'];
};

export type EmoteSetEmoteId = {
  alias?: InputMaybe<Scalars['String']['input']>;
  emoteId: Scalars['Id']['input'];
};

export type EmoteSetEmoteSearchResult = {
  __typename?: 'EmoteSetEmoteSearchResult';
  items: Array<EmoteSetEmote>;
  pageCount: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

export type EmoteSetEvent = {
  __typename?: 'EmoteSetEvent';
  actor?: Maybe<User>;
  actorId?: Maybe<Scalars['Id']['output']>;
  createdAt: Scalars['DateTime']['output'];
  data: EventEmoteSetData;
  id: Scalars['Id']['output'];
  searchUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  target?: Maybe<EmoteSet>;
  targetId: Scalars['Id']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export enum EmoteSetKind {
  Global = 'GLOBAL',
  Normal = 'NORMAL',
  Personal = 'PERSONAL',
  Special = 'SPECIAL',
}

export type EmoteSetMutation = {
  __typename?: 'EmoteSetMutation';
  create: EmoteSet;
  emoteSet: EmoteSetOperation;
};

export type EmoteSetMutationCreateArgs = {
  name: Scalars['String']['input'];
  ownerId?: InputMaybe<Scalars['Id']['input']>;
  tags: Array<Scalars['String']['input']>;
};

export type EmoteSetMutationEmoteSetArgs = {
  id: Scalars['Id']['input'];
};

export type EmoteSetOperation = {
  __typename?: 'EmoteSetOperation';
  addEmote: EmoteSet;
  capacity: EmoteSet;
  delete: Scalars['Boolean']['output'];
  name: EmoteSet;
  removeEmote: EmoteSet;
  tags: EmoteSet;
  updateEmoteAlias: EmoteSetEmote;
  updateEmoteFlags: EmoteSetEmote;
};

export type EmoteSetOperationAddEmoteArgs = {
  id: EmoteSetEmoteId;
  overrideConflicts?: InputMaybe<Scalars['Boolean']['input']>;
  zeroWidth?: InputMaybe<Scalars['Boolean']['input']>;
};

export type EmoteSetOperationCapacityArgs = {
  capacity: Scalars['Int']['input'];
};

export type EmoteSetOperationNameArgs = {
  name: Scalars['String']['input'];
};

export type EmoteSetOperationRemoveEmoteArgs = {
  id: EmoteSetEmoteId;
};

export type EmoteSetOperationTagsArgs = {
  tags: Array<Scalars['String']['input']>;
};

export type EmoteSetOperationUpdateEmoteAliasArgs = {
  alias: Scalars['String']['input'];
  id: EmoteSetEmoteId;
};

export type EmoteSetOperationUpdateEmoteFlagsArgs = {
  flags: EmoteSetEmoteFlagsInput;
  id: EmoteSetEmoteId;
};

export type EmoteSetPermission = {
  __typename?: 'EmoteSetPermission';
  admin: Scalars['Boolean']['output'];
  assign: Scalars['Boolean']['output'];
  manage: Scalars['Boolean']['output'];
  manageAny: Scalars['Boolean']['output'];
  manageGlobal: Scalars['Boolean']['output'];
  manageSpecial: Scalars['Boolean']['output'];
  resize: Scalars['Boolean']['output'];
};

export type EmoteSetQuery = {
  __typename?: 'EmoteSetQuery';
  emoteSet?: Maybe<EmoteSet>;
  emoteSets: Array<EmoteSet>;
  global: EmoteSet;
};

export type EmoteSetQueryEmoteSetArgs = {
  id: Scalars['Id']['input'];
};

export type EmoteSetQueryEmoteSetsArgs = {
  ids: Array<Scalars['Id']['input']>;
};

export type EntitlementEdgeAnyAny = {
  __typename?: 'EntitlementEdgeAnyAny';
  from: EntitlementNodeAny;
  to: EntitlementNodeAny;
};

export type EntitlementEdgeMutation = {
  __typename?: 'EntitlementEdgeMutation';
  create: EntitlementEdgeAnyAny;
  entitlementEdge: EntitlementEdgeOperation;
};

export type EntitlementEdgeMutationCreateArgs = {
  from: EntitlementNodeInput;
  to: EntitlementNodeInput;
};

export type EntitlementEdgeMutationEntitlementEdgeArgs = {
  from: EntitlementNodeInput;
  to: EntitlementNodeInput;
};

export type EntitlementEdgeOperation = {
  __typename?: 'EntitlementEdgeOperation';
  delete: Scalars['Boolean']['output'];
};

export type EntitlementNodeAny =
  | EntitlementNodeBadge
  | EntitlementNodeEmoteSet
  | EntitlementNodeGlobalDefaultEntitlementGroup
  | EntitlementNodePaint
  | EntitlementNodeProduct
  | EntitlementNodeRole
  | EntitlementNodeSpecialEvent
  | EntitlementNodeSubscription
  | EntitlementNodeSubscriptionBenefit
  | EntitlementNodeUser;

export type EntitlementNodeBadge = {
  __typename?: 'EntitlementNodeBadge';
  badge?: Maybe<Badge>;
  badgeId: Scalars['Id']['output'];
};

export type EntitlementNodeEmoteSet = {
  __typename?: 'EntitlementNodeEmoteSet';
  emoteSet?: Maybe<EmoteSet>;
  emoteSetId: Scalars['Id']['output'];
};

export type EntitlementNodeGlobalDefaultEntitlementGroup = {
  __typename?: 'EntitlementNodeGlobalDefaultEntitlementGroup';
  noop: Scalars['Boolean']['output'];
};

export type EntitlementNodeInput = {
  id: Scalars['Id']['input'];
  type: EntitlementNodeTypeInput;
};

export type EntitlementNodePaint = {
  __typename?: 'EntitlementNodePaint';
  paint?: Maybe<Paint>;
  paintId: Scalars['Id']['output'];
};

export type EntitlementNodeProduct = {
  __typename?: 'EntitlementNodeProduct';
  productId: Scalars['Id']['output'];
};

export type EntitlementNodeRole = {
  __typename?: 'EntitlementNodeRole';
  role?: Maybe<Role>;
  roleId: Scalars['Id']['output'];
};

export type EntitlementNodeSpecialEvent = {
  __typename?: 'EntitlementNodeSpecialEvent';
  specialEvent?: Maybe<SpecialEvent>;
  specialEventId: Scalars['Id']['output'];
};

export type EntitlementNodeSubscription = {
  __typename?: 'EntitlementNodeSubscription';
  subscriptionId: SubscriptionId;
};

export type EntitlementNodeSubscriptionBenefit = {
  __typename?: 'EntitlementNodeSubscriptionBenefit';
  subscriptionBenefit?: Maybe<SubscriptionBenefit>;
  subscriptionBenefitId: Scalars['Id']['output'];
};

export enum EntitlementNodeTypeInput {
  Badge = 'BADGE',
  EmoteSet = 'EMOTE_SET',
  GlobalDefaultEntitlementGroup = 'GLOBAL_DEFAULT_ENTITLEMENT_GROUP',
  Paint = 'PAINT',
  Role = 'ROLE',
  SpecialEvent = 'SPECIAL_EVENT',
  Subscription = 'SUBSCRIPTION',
  SubscriptionBenefit = 'SUBSCRIPTION_BENEFIT',
  User = 'USER',
}

export type EntitlementNodeUser = {
  __typename?: 'EntitlementNodeUser';
  user?: Maybe<User>;
  userId: Scalars['Id']['output'];
};

export type EntitlementQuery = {
  __typename?: 'EntitlementQuery';
  traverse: RawEntitlements;
};

export type EntitlementQueryTraverseArgs = {
  from: EntitlementNodeInput;
};

export type EventEmoteData =
  | EventEmoteDataChangeFlags
  | EventEmoteDataChangeName
  | EventEmoteDataChangeOwner
  | EventEmoteDataChangeTags
  | EventEmoteDataDelete
  | EventEmoteDataMerge
  | EventEmoteDataProcess
  | EventEmoteDataUpload;

export type EventEmoteDataChangeFlags = {
  __typename?: 'EventEmoteDataChangeFlags';
  newFlags: EmoteFlags;
  oldFlags: EmoteFlags;
};

export type EventEmoteDataChangeName = {
  __typename?: 'EventEmoteDataChangeName';
  newName: Scalars['String']['output'];
  oldName: Scalars['String']['output'];
};

export type EventEmoteDataChangeOwner = {
  __typename?: 'EventEmoteDataChangeOwner';
  newOwner?: Maybe<User>;
  newOwnerId: Scalars['Id']['output'];
  oldOwner?: Maybe<User>;
  oldOwnerId: Scalars['Id']['output'];
};

export type EventEmoteDataChangeTags = {
  __typename?: 'EventEmoteDataChangeTags';
  newTags: Array<Scalars['String']['output']>;
  oldTags: Array<Scalars['String']['output']>;
};

export type EventEmoteDataDelete = {
  __typename?: 'EventEmoteDataDelete';
  /** Always false */
  noop: Scalars['Boolean']['output'];
};

export type EventEmoteDataMerge = {
  __typename?: 'EventEmoteDataMerge';
  newEmote: Emote;
  newEmoteId: Scalars['Id']['output'];
};

export type EventEmoteDataProcess = {
  __typename?: 'EventEmoteDataProcess';
  event: ImageProcessorEvent;
};

export type EventEmoteDataUpload = {
  __typename?: 'EventEmoteDataUpload';
  /** Always false */
  noop: Scalars['Boolean']['output'];
};

export type EventEmoteSetData =
  | EventEmoteSetDataAddEmote
  | EventEmoteSetDataChangeCapacity
  | EventEmoteSetDataChangeName
  | EventEmoteSetDataChangeTags
  | EventEmoteSetDataCreate
  | EventEmoteSetDataDelete
  | EventEmoteSetDataRemoveEmote
  | EventEmoteSetDataRenameEmote;

export type EventEmoteSetDataAddEmote = {
  __typename?: 'EventEmoteSetDataAddEmote';
  addedEmote?: Maybe<Emote>;
  addedEmoteId: Scalars['Id']['output'];
  alias: Scalars['String']['output'];
};

export type EventEmoteSetDataChangeCapacity = {
  __typename?: 'EventEmoteSetDataChangeCapacity';
  newCapacity?: Maybe<Scalars['Int']['output']>;
  oldCapacity?: Maybe<Scalars['Int']['output']>;
};

export type EventEmoteSetDataChangeName = {
  __typename?: 'EventEmoteSetDataChangeName';
  newName: Scalars['String']['output'];
  oldName: Scalars['String']['output'];
};

export type EventEmoteSetDataChangeTags = {
  __typename?: 'EventEmoteSetDataChangeTags';
  newTags: Array<Scalars['String']['output']>;
  oldTags: Array<Scalars['String']['output']>;
};

export type EventEmoteSetDataCreate = {
  __typename?: 'EventEmoteSetDataCreate';
  /** Always false */
  noop: Scalars['Boolean']['output'];
};

export type EventEmoteSetDataDelete = {
  __typename?: 'EventEmoteSetDataDelete';
  /** Always false */
  noop: Scalars['Boolean']['output'];
};

export type EventEmoteSetDataRemoveEmote = {
  __typename?: 'EventEmoteSetDataRemoveEmote';
  removedEmote?: Maybe<Emote>;
  removedEmoteId: Scalars['Id']['output'];
};

export type EventEmoteSetDataRenameEmote = {
  __typename?: 'EventEmoteSetDataRenameEmote';
  newAlias: Scalars['String']['output'];
  oldAlias: Scalars['String']['output'];
  renamedEmote?: Maybe<Emote>;
  renamedEmoteId: Scalars['Id']['output'];
};

export type EventUserData =
  | EventUserDataAddConnection
  | EventUserDataChangeActiveBadge
  | EventUserDataChangeActiveEmoteSet
  | EventUserDataChangeActivePaint
  | EventUserDataCreate
  | EventUserDataDelete
  | EventUserDataRemoveConnection;

export type EventUserDataAddConnection = {
  __typename?: 'EventUserDataAddConnection';
  addedPlatform: Platform;
};

export type EventUserDataChangeActiveBadge = {
  __typename?: 'EventUserDataChangeActiveBadge';
  newBadge?: Maybe<Badge>;
  newBadgeId?: Maybe<Scalars['Id']['output']>;
  oldBadge?: Maybe<Badge>;
  oldBadgeId?: Maybe<Scalars['Id']['output']>;
};

export type EventUserDataChangeActiveEmoteSet = {
  __typename?: 'EventUserDataChangeActiveEmoteSet';
  newEmoteSet?: Maybe<EmoteSet>;
  newEmoteSetId?: Maybe<Scalars['Id']['output']>;
  oldEmoteSet?: Maybe<EmoteSet>;
  oldEmoteSetId?: Maybe<Scalars['Id']['output']>;
};

export type EventUserDataChangeActivePaint = {
  __typename?: 'EventUserDataChangeActivePaint';
  newPaint?: Maybe<Paint>;
  newPaintId?: Maybe<Scalars['Id']['output']>;
  oldPaint?: Maybe<Paint>;
  oldPaintId?: Maybe<Scalars['Id']['output']>;
};

export type EventUserDataCreate = {
  __typename?: 'EventUserDataCreate';
  /** Always false */
  noop: Scalars['Boolean']['output'];
};

export type EventUserDataDelete = {
  __typename?: 'EventUserDataDelete';
  /** Always false */
  noop: Scalars['Boolean']['output'];
};

export type EventUserDataRemoveConnection = {
  __typename?: 'EventUserDataRemoveConnection';
  removedPlatform: Platform;
};

export type Filters = {
  animated?: InputMaybe<Scalars['Boolean']['input']>;
  approvedPersonal?: InputMaybe<Scalars['Boolean']['input']>;
  defaultZeroWidth?: InputMaybe<Scalars['Boolean']['input']>;
  /** defaults to false when unset */
  exactMatch?: InputMaybe<Scalars['Boolean']['input']>;
  nsfw?: InputMaybe<Scalars['Boolean']['input']>;
};

export type FlagPermission = {
  __typename?: 'FlagPermission';
  hidden: Scalars['Boolean']['output'];
};

export type Image = {
  __typename?: 'Image';
  frameCount: Scalars['Int']['output'];
  height: Scalars['Int']['output'];
  mime: Scalars['String']['output'];
  scale: Scalars['Int']['output'];
  size: Scalars['Int']['output'];
  url: Scalars['String']['output'];
  width: Scalars['Int']['output'];
};

export enum ImageProcessorEvent {
  Cancel = 'CANCEL',
  Fail = 'FAIL',
  Start = 'START',
  Success = 'SUCCESS',
}

export type InventoryEntitlementEdgeAnyBadge = {
  __typename?: 'InventoryEntitlementEdgeAnyBadge';
  /** Whether this entitlement is directly connected to the user */
  accessible: Scalars['Boolean']['output'];
  from: EntitlementNodeAny;
  to: EntitlementNodeBadge;
};

export type InventoryEntitlementEdgeAnyPaint = {
  __typename?: 'InventoryEntitlementEdgeAnyPaint';
  /** Whether this entitlement is directly connected to the user */
  accessible: Scalars['Boolean']['output'];
  from: EntitlementNodeAny;
  to: EntitlementNodePaint;
};

export type InventoryEntitlementEdgeAnyProduct = {
  __typename?: 'InventoryEntitlementEdgeAnyProduct';
  /** Whether this entitlement is directly connected to the user */
  accessible: Scalars['Boolean']['output'];
  from: EntitlementNodeAny;
  to: EntitlementNodeProduct;
};

export type JobMutation = {
  __typename?: 'JobMutation';
  rerunSubscriptionRefreshJob: Scalars['Boolean']['output'];
};

export type KickLinkInput = {
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
  displayName: Scalars['String']['input'];
  id: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  billing: BillingMutation;
  emoteSets: EmoteSetMutation;
  emotes: EmoteMutation;
  entitlementEdges: EntitlementEdgeMutation;
  jobs: JobMutation;
  product: ProductMutation;
  redeemCodes: RedeemCodeMutation;
  specialEvents: SpecialEventMutation;
  tickets: TicketMutation;
  userEditors: UserEditorMutation;
  userSessions: UserSessionMutation;
  users: UserMutation;
};

export type MutationBillingArgs = {
  userId: Scalars['Id']['input'];
};

export type Paint = {
  __typename?: 'Paint';
  createdById: Scalars['Id']['output'];
  data: PaintData;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Id']['output'];
  name: Scalars['String']['output'];
  searchUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  tags: Array<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type PaintData = {
  __typename?: 'PaintData';
  layers: Array<PaintLayer>;
  shadows: Array<PaintShadow>;
};

export type PaintGradientStop = {
  __typename?: 'PaintGradientStop';
  at: Scalars['Float']['output'];
  color: Color;
};

export type PaintLayer = {
  __typename?: 'PaintLayer';
  id: Scalars['Id']['output'];
  opacity: Scalars['Float']['output'];
  ty: PaintLayerType;
};

export type PaintLayerType =
  | PaintLayerTypeImage
  | PaintLayerTypeLinearGradient
  | PaintLayerTypeRadialGradient
  | PaintLayerTypeSingleColor;

export type PaintLayerTypeImage = {
  __typename?: 'PaintLayerTypeImage';
  images: Array<Image>;
};

export type PaintLayerTypeLinearGradient = {
  __typename?: 'PaintLayerTypeLinearGradient';
  angle: Scalars['Int']['output'];
  repeating: Scalars['Boolean']['output'];
  stops: Array<PaintGradientStop>;
};

export type PaintLayerTypeRadialGradient = {
  __typename?: 'PaintLayerTypeRadialGradient';
  repeating: Scalars['Boolean']['output'];
  shape: PaintRadialGradientShape;
  stops: Array<PaintGradientStop>;
};

export type PaintLayerTypeSingleColor = {
  __typename?: 'PaintLayerTypeSingleColor';
  color: Color;
};

export type PaintPermission = {
  __typename?: 'PaintPermission';
  admin: Scalars['Boolean']['output'];
  assign: Scalars['Boolean']['output'];
  manage: Scalars['Boolean']['output'];
};

export type PaintQuery = {
  __typename?: 'PaintQuery';
  paint?: Maybe<Paint>;
  paints: Array<Paint>;
};

export type PaintQueryPaintArgs = {
  id: Scalars['Id']['input'];
};

export enum PaintRadialGradientShape {
  Circle = 'CIRCLE',
  Ellipse = 'ELLIPSE',
}

export type PaintShadow = {
  __typename?: 'PaintShadow';
  blur: Scalars['Float']['output'];
  color: Color;
  offsetX: Scalars['Float']['output'];
  offsetY: Scalars['Float']['output'];
};

export type Permissions = {
  __typename?: 'Permissions';
  admin: AdminPermission;
  badge: BadgePermission;
  emote: EmotePermission;
  emoteModerationRequest: EmoteModerationRequestPermission;
  emoteModerationRequestLimit?: Maybe<Scalars['Int']['output']>;
  emoteModerationRequestPriority?: Maybe<Scalars['Int']['output']>;
  emoteSet: EmoteSetPermission;
  emoteSetCapacity?: Maybe<Scalars['Int']['output']>;
  emoteSetLimit?: Maybe<Scalars['Int']['output']>;
  flags: FlagPermission;
  paint: PaintPermission;
  personalEmoteSetCapacity?: Maybe<Scalars['Int']['output']>;
  ratelimits: Scalars['JSONObject']['output'];
  role: RolePermission;
  ticket: TicketPermission;
  user: UserPermission;
};

export enum Platform {
  Discord = 'DISCORD',
  Google = 'GOOGLE',
  Kick = 'KICK',
  Twitch = 'TWITCH',
}

export type Price = {
  __typename?: 'Price';
  amount: Scalars['Int']['output'];
  currency: Scalars['String']['output'];
};

export type Product = {
  __typename?: 'Product';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Id']['output'];
  name: Scalars['String']['output'];
  providerId: Scalars['String']['output'];
  searchUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type ProductMutation = {
  __typename?: 'ProductMutation';
  create: Product;
};

export type ProductMutationCreateArgs = {
  data: CreateProductInput;
};

export type ProductQuery = {
  __typename?: 'ProductQuery';
  subscriptionProduct?: Maybe<SubscriptionProduct>;
  subscriptionProducts: Array<SubscriptionProduct>;
};

export type ProductQuerySubscriptionProductArgs = {
  id: Scalars['Id']['input'];
};

export type ProviderSubscriptionId = {
  __typename?: 'ProviderSubscriptionId';
  id: Scalars['String']['output'];
  provider: SubscriptionProvider;
};

export type Query = {
  __typename?: 'Query';
  _service: _Service;
  backdoor: BackdoorQuery;
  badges: BadgeQuery;
  emoteSets: EmoteSetQuery;
  emotes: EmoteQuery;
  entitlements: EntitlementQuery;
  paints: PaintQuery;
  products: ProductQuery;
  redeemCodes: RedeemCodeQuery;
  roles: RoleQuery;
  search: SearchQuery;
  specialEvents: SpecialEventQuery;
  store: StoreQuery;
  users: UserQuery;
};

export enum Ranking {
  TopAllTime = 'TOP_ALL_TIME',
  TopDaily = 'TOP_DAILY',
  TopMonthly = 'TOP_MONTHLY',
  TopWeekly = 'TOP_WEEKLY',
  TrendingDaily = 'TRENDING_DAILY',
  TrendingMonthly = 'TRENDING_MONTHLY',
  TrendingWeekly = 'TRENDING_WEEKLY',
}

export type RawEntitlements = {
  __typename?: 'RawEntitlements';
  edges: Array<EntitlementEdgeAnyAny>;
  nodes: Array<EntitlementNodeAny>;
};

export type RedeemCode = {
  __typename?: 'RedeemCode';
  activePeriod?: Maybe<TimePeriod>;
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<User>;
  createdById: Scalars['Id']['output'];
  description?: Maybe<Scalars['String']['output']>;
  effect: CodeEffect;
  id: Scalars['Id']['output'];
  name: Scalars['String']['output'];
  remainingUses: Scalars['Int']['output'];
  searchUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  subscriptionEffect?: Maybe<RedeemCodeSubscriptionEffect>;
  tags: Array<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type RedeemCodeMutation = {
  __typename?: 'RedeemCodeMutation';
  create: RedeemCode;
  createBatch: Array<RedeemCode>;
  redeemCode: RedeemCodeOperation;
};

export type RedeemCodeMutationCreateArgs = {
  data: CreateRedeemCodeInput;
};

export type RedeemCodeMutationCreateBatchArgs = {
  data: CreateRedeemCodeBatchInput;
};

export type RedeemCodeMutationRedeemCodeArgs = {
  id: Scalars['Id']['input'];
};

export type RedeemCodeOperation = {
  __typename?: 'RedeemCodeOperation';
  deactivate: RedeemCode;
};

export type RedeemCodeQuery = {
  __typename?: 'RedeemCodeQuery';
  redeemCode?: Maybe<RedeemCode>;
  redeemCodes: RedeemCodeSearchResult;
};

export type RedeemCodeQueryRedeemCodeArgs = {
  id: Scalars['Id']['input'];
};

export type RedeemCodeQueryRedeemCodesArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  remainingUses?: InputMaybe<Scalars['Boolean']['input']>;
};

export type RedeemCodeSearchResult = {
  __typename?: 'RedeemCodeSearchResult';
  items: Array<RedeemCode>;
  pageCount: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

export type RedeemCodeSubscriptionEffect = {
  __typename?: 'RedeemCodeSubscriptionEffect';
  id: Scalars['Id']['output'];
  noRedirectToStripe: Scalars['Boolean']['output'];
  subscriptionProduct?: Maybe<SubscriptionProduct>;
  trialDays?: Maybe<Scalars['Int']['output']>;
};

export type RedeemCodeSubscriptionEffectInput = {
  noRedirectToStripe: Scalars['Boolean']['input'];
  productId: Scalars['Id']['input'];
  trialDays?: InputMaybe<Scalars['Int']['input']>;
};

export type RedeemResponse = {
  __typename?: 'RedeemResponse';
  checkoutUrl?: Maybe<Scalars['String']['output']>;
};

export type Role = {
  __typename?: 'Role';
  color?: Maybe<Color>;
  createdBy?: Maybe<User>;
  createdById: Scalars['Id']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Id']['output'];
  name: Scalars['String']['output'];
  searchUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  tags: Array<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type RolePermission = {
  __typename?: 'RolePermission';
  admin: Scalars['Boolean']['output'];
  assign: Scalars['Boolean']['output'];
  manage: Scalars['Boolean']['output'];
};

export type RoleQuery = {
  __typename?: 'RoleQuery';
  roles: Array<Role>;
};

export type SearchQuery = {
  __typename?: 'SearchQuery';
  all: SearchResultAll;
};

export type SearchQueryAllArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};

export type SearchResultAll = {
  __typename?: 'SearchResultAll';
  emotes: EmoteSearchResult;
  users: UserSearchResult;
};

export type Sort = {
  order: SortOrder;
  sortBy: SortBy;
};

export enum SortBy {
  NameAlphabetical = 'NAME_ALPHABETICAL',
  TopAllTime = 'TOP_ALL_TIME',
  TopDaily = 'TOP_DAILY',
  TopMonthly = 'TOP_MONTHLY',
  TopWeekly = 'TOP_WEEKLY',
  TrendingDaily = 'TRENDING_DAILY',
  TrendingMonthly = 'TRENDING_MONTHLY',
  TrendingWeekly = 'TRENDING_WEEKLY',
  UploadDate = 'UPLOAD_DATE',
}

export enum SortOrder {
  Ascending = 'ASCENDING',
  Descending = 'DESCENDING',
}

export type SpecialEvent = {
  __typename?: 'SpecialEvent';
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<User>;
  createdById: Scalars['Id']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Id']['output'];
  name: Scalars['String']['output'];
  searchUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  tags: Array<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type SpecialEventMutation = {
  __typename?: 'SpecialEventMutation';
  create: SpecialEvent;
};

export type SpecialEventMutationCreateArgs = {
  data: CreateSpecialEventInput;
};

export type SpecialEventQuery = {
  __typename?: 'SpecialEventQuery';
  specialEvents: Array<SpecialEvent>;
};

export type StoreQuery = {
  __typename?: 'StoreQuery';
  monthlyPaints: Array<Paint>;
};

export type SubscribeResponse = {
  __typename?: 'SubscribeResponse';
  checkoutUrl: Scalars['String']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  createdAt: Scalars['DateTime']['output'];
  endedAt?: Maybe<Scalars['DateTime']['output']>;
  id: SubscriptionId;
  searchUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  state: SubscriptionState;
  updatedAt: Scalars['DateTime']['output'];
};

export type SubscriptionBenefit = {
  __typename?: 'SubscriptionBenefit';
  id: Scalars['Id']['output'];
  name: Scalars['String']['output'];
};

export type SubscriptionId = {
  __typename?: 'SubscriptionId';
  productId: Scalars['Id']['output'];
  userId: Scalars['Id']['output'];
};

export type SubscriptionInfo = {
  __typename?: 'SubscriptionInfo';
  activePeriod?: Maybe<SubscriptionPeriod>;
  endDate?: Maybe<Scalars['DateTime']['output']>;
  periods: Array<SubscriptionPeriod>;
  totalDays: Scalars['Int']['output'];
};

export type SubscriptionPeriod = {
  __typename?: 'SubscriptionPeriod';
  autoRenew: Scalars['Boolean']['output'];
  createdBy: SubscriptionPeriodCreatedBy;
  end: Scalars['DateTime']['output'];
  giftedBy?: Maybe<User>;
  giftedById?: Maybe<Scalars['Id']['output']>;
  id: Scalars['Id']['output'];
  isTrial: Scalars['Boolean']['output'];
  productId: Scalars['StripeProductId']['output'];
  providerId?: Maybe<ProviderSubscriptionId>;
  searchUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  start: Scalars['DateTime']['output'];
  subscription: Subscription;
  subscriptionId: SubscriptionId;
  subscriptionProduct: SubscriptionProduct;
  subscriptionProductVariant: SubscriptionProductVariant;
  updatedAt: Scalars['DateTime']['output'];
};

export type SubscriptionPeriodCreatedBy =
  | SubscriptionPeriodCreatedByInvoice
  | SubscriptionPeriodCreatedByRedeemCode
  | SubscriptionPeriodCreatedBySystem;

export type SubscriptionPeriodCreatedByInvoice = {
  __typename?: 'SubscriptionPeriodCreatedByInvoice';
  invoiceId: Scalars['InvoiceId']['output'];
};

export type SubscriptionPeriodCreatedByRedeemCode = {
  __typename?: 'SubscriptionPeriodCreatedByRedeemCode';
  redeemCodeId: Scalars['Id']['output'];
};

export type SubscriptionPeriodCreatedBySystem = {
  __typename?: 'SubscriptionPeriodCreatedBySystem';
  reason?: Maybe<Scalars['String']['output']>;
};

export type SubscriptionProduct = {
  __typename?: 'SubscriptionProduct';
  benefits: Array<SubscriptionBenefit>;
  defaultVariant: SubscriptionProductVariant;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Id']['output'];
  name: Scalars['String']['output'];
  providerId: Scalars['String']['output'];
  searchUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  variants: Array<SubscriptionProductVariant>;
};

export enum SubscriptionProductKind {
  Monthly = 'MONTHLY',
  Yearly = 'YEARLY',
}

export type SubscriptionProductVariant = {
  __typename?: 'SubscriptionProductVariant';
  id: Scalars['StripeProductId']['output'];
  kind: SubscriptionProductKind;
  paypalId?: Maybe<Scalars['String']['output']>;
  price: Price;
};

export type SubscriptionProductVariantPriceArgs = {
  preferredCurrency?: InputMaybe<Scalars['String']['input']>;
};

export enum SubscriptionProvider {
  PayPal = 'PAY_PAL',
  Stripe = 'STRIPE',
}

export enum SubscriptionState {
  Active = 'ACTIVE',
  CancelAtEnd = 'CANCEL_AT_END',
  Ended = 'ENDED',
}

export type Tags = {
  match: TagsMatch;
  tags: Array<Scalars['String']['input']>;
};

export enum TagsMatch {
  All = 'ALL',
  Any = 'ANY',
}

export type Ticket = {
  __typename?: 'Ticket';
  authorId: Scalars['Id']['output'];
  countryCode?: Maybe<Scalars['String']['output']>;
  id: Scalars['Id']['output'];
  kind: TicketKind;
  locked: Scalars['Boolean']['output'];
  members: Array<TicketMember>;
  open: Scalars['Boolean']['output'];
  priority: TicketPriority;
  searchUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  tags: Array<Scalars['String']['output']>;
  targets: Array<TicketTarget>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export enum TicketKind {
  Abuse = 'ABUSE',
  Billing = 'BILLING',
  Generic = 'GENERIC',
}

export type TicketMember = {
  __typename?: 'TicketMember';
  kind: TicketMemberKind;
  lastRead?: Maybe<Scalars['Id']['output']>;
  notifications: Scalars['Boolean']['output'];
  userId: Scalars['Id']['output'];
};

export enum TicketMemberKind {
  Assigned = 'ASSIGNED',
  Member = 'MEMBER',
  Watcher = 'WATCHER',
}

export type TicketMutation = {
  __typename?: 'TicketMutation';
  createAbuseTicket: Ticket;
};

export type TicketMutationCreateAbuseTicketArgs = {
  content?: InputMaybe<Scalars['String']['input']>;
  target: TicketTargetInput;
  title: Scalars['String']['input'];
};

export type TicketPermission = {
  __typename?: 'TicketPermission';
  admin: Scalars['Boolean']['output'];
  create: Scalars['Boolean']['output'];
  manageAbuse: Scalars['Boolean']['output'];
  manageBilling: Scalars['Boolean']['output'];
  manageGeneric: Scalars['Boolean']['output'];
  message: Scalars['Boolean']['output'];
};

export enum TicketPriority {
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM',
  Urgent = 'URGENT',
}

export type TicketTarget = {
  __typename?: 'TicketTarget';
  id: Scalars['Id']['output'];
  kind: TicketTargetType;
};

export type TicketTargetInput = {
  id: Scalars['Id']['input'];
  kind: TicketTargetType;
};

export enum TicketTargetType {
  Emote = 'EMOTE',
  EmoteSet = 'EMOTE_SET',
  User = 'USER',
}

export type TimePeriod = {
  __typename?: 'TimePeriod';
  end: Scalars['DateTime']['output'];
  start: Scalars['DateTime']['output'];
};

export type TimePeriodInput = {
  end: Scalars['DateTime']['input'];
  start: Scalars['DateTime']['input'];
};

export type User = {
  __typename?: 'User';
  billing: Billing;
  connections: Array<UserConnection>;
  createdAt: Scalars['DateTime']['output'];
  editableEmoteSetIds: Array<Scalars['Id']['output']>;
  editorFor: Array<UserEditor>;
  editors: Array<UserEditor>;
  emoteSets: Array<EmoteSet>;
  events: Array<UserEvent>;
  highestRoleColor?: Maybe<Color>;
  highestRoleRank: Scalars['Int']['output'];
  id: Scalars['Id']['output'];
  inventory: UserInventory;
  mainConnection?: Maybe<UserConnection>;
  ownedEmoteSets: Array<EmoteSet>;
  ownedEmotes: Array<Emote>;
  permissions: Permissions;
  personalEmoteSet?: Maybe<EmoteSet>;
  rawEntitlements: RawEntitlements;
  relatedEvents: Array<AnyEvent>;
  roleIds: Array<Scalars['Id']['output']>;
  roles: Array<Role>;
  searchUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  specialEmoteSets: Array<EmoteSet>;
  stripeCustomerId?: Maybe<Scalars['CustomerId']['output']>;
  style: UserStyle;
  updatedAt: Scalars['DateTime']['output'];
};

export type UserBillingArgs = {
  productId: Scalars['Id']['input'];
};

export type UserEventsArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
};

export type UserInventoryArgs = {
  includeInaccessible?: Scalars['Boolean']['input'];
};

export type UserRelatedEventsArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
};

export type UserConnection = {
  __typename?: 'UserConnection';
  allowLogin: Scalars['Boolean']['output'];
  linkedAt: Scalars['DateTime']['output'];
  platform: Platform;
  platformAvatarUrl?: Maybe<Scalars['String']['output']>;
  platformDisplayName: Scalars['String']['output'];
  platformId: Scalars['String']['output'];
  platformUsername: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type UserEditor = {
  __typename?: 'UserEditor';
  addedAt: Scalars['DateTime']['output'];
  addedById: Scalars['Id']['output'];
  editor?: Maybe<User>;
  editorId: Scalars['Id']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  permissions: UserEditorPermissions;
  searchUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  state: UserEditorState;
  updatedAt: Scalars['DateTime']['output'];
  user?: Maybe<User>;
  userId: Scalars['Id']['output'];
};

export type UserEditorMutation = {
  __typename?: 'UserEditorMutation';
  create: UserEditor;
  editor: UserEditorOperation;
};

export type UserEditorMutationCreateArgs = {
  editorId: Scalars['Id']['input'];
  permissions: UserEditorPermissionsInput;
  userId: Scalars['Id']['input'];
};

export type UserEditorMutationEditorArgs = {
  editorId: Scalars['Id']['input'];
  userId: Scalars['Id']['input'];
};

export type UserEditorOperation = {
  __typename?: 'UserEditorOperation';
  delete: Scalars['Boolean']['output'];
  updatePermissions: UserEditor;
  updateState: UserEditor;
};

export type UserEditorOperationUpdatePermissionsArgs = {
  permissions: UserEditorPermissionsInput;
};

export type UserEditorOperationUpdateStateArgs = {
  state: UserEditorUpdateState;
};

export type UserEditorPermissions = {
  __typename?: 'UserEditorPermissions';
  emote: EditorEmotePermission;
  emoteSet: EditorEmoteSetPermission;
  superAdmin: Scalars['Boolean']['output'];
  user: EditorUserPermission;
};

export type UserEditorPermissionsInput = {
  emote: EditorEmotePermissionInput;
  emoteSet: EditorEmoteSetPermissionInput;
  superAdmin: Scalars['Boolean']['input'];
  user: EditorUserPermissionInput;
};

export enum UserEditorState {
  Accepted = 'ACCEPTED',
  Pending = 'PENDING',
  Rejected = 'REJECTED',
}

export enum UserEditorUpdateState {
  Accept = 'ACCEPT',
  Reject = 'REJECT',
}

export type UserEvent = {
  __typename?: 'UserEvent';
  actor?: Maybe<User>;
  actorId?: Maybe<Scalars['Id']['output']>;
  createdAt: Scalars['DateTime']['output'];
  data: EventUserData;
  id: Scalars['Id']['output'];
  searchUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  target?: Maybe<User>;
  targetId: Scalars['Id']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type UserInventory = {
  __typename?: 'UserInventory';
  badges: Array<InventoryEntitlementEdgeAnyBadge>;
  paints: Array<InventoryEntitlementEdgeAnyPaint>;
  products: Array<InventoryEntitlementEdgeAnyProduct>;
};

export type UserMutation = {
  __typename?: 'UserMutation';
  user: UserOperation;
};

export type UserMutationUserArgs = {
  id: Scalars['Id']['input'];
};

export type UserOperation = {
  __typename?: 'UserOperation';
  activeBadge: User;
  activeEmoteSet: User;
  activePaint: User;
  deleteAllSessions: Scalars['Int']['output'];
  mainConnection: User;
  manuallyLinkKick: User;
  removeConnection: User;
  removeProfilePicture: User;
};

export type UserOperationActiveBadgeArgs = {
  badgeId?: InputMaybe<Scalars['Id']['input']>;
};

export type UserOperationActiveEmoteSetArgs = {
  emoteSetId?: InputMaybe<Scalars['Id']['input']>;
};

export type UserOperationActivePaintArgs = {
  paintId?: InputMaybe<Scalars['Id']['input']>;
};

export type UserOperationMainConnectionArgs = {
  platform: Platform;
  platformId: Scalars['String']['input'];
};

export type UserOperationManuallyLinkKickArgs = {
  kickChannel: KickLinkInput;
};

export type UserOperationRemoveConnectionArgs = {
  platform: Platform;
  platformId: Scalars['String']['input'];
};

export type UserPermission = {
  __typename?: 'UserPermission';
  admin: Scalars['Boolean']['output'];
  billing: Scalars['Boolean']['output'];
  inviteEditors: Scalars['Boolean']['output'];
  login: Scalars['Boolean']['output'];
  manageAny: Scalars['Boolean']['output'];
  manageBilling: Scalars['Boolean']['output'];
  manageSessions: Scalars['Boolean']['output'];
  moderate: Scalars['Boolean']['output'];
  useBadge: Scalars['Boolean']['output'];
  useCustomProfilePicture: Scalars['Boolean']['output'];
  usePaint: Scalars['Boolean']['output'];
  usePersonalEmoteSet: Scalars['Boolean']['output'];
  viewHidden: Scalars['Boolean']['output'];
};

export type UserProfilePicture = {
  __typename?: 'UserProfilePicture';
  id: Scalars['Id']['output'];
  images: Array<Image>;
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['Id']['output'];
};

export type UserQuery = {
  __typename?: 'UserQuery';
  me?: Maybe<User>;
  search: UserSearchResult;
  user?: Maybe<User>;
  userByConnection?: Maybe<User>;
};

export type UserQuerySearchArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};

export type UserQueryUserArgs = {
  id: Scalars['Id']['input'];
};

export type UserQueryUserByConnectionArgs = {
  platform: Platform;
  platformId: Scalars['String']['input'];
};

export type UserSearchResult = {
  __typename?: 'UserSearchResult';
  items: Array<User>;
  pageCount: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

export type UserSessionMutation = {
  __typename?: 'UserSessionMutation';
  create: Scalars['String']['output'];
};

export type UserSessionMutationCreateArgs = {
  expiresAt: Scalars['DateTime']['input'];
  userId: Scalars['Id']['input'];
};

export type UserStyle = {
  __typename?: 'UserStyle';
  activeBadge?: Maybe<Badge>;
  activeBadgeId?: Maybe<Scalars['Id']['output']>;
  activeEmoteSet?: Maybe<EmoteSet>;
  activeEmoteSetId?: Maybe<Scalars['Id']['output']>;
  activePaint?: Maybe<Paint>;
  activePaintId?: Maybe<Scalars['Id']['output']>;
  activeProfilePicture?: Maybe<UserProfilePicture>;
  activeProfilePictureId?: Maybe<Scalars['Id']['output']>;
  pendingProfilePictureId?: Maybe<Scalars['Id']['output']>;
};

export type _Service = {
  __typename?: '_Service';
  sdl?: Maybe<Scalars['String']['output']>;
};

export type ImageFragmentFragment = {
  __typename?: 'Image';
  url: string;
  mime: string;
  size: number;
  scale: number;
  width: number;
  height: number;
  frameCount: number;
};

export type BadgeQueryQueryVariables = Exact<{
  id: Scalars['Id']['input'];
}>;

export type BadgeQueryQuery = {
  __typename?: 'Query';
  badges: {
    __typename?: 'BadgeQuery';
    badge?: {
      __typename?: 'Badge';
      id: string;
      name: string;
      description?: string | null;
      tags: Array<string>;
      createdById: string;
      updatedAt: string;
      searchUpdatedAt?: string | null;
      images: Array<{
        __typename?: 'Image';
        url: string;
        mime: string;
        size: number;
        scale: number;
        width: number;
        height: number;
        frameCount: number;
      }>;
    } | null;
  };
};

export type BadgesQueryQueryVariables = Exact<{ [key: string]: never }>;

export type BadgesQueryQuery = {
  __typename?: 'Query';
  badges: {
    __typename?: 'BadgeQuery';
    badges: Array<{
      __typename?: 'Badge';
      id: string;
      name: string;
      description?: string | null;
      tags: Array<string>;
      createdById: string;
      updatedAt: string;
      searchUpdatedAt?: string | null;
      images: Array<{
        __typename?: 'Image';
        url: string;
        mime: string;
        size: number;
        scale: number;
        width: number;
        height: number;
        frameCount: number;
      }>;
    }>;
  };
};

export type EmoteQueryQueryVariables = Exact<{
  id: Scalars['Id']['input'];
}>;

export type EmoteQueryQuery = {
  __typename?: 'Query';
  emotes: {
    __typename?: 'EmoteQuery';
    emote?: {
      __typename?: 'Emote';
      id: string;
      defaultName: string;
      tags: Array<string>;
      flags: {
        __typename?: 'EmoteFlags';
        animated: boolean;
        defaultZeroWidth: boolean;
        publicListed: boolean;
      };
      images: Array<{
        __typename?: 'Image';
        url: string;
        mime: string;
        size: number;
        scale: number;
        width: number;
        height: number;
        frameCount: number;
      }>;
      owner?: {
        __typename?: 'User';
        id: string;
        mainConnection?: {
          __typename?: 'UserConnection';
          platformDisplayName: string;
        } | null;
      } | null;
    } | null;
  };
};

export type EmoteSetCustomQueryVariables = Exact<{
  id: Scalars['Id']['input'];
}>;

export type EmoteSetCustomQuery = {
  __typename?: 'Query';
  emoteSets: {
    __typename?: 'EmoteSetQuery';
    emoteSet?: {
      __typename?: 'EmoteSet';
      id: string;
      name: string;
      capacity?: number | null;
      ownerId?: string | null;
      kind: EmoteSetKind;
      updatedAt: string;
      emotes: {
        __typename?: 'EmoteSetEmoteSearchResult';
        totalCount: number;
        items: Array<{
          __typename?: 'EmoteSetEmote';
          id: string;
          alias: string;
          addedById?: string | null;
          emote: {
            __typename?: 'Emote';
            id: string;
            tags: Array<string>;
            aspectRatio: number;
            images: Array<{
              __typename?: 'Image';
              url: string;
              mime: string;
              size: number;
              scale: number;
              width: number;
              height: number;
              frameCount: number;
            }>;
          };
          flags: { __typename?: 'EmoteSetEmoteFlags'; zeroWidth: boolean };
        }>;
      };
    } | null;
  };
};

export type PaintQueryQueryVariables = Exact<{
  id: Scalars['Id']['input'];
}>;

export type PaintQueryQuery = {
  __typename?: 'Query';
  paints: {
    __typename?: 'PaintQuery';
    paint?: {
      __typename?: 'Paint';
      id: string;
      name: string;
      description?: string | null;
      tags: Array<string>;
      createdById: string;
      updatedAt: string;
      data: {
        __typename?: 'PaintData';
        layers: Array<{
          __typename?: 'PaintLayer';
          id: string;
          opacity: number;
        }>;
        shadows: Array<{
          __typename?: 'PaintShadow';
          offsetX: number;
          offsetY: number;
          blur: number;
          color: {
            __typename?: 'Color';
            hex: string;
            r: number;
            g: number;
            b: number;
            a: number;
          };
        }>;
      };
    } | null;
  };
};

export type PaintsQueryQueryVariables = Exact<{ [key: string]: never }>;

export type PaintsQueryQuery = {
  __typename?: 'Query';
  paints: {
    __typename?: 'PaintQuery';
    paints: Array<{
      __typename?: 'Paint';
      id: string;
      name: string;
      description?: string | null;
      tags: Array<string>;
      createdById: string;
      updatedAt: string;
      data: {
        __typename?: 'PaintData';
        layers: Array<{
          __typename?: 'PaintLayer';
          id: string;
          opacity: number;
        }>;
        shadows: Array<{
          __typename?: 'PaintShadow';
          offsetX: number;
          offsetY: number;
          blur: number;
          color: {
            __typename?: 'Color';
            hex: string;
            r: number;
            g: number;
            b: number;
            a: number;
          };
        }>;
      };
    }>;
  };
};

export type UserByConnectionQueryVariables = Exact<{
  platformId: Scalars['String']['input'];
}>;

export type UserByConnectionQuery = {
  __typename?: 'Query';
  users: {
    __typename?: 'UserQuery';
    userByConnection?: {
      __typename?: 'User';
      id: string;
      emoteSets: Array<{
        __typename?: 'EmoteSet';
        id: string;
        name: string;
        kind: EmoteSetKind;
      }>;
    } | null;
  };
};

export type UserCosmeticsQueryVariables = Exact<{
  id: Scalars['Id']['input'];
}>;

export type UserCosmeticsQuery = {
  __typename?: 'Query';
  users: {
    __typename?: 'UserQuery';
    user?: {
      __typename?: 'User';
      id: string;
      connections: Array<{
        __typename?: 'UserConnection';
        platform: Platform;
        platformId: string;
        platformDisplayName: string;
      }>;
      style: {
        __typename?: 'UserStyle';
        activePaintId?: string | null;
        activeBadgeId?: string | null;
        activePaint?: {
          __typename?: 'Paint';
          id: string;
          name: string;
          data: {
            __typename?: 'PaintData';
            layers: Array<{
              __typename?: 'PaintLayer';
              id: string;
              opacity: number;
              ty:
                | {
                    __typename?: 'PaintLayerTypeImage';
                    images: Array<{
                      __typename?: 'Image';
                      url: string;
                      mime: string;
                      size: number;
                      scale: number;
                      width: number;
                      height: number;
                      frameCount: number;
                    }>;
                  }
                | {
                    __typename?: 'PaintLayerTypeLinearGradient';
                    angle: number;
                    repeating: boolean;
                    stops: Array<{
                      __typename?: 'PaintGradientStop';
                      at: number;
                      color: {
                        __typename?: 'Color';
                        r: number;
                        g: number;
                        b: number;
                        a: number;
                      };
                    }>;
                  }
                | {
                    __typename?: 'PaintLayerTypeRadialGradient';
                    repeating: boolean;
                    shape: PaintRadialGradientShape;
                    stops: Array<{
                      __typename?: 'PaintGradientStop';
                      at: number;
                      color: {
                        __typename?: 'Color';
                        r: number;
                        g: number;
                        b: number;
                        a: number;
                      };
                    }>;
                  }
                | {
                    __typename?: 'PaintLayerTypeSingleColor';
                    color: {
                      __typename?: 'Color';
                      r: number;
                      g: number;
                      b: number;
                      a: number;
                    };
                  };
            }>;
            shadows: Array<{
              __typename?: 'PaintShadow';
              offsetX: number;
              offsetY: number;
              blur: number;
              color: {
                __typename?: 'Color';
                r: number;
                g: number;
                b: number;
                a: number;
              };
            }>;
          };
        } | null;
        activeBadge?: {
          __typename?: 'Badge';
          id: string;
          name: string;
          description?: string | null;
          images: Array<{
            __typename?: 'Image';
            url: string;
            mime: string;
            size: number;
            scale: number;
            width: number;
            height: number;
            frameCount: number;
          }>;
        } | null;
      };
    } | null;
  };
};

export type UserPersonalEmotesQueryQueryVariables = Exact<{
  platformId: Scalars['String']['input'];
}>;

export type UserPersonalEmotesQueryQuery = {
  __typename?: 'Query';
  users: {
    __typename?: 'UserQuery';
    userByConnection?: {
      __typename?: 'User';
      id: string;
      personalEmoteSet?: {
        __typename?: 'EmoteSet';
        id: string;
        name: string;
        emotes: {
          __typename?: 'EmoteSetEmoteSearchResult';
          items: Array<{
            __typename?: 'EmoteSetEmote';
            id: string;
            alias: string;
            emote: {
              __typename?: 'Emote';
              id: string;
              defaultName: string;
              flags: {
                __typename?: 'EmoteFlags';
                animated: boolean;
                approvedPersonal: boolean;
                defaultZeroWidth: boolean;
              };
              images: Array<{
                __typename?: 'Image';
                url: string;
                mime: string;
                size: number;
                scale: number;
                width: number;
                height: number;
                frameCount: number;
              }>;
              owner?: {
                __typename?: 'User';
                id: string;
                mainConnection?: {
                  __typename?: 'UserConnection';
                  platformDisplayName: string;
                } | null;
              } | null;
            };
          }>;
        };
      } | null;
    } | null;
  };
};

export const ImageFragmentFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ImageFragment' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'Image' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'url' } },
          { kind: 'Field', name: { kind: 'Name', value: 'mime' } },
          { kind: 'Field', name: { kind: 'Name', value: 'size' } },
          { kind: 'Field', name: { kind: 'Name', value: 'scale' } },
          { kind: 'Field', name: { kind: 'Name', value: 'width' } },
          { kind: 'Field', name: { kind: 'Name', value: 'height' } },
          { kind: 'Field', name: { kind: 'Name', value: 'frameCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const BadgeQueryDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'BadgeQuery' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Id' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'badges' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'badge' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'id' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'id' },
                      },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'description' },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'tags' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'images' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'FragmentSpread',
                              name: { kind: 'Name', value: 'ImageFragment' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'createdById' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'updatedAt' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'searchUpdatedAt' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ImageFragment' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'Image' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'url' } },
          { kind: 'Field', name: { kind: 'Name', value: 'mime' } },
          { kind: 'Field', name: { kind: 'Name', value: 'size' } },
          { kind: 'Field', name: { kind: 'Name', value: 'scale' } },
          { kind: 'Field', name: { kind: 'Name', value: 'width' } },
          { kind: 'Field', name: { kind: 'Name', value: 'height' } },
          { kind: 'Field', name: { kind: 'Name', value: 'frameCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type BadgeQueryQueryResult = Apollo.QueryResult<
  BadgeQueryQuery,
  BadgeQueryQueryVariables
>;
export const BadgesQueryDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'BadgesQuery' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'badges' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'badges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'description' },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'tags' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'images' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'FragmentSpread',
                              name: { kind: 'Name', value: 'ImageFragment' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'createdById' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'updatedAt' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'searchUpdatedAt' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ImageFragment' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'Image' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'url' } },
          { kind: 'Field', name: { kind: 'Name', value: 'mime' } },
          { kind: 'Field', name: { kind: 'Name', value: 'size' } },
          { kind: 'Field', name: { kind: 'Name', value: 'scale' } },
          { kind: 'Field', name: { kind: 'Name', value: 'width' } },
          { kind: 'Field', name: { kind: 'Name', value: 'height' } },
          { kind: 'Field', name: { kind: 'Name', value: 'frameCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type BadgesQueryQueryResult = Apollo.QueryResult<
  BadgesQueryQuery,
  BadgesQueryQueryVariables
>;
export const EmoteQueryDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'EmoteQuery' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Id' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'emotes' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'emote' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'id' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'id' },
                      },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'defaultName' },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'tags' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'flags' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'animated' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'defaultZeroWidth' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'publicListed' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'images' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'FragmentSpread',
                              name: { kind: 'Name', value: 'ImageFragment' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'owner' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'mainConnection' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: {
                                      kind: 'Name',
                                      value: 'platformDisplayName',
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ImageFragment' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'Image' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'url' } },
          { kind: 'Field', name: { kind: 'Name', value: 'mime' } },
          { kind: 'Field', name: { kind: 'Name', value: 'size' } },
          { kind: 'Field', name: { kind: 'Name', value: 'scale' } },
          { kind: 'Field', name: { kind: 'Name', value: 'width' } },
          { kind: 'Field', name: { kind: 'Name', value: 'height' } },
          { kind: 'Field', name: { kind: 'Name', value: 'frameCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type EmoteQueryQueryResult = Apollo.QueryResult<
  EmoteQueryQuery,
  EmoteQueryQueryVariables
>;
export const EmoteSetCustomDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'emoteSetCustom' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Id' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'emoteSets' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'emoteSet' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'id' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'id' },
                      },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'capacity' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'ownerId' },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'updatedAt' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'emotes' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'totalCount' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'items' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'id' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'alias' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'addedById' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'emote' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'id' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'tags' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'aspectRatio',
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'images',
                                          },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              {
                                                kind: 'FragmentSpread',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'ImageFragment',
                                                },
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'flags' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'zeroWidth',
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ImageFragment' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'Image' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'url' } },
          { kind: 'Field', name: { kind: 'Name', value: 'mime' } },
          { kind: 'Field', name: { kind: 'Name', value: 'size' } },
          { kind: 'Field', name: { kind: 'Name', value: 'scale' } },
          { kind: 'Field', name: { kind: 'Name', value: 'width' } },
          { kind: 'Field', name: { kind: 'Name', value: 'height' } },
          { kind: 'Field', name: { kind: 'Name', value: 'frameCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type EmoteSetCustomQueryResult = Apollo.QueryResult<
  EmoteSetCustomQuery,
  EmoteSetCustomQueryVariables
>;
export const PaintQueryDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'PaintQuery' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Id' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'paints' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'paint' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'id' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'id' },
                      },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'description' },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'tags' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'data' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'layers' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'id' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'opacity' },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'shadows' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'color' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'hex' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'r' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'g' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'b' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'a' },
                                        },
                                      ],
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'offsetX' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'offsetY' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'blur' },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'createdById' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'updatedAt' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type PaintQueryQueryResult = Apollo.QueryResult<
  PaintQueryQuery,
  PaintQueryQueryVariables
>;
export const PaintsQueryDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'PaintsQuery' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'paints' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'paints' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'description' },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'tags' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'data' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'layers' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'id' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'opacity' },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'shadows' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'color' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'hex' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'r' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'g' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'b' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'a' },
                                        },
                                      ],
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'offsetX' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'offsetY' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'blur' },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'createdById' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'updatedAt' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type PaintsQueryQueryResult = Apollo.QueryResult<
  PaintsQueryQuery,
  PaintsQueryQueryVariables
>;
export const UserByConnectionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'UserByConnection' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'platformId' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'String' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'users' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'userByConnection' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'platform' },
                      value: { kind: 'EnumValue', value: 'TWITCH' },
                    },
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'platformId' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'platformId' },
                      },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'emoteSets' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'kind' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type UserByConnectionQueryResult = Apollo.QueryResult<
  UserByConnectionQuery,
  UserByConnectionQueryVariables
>;
export const UserCosmeticsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'UserCosmetics' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Id' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'users' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'id' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'id' },
                      },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'connections' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'platform' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'platformId' },
                            },
                            {
                              kind: 'Field',
                              name: {
                                kind: 'Name',
                                value: 'platformDisplayName',
                              },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'style' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'activePaintId' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'activeBadgeId' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'activePaint' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'id' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'name' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'data' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'layers',
                                          },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'id',
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'opacity',
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'ty',
                                                },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    {
                                                      kind: 'InlineFragment',
                                                      typeCondition: {
                                                        kind: 'NamedType',
                                                        name: {
                                                          kind: 'Name',
                                                          value:
                                                            'PaintLayerTypeLinearGradient',
                                                        },
                                                      },
                                                      selectionSet: {
                                                        kind: 'SelectionSet',
                                                        selections: [
                                                          {
                                                            kind: 'Field',
                                                            name: {
                                                              kind: 'Name',
                                                              value: 'angle',
                                                            },
                                                          },
                                                          {
                                                            kind: 'Field',
                                                            name: {
                                                              kind: 'Name',
                                                              value:
                                                                'repeating',
                                                            },
                                                          },
                                                          {
                                                            kind: 'Field',
                                                            name: {
                                                              kind: 'Name',
                                                              value: 'stops',
                                                            },
                                                            selectionSet: {
                                                              kind: 'SelectionSet',
                                                              selections: [
                                                                {
                                                                  kind: 'Field',
                                                                  name: {
                                                                    kind: 'Name',
                                                                    value: 'at',
                                                                  },
                                                                },
                                                                {
                                                                  kind: 'Field',
                                                                  name: {
                                                                    kind: 'Name',
                                                                    value:
                                                                      'color',
                                                                  },
                                                                  selectionSet:
                                                                    {
                                                                      kind: 'SelectionSet',
                                                                      selections:
                                                                        [
                                                                          {
                                                                            kind: 'Field',
                                                                            name: {
                                                                              kind: 'Name',
                                                                              value:
                                                                                'r',
                                                                            },
                                                                          },
                                                                          {
                                                                            kind: 'Field',
                                                                            name: {
                                                                              kind: 'Name',
                                                                              value:
                                                                                'g',
                                                                            },
                                                                          },
                                                                          {
                                                                            kind: 'Field',
                                                                            name: {
                                                                              kind: 'Name',
                                                                              value:
                                                                                'b',
                                                                            },
                                                                          },
                                                                          {
                                                                            kind: 'Field',
                                                                            name: {
                                                                              kind: 'Name',
                                                                              value:
                                                                                'a',
                                                                            },
                                                                          },
                                                                        ],
                                                                    },
                                                                },
                                                              ],
                                                            },
                                                          },
                                                        ],
                                                      },
                                                    },
                                                    {
                                                      kind: 'InlineFragment',
                                                      typeCondition: {
                                                        kind: 'NamedType',
                                                        name: {
                                                          kind: 'Name',
                                                          value:
                                                            'PaintLayerTypeRadialGradient',
                                                        },
                                                      },
                                                      selectionSet: {
                                                        kind: 'SelectionSet',
                                                        selections: [
                                                          {
                                                            kind: 'Field',
                                                            name: {
                                                              kind: 'Name',
                                                              value:
                                                                'repeating',
                                                            },
                                                          },
                                                          {
                                                            kind: 'Field',
                                                            name: {
                                                              kind: 'Name',
                                                              value: 'shape',
                                                            },
                                                          },
                                                          {
                                                            kind: 'Field',
                                                            name: {
                                                              kind: 'Name',
                                                              value: 'stops',
                                                            },
                                                            selectionSet: {
                                                              kind: 'SelectionSet',
                                                              selections: [
                                                                {
                                                                  kind: 'Field',
                                                                  name: {
                                                                    kind: 'Name',
                                                                    value: 'at',
                                                                  },
                                                                },
                                                                {
                                                                  kind: 'Field',
                                                                  name: {
                                                                    kind: 'Name',
                                                                    value:
                                                                      'color',
                                                                  },
                                                                  selectionSet:
                                                                    {
                                                                      kind: 'SelectionSet',
                                                                      selections:
                                                                        [
                                                                          {
                                                                            kind: 'Field',
                                                                            name: {
                                                                              kind: 'Name',
                                                                              value:
                                                                                'r',
                                                                            },
                                                                          },
                                                                          {
                                                                            kind: 'Field',
                                                                            name: {
                                                                              kind: 'Name',
                                                                              value:
                                                                                'g',
                                                                            },
                                                                          },
                                                                          {
                                                                            kind: 'Field',
                                                                            name: {
                                                                              kind: 'Name',
                                                                              value:
                                                                                'b',
                                                                            },
                                                                          },
                                                                          {
                                                                            kind: 'Field',
                                                                            name: {
                                                                              kind: 'Name',
                                                                              value:
                                                                                'a',
                                                                            },
                                                                          },
                                                                        ],
                                                                    },
                                                                },
                                                              ],
                                                            },
                                                          },
                                                        ],
                                                      },
                                                    },
                                                    {
                                                      kind: 'InlineFragment',
                                                      typeCondition: {
                                                        kind: 'NamedType',
                                                        name: {
                                                          kind: 'Name',
                                                          value:
                                                            'PaintLayerTypeSingleColor',
                                                        },
                                                      },
                                                      selectionSet: {
                                                        kind: 'SelectionSet',
                                                        selections: [
                                                          {
                                                            kind: 'Field',
                                                            name: {
                                                              kind: 'Name',
                                                              value: 'color',
                                                            },
                                                            selectionSet: {
                                                              kind: 'SelectionSet',
                                                              selections: [
                                                                {
                                                                  kind: 'Field',
                                                                  name: {
                                                                    kind: 'Name',
                                                                    value: 'r',
                                                                  },
                                                                },
                                                                {
                                                                  kind: 'Field',
                                                                  name: {
                                                                    kind: 'Name',
                                                                    value: 'g',
                                                                  },
                                                                },
                                                                {
                                                                  kind: 'Field',
                                                                  name: {
                                                                    kind: 'Name',
                                                                    value: 'b',
                                                                  },
                                                                },
                                                                {
                                                                  kind: 'Field',
                                                                  name: {
                                                                    kind: 'Name',
                                                                    value: 'a',
                                                                  },
                                                                },
                                                              ],
                                                            },
                                                          },
                                                        ],
                                                      },
                                                    },
                                                    {
                                                      kind: 'InlineFragment',
                                                      typeCondition: {
                                                        kind: 'NamedType',
                                                        name: {
                                                          kind: 'Name',
                                                          value:
                                                            'PaintLayerTypeImage',
                                                        },
                                                      },
                                                      selectionSet: {
                                                        kind: 'SelectionSet',
                                                        selections: [
                                                          {
                                                            kind: 'Field',
                                                            name: {
                                                              kind: 'Name',
                                                              value: 'images',
                                                            },
                                                            selectionSet: {
                                                              kind: 'SelectionSet',
                                                              selections: [
                                                                {
                                                                  kind: 'FragmentSpread',
                                                                  name: {
                                                                    kind: 'Name',
                                                                    value:
                                                                      'ImageFragment',
                                                                  },
                                                                },
                                                              ],
                                                            },
                                                          },
                                                        ],
                                                      },
                                                    },
                                                  ],
                                                },
                                              },
                                            ],
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'shadows',
                                          },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'offsetX',
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'offsetY',
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'blur',
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'color',
                                                },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    {
                                                      kind: 'Field',
                                                      name: {
                                                        kind: 'Name',
                                                        value: 'r',
                                                      },
                                                    },
                                                    {
                                                      kind: 'Field',
                                                      name: {
                                                        kind: 'Name',
                                                        value: 'g',
                                                      },
                                                    },
                                                    {
                                                      kind: 'Field',
                                                      name: {
                                                        kind: 'Name',
                                                        value: 'b',
                                                      },
                                                    },
                                                    {
                                                      kind: 'Field',
                                                      name: {
                                                        kind: 'Name',
                                                        value: 'a',
                                                      },
                                                    },
                                                  ],
                                                },
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'activeBadge' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'id' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'name' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: {
                                      kind: 'Name',
                                      value: 'description',
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'images' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'FragmentSpread',
                                          name: {
                                            kind: 'Name',
                                            value: 'ImageFragment',
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ImageFragment' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'Image' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'url' } },
          { kind: 'Field', name: { kind: 'Name', value: 'mime' } },
          { kind: 'Field', name: { kind: 'Name', value: 'size' } },
          { kind: 'Field', name: { kind: 'Name', value: 'scale' } },
          { kind: 'Field', name: { kind: 'Name', value: 'width' } },
          { kind: 'Field', name: { kind: 'Name', value: 'height' } },
          { kind: 'Field', name: { kind: 'Name', value: 'frameCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type UserCosmeticsQueryResult = Apollo.QueryResult<
  UserCosmeticsQuery,
  UserCosmeticsQueryVariables
>;
export const UserPersonalEmotesQueryDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'UserPersonalEmotesQuery' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'platformId' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'String' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'users' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'userByConnection' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'platform' },
                      value: { kind: 'EnumValue', value: 'TWITCH' },
                    },
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'platformId' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'platformId' },
                      },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'personalEmoteSet' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'emotes' },
                              arguments: [
                                {
                                  kind: 'Argument',
                                  name: { kind: 'Name', value: 'page' },
                                  value: { kind: 'IntValue', value: '1' },
                                },
                                {
                                  kind: 'Argument',
                                  name: { kind: 'Name', value: 'perPage' },
                                  value: { kind: 'IntValue', value: '100' },
                                },
                              ],
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'items' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'id' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'alias',
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'emote',
                                          },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'id',
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'defaultName',
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'flags',
                                                },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    {
                                                      kind: 'Field',
                                                      name: {
                                                        kind: 'Name',
                                                        value: 'animated',
                                                      },
                                                    },
                                                    {
                                                      kind: 'Field',
                                                      name: {
                                                        kind: 'Name',
                                                        value:
                                                          'approvedPersonal',
                                                      },
                                                    },
                                                    {
                                                      kind: 'Field',
                                                      name: {
                                                        kind: 'Name',
                                                        value:
                                                          'defaultZeroWidth',
                                                      },
                                                    },
                                                  ],
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'images',
                                                },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    {
                                                      kind: 'FragmentSpread',
                                                      name: {
                                                        kind: 'Name',
                                                        value: 'ImageFragment',
                                                      },
                                                    },
                                                  ],
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'owner',
                                                },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    {
                                                      kind: 'Field',
                                                      name: {
                                                        kind: 'Name',
                                                        value: 'id',
                                                      },
                                                    },
                                                    {
                                                      kind: 'Field',
                                                      name: {
                                                        kind: 'Name',
                                                        value: 'mainConnection',
                                                      },
                                                      selectionSet: {
                                                        kind: 'SelectionSet',
                                                        selections: [
                                                          {
                                                            kind: 'Field',
                                                            name: {
                                                              kind: 'Name',
                                                              value:
                                                                'platformDisplayName',
                                                            },
                                                          },
                                                        ],
                                                      },
                                                    },
                                                  ],
                                                },
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ImageFragment' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'Image' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'url' } },
          { kind: 'Field', name: { kind: 'Name', value: 'mime' } },
          { kind: 'Field', name: { kind: 'Name', value: 'size' } },
          { kind: 'Field', name: { kind: 'Name', value: 'scale' } },
          { kind: 'Field', name: { kind: 'Name', value: 'width' } },
          { kind: 'Field', name: { kind: 'Name', value: 'height' } },
          { kind: 'Field', name: { kind: 'Name', value: 'frameCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type UserPersonalEmotesQueryQueryResult = Apollo.QueryResult<
  UserPersonalEmotesQueryQuery,
  UserPersonalEmotesQueryQueryVariables
>;
