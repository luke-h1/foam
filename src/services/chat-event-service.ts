import { EventEmitter } from 'eventemitter3';

export interface ChatEvents {
  'chat:disconnect': { channelId: string; channelName: string };
  'chat:connect': { channelId: string; channelName: string };
  'screen:exit': { screenName: string; channelId?: string };
  'screen:enter': { screenName: string; channelId?: string };
}

class ChatEventService extends EventEmitter<ChatEvents> {
  private static instance: ChatEventService | null = null;

  public static getInstance(): ChatEventService {
    if (!ChatEventService.instance) {
      ChatEventService.instance = new ChatEventService();
    }
    return ChatEventService.instance;
  }

  public emitChatDisconnect(channelId: string, channelName: string): void {
    console.log('📡 ChatEventService: Emitting chat disconnect', {
      channelId,
      channelName,
    });
    this.emit('chat:disconnect', { channelId, channelName });
  }

  public emitChatConnect(channelId: string, channelName: string): void {
    console.log('📡 ChatEventService: Emitting chat connect', {
      channelId,
      channelName,
    });
    this.emit('chat:connect', { channelId, channelName });
  }

  public emitScreenExit(screenName: string, channelId?: string): void {
    console.log('📡 ChatEventService: Emitting screen exit', {
      screenName,
      channelId,
    });
    this.emit('screen:exit', { screenName, channelId });
  }

  public emitScreenEnter(screenName: string, channelId?: string): void {
    console.log('📡 ChatEventService: Emitting screen enter', {
      screenName,
      channelId,
    });
    this.emit('screen:enter', { screenName, channelId });
  }

  public destroy(): void {
    this.removeAllListeners();
    ChatEventService.instance = null;
  }
}

export default ChatEventService;
