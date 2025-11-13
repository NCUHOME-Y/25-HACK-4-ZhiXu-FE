import { api } from './apiClient';

// 聊天消息接口
export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
  // 聊天室消息特有字段
  room_id?: string;
  // 私聊消息特有字段
  sender_id?: string;
  receiver_id?: string;
}

// 私聊会话接口
export interface Conversation {
  id: string;
  target_user_id: string;
  target_username: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

// 聊天室接口
export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  created_at: string;
  member_count: number;
}

/**
 * 私聊服务
 * 支持私聊的WebSocket连接、消息发送、历史记录获取等功能
 */
class PrivateChatService {
  private ws: WebSocket | null = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private currentTargetUserId: string | null = null;

  /**
   * 连接到私聊
   */
  connect(targetUserId: string, token: string): void {
    // 断开现有连接
    this.disconnect();

    this.currentTargetUserId = targetUserId;
    const wsUrl = `ws://localhost:8080/ws/private-chat?target_user_id=${targetUserId}&token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Connected to private chat with user:', targetUserId);
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'private_message') {
        this.messageCallbacks.forEach(callback => callback(data.message));
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected from private chat');
      this.currentTargetUserId = null;
    };

    this.ws.onerror = (error) => {
      console.error('Private chat WebSocket error:', error);
    };
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageCallbacks = [];
    this.currentTargetUserId = null;
  }

  /**
   * 发送消息
   */
  sendMessage(content: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'private_message',
      content: content
    }));
  }

  /**
   * 获取私聊会话列表
   */
  getConversations = (page: number = 1, limit: number = 20) =>
    api.get<Conversation[]>('/api/private-chat/conversations', {
      params: { page, limit }
    });

  /**
   * 获取私聊历史消息
   */
  getHistory = (targetUserId: string, page: number = 1, limit: number = 50) =>
    api.get<ChatMessage[]>('/api/private-chat/history', {
      params: { target_user_id: targetUserId, page, limit }
    });

  /**
   * 删除消息
   */
  deleteMessage = (messageId: string) =>
    api.delete<void>(`/api/private-chat/messages/${messageId}`);

  /**
   * 监听新消息
   */
  onMessage(callback: (message: ChatMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): { isConnected: boolean; targetUserId: string | null } {
    return {
      isConnected: this.ws?.readyState === WebSocket.OPEN,
      targetUserId: this.currentTargetUserId
    };
  }
}

/**
 * 公共聊天室服务
 * 支持公共聊天室的WebSocket连接、消息发送、历史记录获取等功能
 */
class PublicChatService {
  private readonly PUBLIC_ROOM_ID = 'public-room-1'; // 公共聊天室ID
  private ws: WebSocket | null = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];

  /**
   * 连接到公共聊天室
   */
  connect(token: string): void {
    // 断开现有连接
    this.disconnect();

    const wsUrl = `ws://localhost:8080/ws/chat/${this.PUBLIC_ROOM_ID}?token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Connected to public chat room');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        this.messageCallbacks.forEach(callback => callback(data.message));
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected from public chat room');
    };

    this.ws.onerror = (error) => {
      console.error('Public chat WebSocket error:', error);
    };
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageCallbacks = [];
  }

  /**
   * 发送消息
   */
  sendMessage(content: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'message',
      content: content
    }));
  }

  /**
   * 获取聊天室列表
   */
  getChatRooms = () =>
    api.get<ChatRoom[]>('/api/chat/rooms');

  /**
   * 获取公共聊天室历史消息
   */
  getHistory = (page: number = 1, limit: number = 50) =>
    api.get<ChatMessage[]>(`/api/chat/history/${this.PUBLIC_ROOM_ID}`, {
      params: { page, limit }
    });

  /**
   * 删除消息
   */
  deleteMessage = (messageId: string) =>
    api.delete<void>(`/api/chat/messages/${messageId}`);

  /**
   * 监听新消息
   */
  onMessage(callback: (message: ChatMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): { isConnected: boolean; roomId: string } {
    return {
      isConnected: this.ws?.readyState === WebSocket.OPEN,
      roomId: this.PUBLIC_ROOM_ID
    };
  }
}

// 导出服务实例
export const privateChatService = new PrivateChatService();
export const publicChatService = new PublicChatService();

// 默认导出
export default {
  private: privateChatService,
  public: publicChatService
};
