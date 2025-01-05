import gql from 'graphql-tag';
import * as Urql from 'urql';

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
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  ActiveEmoteFlagModel: { input: any; output: any };
  ArbitraryMap: { input: any; output: any };
  AuditLogChangeFormat: { input: any; output: any };
  AuditLogKind: { input: any; output: any };
  BanEffect: { input: any; output: any };
  ConnectionPlatform: { input: any; output: any };
  CosmeticKind: { input: any; output: any };
  CosmeticPaintCanvasRepeat: { input: any; output: any };
  CosmeticPaintFunction: { input: any; output: any };
  CosmeticPaintShape: { input: any; output: any };
  CosmeticPaintTextTransform: { input: any; output: any };
  DateTime: { input: any; output: any };
  EmoteFlagsModel: { input: any; output: any };
  EmoteLifecycleModel: { input: any; output: any };
  EmoteSetFlagModel: { input: any; output: any };
  EmoteVersionState: { input: any; output: any };
  Id: { input: any; output: any };
  ImageFormat: { input: any; output: any };
  ObjectID: { input: any; output: any };
  StringMap: { input: any; output: any };
  UserEditorModelPermission: { input: any; output: any };
  UserTypeModel: { input: any; output: any };
};

export type ActiveEmote = {
  __typename?: 'ActiveEmote';
  actor?: Maybe<UserPartial>;
  data: EmotePartial;
  flags: Scalars['ActiveEmoteFlagModel']['output'];
  id: Scalars['ObjectID']['output'];
  name: Scalars['String']['output'];
  origin_id?: Maybe<Scalars['ObjectID']['output']>;
  timestamp: Scalars['DateTime']['output'];
};

export type AuditLog = {
  __typename?: 'AuditLog';
  actor: UserPartial;
  actor_id: Scalars['ObjectID']['output'];
  changes: Array<AuditLogChange>;
  created_at: Scalars['DateTime']['output'];
  id: Scalars['ObjectID']['output'];
  kind: Scalars['AuditLogKind']['output'];
  reason: Scalars['String']['output'];
  target_id: Scalars['ObjectID']['output'];
  target_kind: Scalars['Int']['output'];
};

export type AuditLogChange = {
  __typename?: 'AuditLogChange';
  array_value?: Maybe<AuditLogChangeArray>;
  format: Scalars['AuditLogChangeFormat']['output'];
  key: Scalars['String']['output'];
  value?: Maybe<Scalars['ArbitraryMap']['output']>;
};

export type AuditLogChangeArray = {
  __typename?: 'AuditLogChangeArray';
  added: Array<Scalars['ArbitraryMap']['output']>;
  removed: Array<Scalars['ArbitraryMap']['output']>;
  updated: Array<Scalars['ArbitraryMap']['output']>;
};

export type Ban = {
  __typename?: 'Ban';
  actor: User;
  actor_id: Scalars['ObjectID']['output'];
  created_at: Scalars['DateTime']['output'];
  effects: Scalars['BanEffect']['output'];
  expire_at: Scalars['DateTime']['output'];
  id: Scalars['ObjectID']['output'];
  reason: Scalars['String']['output'];
  victim: User;
  victim_id: Scalars['ObjectID']['output'];
};

export type CosmeticBadge = {
  __typename?: 'CosmeticBadge';
  host: ImageHost;
  id: Scalars['Id']['output'];
  kind: Scalars['CosmeticKind']['output'];
  name: Scalars['String']['output'];
  tag: Scalars['String']['output'];
  tooltip: Scalars['String']['output'];
};

export type CosmeticOps = {
  __typename?: 'CosmeticOps';
  id: Scalars['ObjectID']['output'];
  updatePaint: CosmeticPaint;
};

export type CosmeticOpsUpdatePaintArgs = {
  definition: CosmeticPaintInput;
};

export type CosmeticPaint = {
  __typename?: 'CosmeticPaint';
  angle: Scalars['Int']['output'];
  color?: Maybe<Scalars['Int']['output']>;
  function: Scalars['CosmeticPaintFunction']['output'];
  gradients: Array<CosmeticPaintGradient>;
  id: Scalars['Id']['output'];
  image_url: Scalars['String']['output'];
  kind: Scalars['CosmeticKind']['output'];
  name: Scalars['String']['output'];
  repeat: Scalars['Boolean']['output'];
  shadows: Array<CosmeticPaintShadow>;
  shape: Scalars['CosmeticPaintShape']['output'];
  stops: Array<CosmeticPaintStop>;
  text?: Maybe<CosmeticPaintText>;
};

