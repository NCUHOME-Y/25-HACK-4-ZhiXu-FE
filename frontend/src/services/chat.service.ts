import { api, makeWsUrl } from './apiClient';

// 聊天消息接口
export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  // 谈玄斋消息特有字段
  roomId?: string;
  // 私聊消息特有字段
  senderId?: string;
  receiverId?: string;
}

// 私聊会话接口
export interface Conversation {
  id: string;
  targetUserId: string;
  targetUsername: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  lastMessageAt: string; // 补充 lastMessageAt 字段，兼容 contact.tsx 的类型检查
}

// 谈玄斋接口
export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  memberCount: number;
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
    // 修复：后端统一使用 /ws/chat 路由，通过 targetUserId 参数区分私聊
    const wsUrl = makeWsUrl(`/ws/chat?targetUserId=${targetUserId}&token=${token}`);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // 修复：后端返回的消息类型是 'message'，不是 'private_message'
      if (data.type === 'message' || data.type === 'private_message') {
        this.messageCallbacks.forEach(callback => callback(data.message));
      }
    };

    this.ws.onclose = () => {
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

    // 修复：后端期望的消息类型是 'message'
    this.ws.send(JSON.stringify({
      type: 'message',
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
      params: { targetUserId, page, limit }
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
 * 公共谈玄斋服务
 * 支持公共谈玄斋的WebSocket连接、消息发送、历史记录获取等功能
 */
class PublicChatService {
  private readonly PUBLIC_ROOM_ID = 'public-room-1'; // 公共谈玄斋ID
  private ws: WebSocket | null = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];

  /**
   * 连接到公共谈玄斋
   */
  connect(token: string): void {
    // 断开现有连接
    this.disconnect();

    // 修复：后端路由是 /ws/chat
    const wsUrl = makeWsUrl(`/ws/chat?token=${token}`);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        this.messageCallbacks.forEach(callback => callback(data.message));
      }
    };

    this.ws.onclose = () => {
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
   * 获取谈玄斋列表
   */
  getChatRooms = () =>
    api.get<ChatRoom[]>('/api/chat/rooms');

  /**
   * 获取公共谈玄斋历史消息
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
