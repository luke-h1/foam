export interface EventSubMetadata {
  message_id: string;
  message_type:
    | 'session_welcome'
    | 'session_keepalive'
    | 'notification'
    | 'session_reconnect'
    | 'revocation';
  message_timestamp: string;
  subscription_type?: string;
  subscription_version?: string;
}

export interface EventSubPayload {
  session?: {
    id: string;
    status: string;
    connected_at: string;
    keepalive_timeout_seconds: number;
    reconnect_url?: string;
  };
  subscription?: {
    id: string;
    status: string;
    type: string;
    version: string;
    condition: Record<string, string>;
    transport: {
      method: string;
      session_id: string;
    };
    created_at: string;
  };
}

/**
 * TODO: make more precise with generic and discriminated unions
 */
export interface EventSubMessage {
  metadata: EventSubMetadata;
  payload: EventSubPayload;
  event?: Record<string, unknown>;
}

export type TwitchEventSubCallback = (data: EventSubMessage) => void;