export type CosmeticPaintGradient = {
  __typename?: 'CosmeticPaintGradient';
  angle: Scalars['Int']['output'];
  at: Array<Scalars['Float']['output']>;
  canvas_repeat: Scalars['CosmeticPaintCanvasRepeat']['output'];
  canvas_size: Array<Scalars['Float']['output']>;
  function: Scalars['CosmeticPaintFunction']['output'];
  image_url: Scalars['String']['output'];
  repeat: Scalars['Boolean']['output'];
  shape?: Maybe<Scalars['CosmeticPaintShape']['output']>;
  stops: Array<CosmeticPaintStop>;
};

export type CosmeticPaintInput = {
  angle?: InputMaybe<Scalars['Int']['input']>;
  color?: InputMaybe<Scalars['Int']['input']>;
  function: Scalars['CosmeticPaintFunction']['input'];
  image_url?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  repeat: Scalars['Boolean']['input'];
  shadows: Array<CosmeticPaintShadowInput>;
  shape?: InputMaybe<Scalars['CosmeticPaintShape']['input']>;
  stops: Array<CosmeticPaintStopInput>;
};

export type CosmeticPaintShadow = {
  __typename?: 'CosmeticPaintShadow';
  color: Scalars['Int']['output'];
  radius: Scalars['Float']['output'];
  x_offset: Scalars['Float']['output'];
  y_offset: Scalars['Float']['output'];
};

export type CosmeticPaintShadowInput = {
  color: Scalars['Int']['input'];
  radius: Scalars['String']['input'];
  x_offset: Scalars['String']['input'];
  y_offset: Scalars['String']['input'];
};

export type CosmeticPaintStop = {
  __typename?: 'CosmeticPaintStop';
  at: Scalars['Float']['output'];
  center_at: Array<Scalars['Float']['output']>;
  color: Scalars['Int']['output'];
};

export type CosmeticPaintStopInput = {
  at: Scalars['Float']['input'];
  color: Scalars['Int']['input'];
};

export type CosmeticPaintStroke = {
  __typename?: 'CosmeticPaintStroke';
  color: Scalars['Int']['output'];
  width: Scalars['Float']['output'];
};

export type CosmeticPaintText = {
  __typename?: 'CosmeticPaintText';
  shadows: Array<CosmeticPaintShadow>;
  stroke?: Maybe<CosmeticPaintStroke>;
  transform?: Maybe<Scalars['CosmeticPaintTextTransform']['output']>;
  variant: Scalars['String']['output'];
  weight: Scalars['Int']['output'];
};

export type CosmeticReprocessResult = {
  __typename?: 'CosmeticReprocessResult';
  error?: Maybe<Scalars['String']['output']>;
  id: Scalars['ObjectID']['output'];
  success: Scalars['Boolean']['output'];
};

export type CosmeticReprocessResults = {
  __typename?: 'CosmeticReprocessResults';
  badges: Array<CosmeticReprocessResult>;
  paints: Array<CosmeticReprocessResult>;
};

export type CosmeticsQuery = {
  __typename?: 'CosmeticsQuery';
  badges: Array<CosmeticBadge>;
  paints: Array<CosmeticPaint>;
};

export type CreateEmoteSetInput = {
  name: Scalars['String']['input'];
  privileged?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CreateReportInput = {
  body: Scalars['String']['input'];
  subject: Scalars['String']['input'];
  target_id: Scalars['ObjectID']['input'];
  target_kind: Scalars['Int']['input'];
};

export type CreateRoleInput = {
  allowed: Scalars['String']['input'];
  color: Scalars['Int']['input'];
  denied: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type CreateSubscriptionPeriodResponse = {
  __typename?: 'CreateSubscriptionPeriodResponse';
  invoiceId?: Maybe<Scalars['String']['output']>;
  paymentDeclined: Scalars['Boolean']['output'];
  success: Scalars['Boolean']['output'];
};

export type EditReportInput = {
  assignee?: InputMaybe<Scalars['String']['input']>;
  note?: InputMaybe<EditReportNoteInput>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<ReportStatus>;
};

export type EditReportNoteInput = {
  content?: InputMaybe<Scalars['String']['input']>;
  internal?: InputMaybe<Scalars['Boolean']['input']>;
  /** unused */
  reply?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['String']['input']>;
};

export type EditRoleInput = {
  allowed?: InputMaybe<Scalars['String']['input']>;
  color?: InputMaybe<Scalars['Int']['input']>;
  denied?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['Int']['input']>;
};

export type Emote = {
  __typename?: 'Emote';
  activity: Array<AuditLog>;
  animated: Scalars['Boolean']['output'];
  channels: UserSearchResult;
  common_names: Array<EmoteCommonName>;
  created_at: Scalars['DateTime']['output'];
  flags: Scalars['EmoteFlagsModel']['output'];
  host: ImageHost;
  id: Scalars['ObjectID']['output'];
  lifecycle: Scalars['EmoteLifecycleModel']['output'];
  listed: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  owner: UserPartial;
  owner_id: Scalars['ObjectID']['output'];
  personal_use: Scalars['Boolean']['output'];
  reports: Array<Report>;
  state: Array<Scalars['EmoteVersionState']['output']>;
  tags: Array<Scalars['String']['output']>;
  trending?: Maybe<Scalars['Int']['output']>;
  versions: Array<EmoteVersion>;
};

export type EmoteActivityArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type EmoteChannelsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};

export type EmoteCommonName = {
  __typename?: 'EmoteCommonName';
  count: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type EmoteOps = {
  __typename?: 'EmoteOps';
  id: Scalars['ObjectID']['output'];
  merge: Emote;
  rerun?: Maybe<Emote>;
  update: Emote;
};

export type EmoteOpsMergeArgs = {
  reason?: InputMaybe<Scalars['String']['input']>;
  target_id: Scalars['ObjectID']['input'];
};

export type EmoteOpsUpdateArgs = {
  params: EmoteUpdate;
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type EmotePartial = {
  __typename?: 'EmotePartial';
  animated: Scalars['Boolean']['output'];
  created_at: Scalars['DateTime']['output'];
  flags: Scalars['EmoteFlagsModel']['output'];
  host: ImageHost;
  id: Scalars['ObjectID']['output'];
  lifecycle: Scalars['EmoteLifecycleModel']['output'];
  listed: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  owner: UserPartial;
  owner_id: Scalars['ObjectID']['output'];
  state: Array<Scalars['EmoteVersionState']['output']>;
  tags: Array<Scalars['String']['output']>;
};

export enum EmoteSearchCategory {
  Featured = 'FEATURED',
  Global = 'GLOBAL',
  New = 'NEW',
  Top = 'TOP',
  TrendingDay = 'TRENDING_DAY',
  TrendingMonth = 'TRENDING_MONTH',
  TrendingWeek = 'TRENDING_WEEK',
}

export type EmoteSearchFilter = {
  animated?: InputMaybe<Scalars['Boolean']['input']>;
  aspect_ratio?: InputMaybe<Scalars['String']['input']>;
  authentic?: InputMaybe<Scalars['Boolean']['input']>;
  case_sensitive?: InputMaybe<Scalars['Boolean']['input']>;
  category?: InputMaybe<EmoteSearchCategory>;
  exact_match?: InputMaybe<Scalars['Boolean']['input']>;
  ignore_tags?: InputMaybe<Scalars['Boolean']['input']>;
  personal_use?: InputMaybe<Scalars['Boolean']['input']>;
  zero_width?: InputMaybe<Scalars['Boolean']['input']>;
};

export type EmoteSearchResult = {
  __typename?: 'EmoteSearchResult';
  count: Scalars['Int']['output'];
  items: Array<Emote>;
  max_page: Scalars['Int']['output'];
};

export type EmoteSet = {
  __typename?: 'EmoteSet';
  capacity: Scalars['Int']['output'];
  emote_count: Scalars['Int']['output'];
  emotes: Array<ActiveEmote>;
  flags: Scalars['EmoteSetFlagModel']['output'];
  id: Scalars['ObjectID']['output'];
  name: Scalars['String']['output'];
  origins: Array<EmoteSetOrigin>;
  owner?: Maybe<UserPartial>;
  owner_id?: Maybe<Scalars['ObjectID']['output']>;
  tags: Array<Scalars['String']['output']>;
};

export type EmoteSetEmotesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  origins?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum EmoteSetName {
  Global = 'GLOBAL',
}

export type EmoteSetOps = {
  __typename?: 'EmoteSetOps';
  delete: Scalars['Boolean']['output'];
  emotes: Array<ActiveEmote>;
  id: Scalars['ObjectID']['output'];
  update: EmoteSet;
};

export type EmoteSetOpsEmotesArgs = {
  action: ListItemAction;
  id: Scalars['ObjectID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

export type EmoteSetOpsUpdateArgs = {
  data: UpdateEmoteSetInput;
};

export type EmoteSetOrigin = {
  __typename?: 'EmoteSetOrigin';
  id: Scalars['ObjectID']['output'];
  slices: Array<Scalars['Int']['output']>;
  weight: Scalars['Int']['output'];
};

export type EmoteSetOriginInput = {
  id: Scalars['ObjectID']['input'];
  slices?: InputMaybe<Array<Scalars['Int']['input']>>;
  weight?: InputMaybe<Scalars['Int']['input']>;
};

export type EmoteUpdate = {
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  flags?: InputMaybe<Scalars['EmoteFlagsModel']['input']>;
  listed?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  owner_id?: InputMaybe<Scalars['ObjectID']['input']>;
  personal_use?: InputMaybe<Scalars['Boolean']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  version_description?: InputMaybe<Scalars['String']['input']>;
  version_name?: InputMaybe<Scalars['String']['input']>;
};

export type EmoteVersion = {
  __typename?: 'EmoteVersion';
  created_at: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  error?: Maybe<Scalars['String']['output']>;
  host: ImageHost;
  id: Scalars['ObjectID']['output'];
  lifecycle: Scalars['EmoteLifecycleModel']['output'];
  listed: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  state: Array<Scalars['EmoteVersionState']['output']>;
};

export type Image = {
  __typename?: 'Image';
  format: Scalars['ImageFormat']['output'];
  frame_count: Scalars['Int']['output'];
  height: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  static_name: Scalars['String']['output'];
  width: Scalars['Int']['output'];
};

export type ImageHost = {
  __typename?: 'ImageHost';
  files: Array<Image>;
  url: Scalars['String']['output'];
};

export type ImageHostFilesArgs = {
  formats?: InputMaybe<Array<Scalars['ImageFormat']['input']>>;
};

export type InboxMessage = {
  __typename?: 'InboxMessage';
  author_id?: Maybe<Scalars['ObjectID']['output']>;
  content: Scalars['String']['output'];
  created_at: Scalars['DateTime']['output'];
  id: Scalars['ObjectID']['output'];
  important: Scalars['Boolean']['output'];
  kind: MessageKind;
  pinned: Scalars['Boolean']['output'];
  placeholders: Scalars['StringMap']['output'];
  read: Scalars['Boolean']['output'];
  read_at?: Maybe<Scalars['DateTime']['output']>;
  starred: Scalars['Boolean']['output'];
  subject: Scalars['String']['output'];
};

export enum ListItemAction {
  Add = 'ADD',
  Remove = 'REMOVE',
  Update = 'UPDATE',
}

export enum MessageKind {
  EmoteComment = 'EMOTE_COMMENT',
  Inbox = 'INBOX',
  ModRequest = 'MOD_REQUEST',
  News = 'NEWS',
}

export type ModRequestMessage = {
  __typename?: 'ModRequestMessage';
  actor_country_code: Scalars['String']['output'];
  actor_country_name: Scalars['String']['output'];
  author_id?: Maybe<Scalars['ObjectID']['output']>;
  created_at: Scalars['DateTime']['output'];
  id: Scalars['ObjectID']['output'];
  kind: MessageKind;
  read: Scalars['Boolean']['output'];
  read_at?: Maybe<Scalars['DateTime']['output']>;
  target_id: Scalars['ObjectID']['output'];
  target_kind: Scalars['Int']['output'];
  wish: Scalars['String']['output'];
};

export type ModRequestMessageList = {
  __typename?: 'ModRequestMessageList';
  messages: Array<ModRequestMessage>;
  total: Scalars['Int']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  cosmetics: CosmeticOps;
  createBan?: Maybe<Ban>;
  createCosmeticPaint: Scalars['ObjectID']['output'];
  createEmoteSet: EmoteSet;
  createReport: Report;
  createRole: Role;
  deleteRole: Scalars['String']['output'];
  dismissVoidTargetModRequests: Scalars['Int']['output'];
  editBan?: Maybe<Ban>;
  editReport: Report;
  editRole: Role;
  emote: EmoteOps;
  emoteSet?: Maybe<EmoteSetOps>;
  readMessages: Scalars['Int']['output'];
  reprocessCosmeticImage: CosmeticReprocessResults;
  sendInboxMessage?: Maybe<InboxMessage>;
  user: UserOps;
};

export type MutationCosmeticsArgs = {
  id: Scalars['ObjectID']['input'];
};

export type MutationCreateBanArgs = {
  anonymous?: InputMaybe<Scalars['Boolean']['input']>;
  effects: Scalars['BanEffect']['input'];
  expire_at?: InputMaybe<Scalars['DateTime']['input']>;
  reason: Scalars['String']['input'];
  victim_id: Scalars['ObjectID']['input'];
};

export type MutationCreateCosmeticPaintArgs = {
  definition: CosmeticPaintInput;
};

export type MutationCreateEmoteSetArgs = {
  data: CreateEmoteSetInput;
  user_id: Scalars['ObjectID']['input'];
};

export type MutationCreateReportArgs = {
  data: CreateReportInput;
};

export type MutationCreateRoleArgs = {
  data: CreateRoleInput;
};

export type MutationDeleteRoleArgs = {
  role_id: Scalars['ObjectID']['input'];
};

export type MutationDismissVoidTargetModRequestsArgs = {
  object: Scalars['Int']['input'];
};

export type MutationEditBanArgs = {
  ban_id: Scalars['ObjectID']['input'];
  effects?: InputMaybe<Scalars['BanEffect']['input']>;
  expire_at?: InputMaybe<Scalars['DateTime']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type MutationEditReportArgs = {
  data: EditReportInput;
  report_id: Scalars['ObjectID']['input'];
};

export type MutationEditRoleArgs = {
  data: EditRoleInput;
  role_id: Scalars['ObjectID']['input'];
};

export type MutationEmoteArgs = {
  id: Scalars['ObjectID']['input'];
};

export type MutationEmoteSetArgs = {
  id: Scalars['ObjectID']['input'];
};

export type MutationReadMessagesArgs = {
  approved: Scalars['Boolean']['input'];
  message_ids: Array<Scalars['ObjectID']['input']>;
  read: Scalars['Boolean']['input'];
};

export type MutationReprocessCosmeticImageArgs = {
  badge_ids?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
  paint_ids?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
};

export type MutationSendInboxMessageArgs = {
  anonymous?: InputMaybe<Scalars['Boolean']['input']>;
  content: Scalars['String']['input'];
  important?: InputMaybe<Scalars['Boolean']['input']>;
  recipients: Array<Scalars['ObjectID']['input']>;
  subject: Scalars['String']['input'];
};

export type MutationUserArgs = {
  id: Scalars['ObjectID']['input'];
};

export type Query = {
  __typename?: 'Query';
  _service: _Service;
  actor?: Maybe<User>;
  announcement: Scalars['String']['output'];
  cosmetics: CosmeticsQuery;
  emote?: Maybe<Emote>;
  emoteSet: EmoteSet;
  emoteSetsByID: Array<EmoteSet>;
  emotes: EmoteSearchResult;
  emotesByID: Array<EmotePartial>;
  inbox: Array<InboxMessage>;
  modRequests: ModRequestMessageList;
  namedEmoteSet: EmoteSet;
  report?: Maybe<Report>;
  reports: Array<Report>;
  role?: Maybe<Role>;
  roles: Array<Role>;
  user: User;
  userByConnection: User;
  users: Array<UserPartial>;
  usersByID: Array<UserPartial>;
};

export type QueryCosmeticsArgs = {
  list?: InputMaybe<Array<Scalars['ObjectID']['input']>>;
};

export type QueryEmoteArgs = {
  id: Scalars['ObjectID']['input'];
};

export type QueryEmoteSetArgs = {
  id: Scalars['ObjectID']['input'];
};

export type QueryEmoteSetsByIdArgs = {
  list: Array<Scalars['ObjectID']['input']>;
};

export type QueryEmotesArgs = {
  filter?: InputMaybe<EmoteSearchFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
  sort?: InputMaybe<Sort>;
};

export type QueryEmotesByIdArgs = {
  list: Array<Scalars['ObjectID']['input']>;
};

export type QueryModRequestsArgs = {
  country?: InputMaybe<Array<Scalars['String']['input']>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  wish?: InputMaybe<Scalars['String']['input']>;
};

export type QueryNamedEmoteSetArgs = {
  name: EmoteSetName;
};

export type QueryReportArgs = {
  id: Scalars['ObjectID']['input'];
};

export type QueryReportsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<ReportStatus>;
};

export type QueryRoleArgs = {
  id: Scalars['ObjectID']['input'];
};

export type QueryUserArgs = {
  id: Scalars['ObjectID']['input'];
};

export type QueryUserByConnectionArgs = {
  id: Scalars['String']['input'];
  platform: Scalars['ConnectionPlatform']['input'];
};

export type QueryUsersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};

export type QueryUsersByIdArgs = {
  list: Array<Scalars['ObjectID']['input']>;
};

export type Report = {
  __typename?: 'Report';
  actor: User;
  actor_id: Scalars['ObjectID']['output'];
  assignees: Array<User>;
  body: Scalars['String']['output'];
  created_at: Scalars['DateTime']['output'];
  id: Scalars['ObjectID']['output'];
  notes: Array<Scalars['String']['output']>;
  priority: Scalars['Int']['output'];
  status: ReportStatus;
  subject: Scalars['String']['output'];
  target_id: Scalars['ObjectID']['output'];
  target_kind: Scalars['Int']['output'];
};

export enum ReportStatus {
  Assigned = 'ASSIGNED',
  Closed = 'CLOSED',
  Open = 'OPEN',
}

export type Role = {
  __typename?: 'Role';
  allowed: Scalars['String']['output'];
  color: Scalars['Int']['output'];
  created_at: Scalars['DateTime']['output'];
  denied: Scalars['String']['output'];
  id: Scalars['ObjectID']['output'];
  invisible: Scalars['Boolean']['output'];
  members: Array<User>;
  name: Scalars['String']['output'];
  position: Scalars['Int']['output'];
};

export type RoleMembersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};

export type Sort = {
  order: SortOrder;
  value: Scalars['String']['input'];
};

export enum SortOrder {
  Ascending = 'ASCENDING',
  Descending = 'DESCENDING',
}

export type SubscriptionPeriodCreate = {
  end: Scalars['DateTime']['input'];
  invoice?: InputMaybe<SubscriptionPeriodCreateInvoiceData>;
  kind: SubscriptionPeriodKind;
  product_id: Scalars['ObjectID']['input'];
  reason: Scalars['String']['input'];
  start: Scalars['DateTime']['input'];
};

export type SubscriptionPeriodCreateInvoiceData = {
  currency?: InputMaybe<Scalars['String']['input']>;
  price: Scalars['Float']['input'];
};

export enum SubscriptionPeriodKind {
  Monthly = 'monthly',
  Yearly = 'yearly',
}

export type UpdateEmoteSetInput = {
  capacity?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  origins?: InputMaybe<Array<EmoteSetOriginInput>>;
};

export type User = {
  __typename?: 'User';
  activity: Array<AuditLog>;
  avatar_url: Scalars['String']['output'];
  biography: Scalars['String']['output'];
  connections: Array<UserConnection>;
  cosmetics: Array<UserCosmetic>;
  created_at: Scalars['DateTime']['output'];
  display_name: Scalars['String']['output'];
  editor_of: Array<UserEditor>;
  editors: Array<UserEditor>;
  emote_sets: Array<EmoteSet>;
  id: Scalars['ObjectID']['output'];
  inbox_unread_count: Scalars['Int']['output'];
  owned_emotes: Array<Emote>;
  reports: Array<Report>;
  roles: Array<Scalars['ObjectID']['output']>;
  style: UserStyle;
  type: Scalars['UserTypeModel']['output'];
  username: Scalars['String']['output'];
};

export type UserActivityArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type UserEmote_SetsArgs = {
  entitled?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UserConnection = {
  __typename?: 'UserConnection';
  display_name: Scalars['String']['output'];
  emote_capacity: Scalars['Int']['output'];
  emote_set_id?: Maybe<Scalars['ObjectID']['output']>;
  id: Scalars['String']['output'];
  linked_at: Scalars['DateTime']['output'];
  platform: Scalars['ConnectionPlatform']['output'];
  username: Scalars['String']['output'];
};

export type UserConnectionUpdate = {
  emote_set_id?: InputMaybe<Scalars['ObjectID']['input']>;
  unlink?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UserCosmetic = {
  __typename?: 'UserCosmetic';
  id: Scalars['ObjectID']['output'];
  kind: Scalars['CosmeticKind']['output'];
  selected: Scalars['Boolean']['output'];
};

export type UserCosmeticUpdate = {
  id: Scalars['ObjectID']['input'];
  kind: Scalars['CosmeticKind']['input'];
  selected: Scalars['Boolean']['input'];
};

export type UserEditor = {
  __typename?: 'UserEditor';
  added_at: Scalars['DateTime']['output'];
  id: Scalars['ObjectID']['output'];
  permissions: Scalars['UserEditorModelPermission']['output'];
  user: UserPartial;
  visible: Scalars['Boolean']['output'];
};

export type UserEditorUpdate = {
  permissions?: InputMaybe<Scalars['UserEditorModelPermission']['input']>;
  visible?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UserOps = {
  __typename?: 'UserOps';
  connections?: Maybe<Array<Maybe<UserConnection>>>;
  cosmetics: Scalars['Boolean']['output'];
  createSubscriptionPeriod: CreateSubscriptionPeriodResponse;
  delete: Scalars['Boolean']['output'];
  editors?: Maybe<Array<Maybe<UserEditor>>>;
  id: Scalars['ObjectID']['output'];
  merge: Scalars['Boolean']['output'];
  refreshSubscriptions: Scalars['Boolean']['output'];
  roles: Array<Scalars['ObjectID']['output']>;
};

export type UserOpsConnectionsArgs = {
  data: UserConnectionUpdate;
  id: Scalars['String']['input'];
};

export type UserOpsCosmeticsArgs = {
  update: UserCosmeticUpdate;
};

export type UserOpsCreateSubscriptionPeriodArgs = {
  create: SubscriptionPeriodCreate;
};

export type UserOpsEditorsArgs = {
  data: UserEditorUpdate;
  editor_id: Scalars['ObjectID']['input'];
};

export type UserOpsMergeArgs = {
  id: Scalars['ObjectID']['input'];
};

export type UserOpsRolesArgs = {
  action: ListItemAction;
  role_id: Scalars['ObjectID']['input'];
};

export type UserPartial = {
  __typename?: 'UserPartial';
  avatar_url: Scalars['String']['output'];
  biography: Scalars['String']['output'];
  connections: Array<UserConnection>;
  created_at: Scalars['DateTime']['output'];
  display_name: Scalars['String']['output'];
  emote_sets: Array<EmoteSet>;
  id: Scalars['ObjectID']['output'];
  roles: Array<Scalars['ObjectID']['output']>;
  style: UserStyle;
  type: Scalars['UserTypeModel']['output'];
  username: Scalars['String']['output'];
};

export type UserPartialEmote_SetsArgs = {
  entitled?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UserSearchResult = {
  __typename?: 'UserSearchResult';
  items: Array<UserPartial>;
  total: Scalars['Int']['output'];
};

export type UserStyle = {
  __typename?: 'UserStyle';
  badge?: Maybe<CosmeticBadge>;
  badge_id?: Maybe<Scalars['ObjectID']['output']>;
  color: Scalars['Int']['output'];
  paint?: Maybe<CosmeticPaint>;
  paint_id?: Maybe<Scalars['ObjectID']['output']>;
};

export type _Service = {
  __typename?: '_Service';
  sdl?: Maybe<Scalars['String']['output']>;
};

export type CosmeticsQueryVariables = Exact<{ [key: string]: never }>;

export type CosmeticsQuery = {
  __typename?: 'Query';
  cosmetics: {
    __typename?: 'CosmeticsQuery';
    paints: Array<{ __typename?: 'CosmeticPaint'; id: any }>;
  };
};

export const CosmeticsDocument = gql`
  query Cosmetics {
    cosmetics {
      paints {
        id
      }
    }
  }
`;

export function useCosmeticsQuery(
  options?: Omit<Urql.UseQueryArgs<CosmeticsQueryVariables>, 'query'>,
) {
  return Urql.useQuery<CosmeticsQuery, CosmeticsQueryVariables>({
    query: CosmeticsDocument,
    ...options,
  });
}
