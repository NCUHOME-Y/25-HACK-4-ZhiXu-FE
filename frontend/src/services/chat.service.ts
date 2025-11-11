import apiClient from './apiClient';

// 统一的聊天消息接口
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

// 聊天室接口
export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  created_at: string;
  member_count: number;
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

// 聊天类型常量
export const ChatType = {
  ROOM: 'room',
  PRIVATE: 'private'
} as const;

export type ChatType = typeof ChatType[keyof typeof ChatType];

// 统一的聊天服务
class UnifiedChatService {
  private ws: WebSocket | null = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private currentChatType: ChatType | null = null;
  private currentTargetId: string | null = null;

  // ========== 聊天室相关方法 ==========

  // 获取聊天室列表
  async getChatRooms(): Promise<ChatRoom[]> {
    const response = await apiClient.get('/api/chat/rooms');
    return response.data;
  }

  // 获取聊天室历史消息
  async getRoomChatHistory(roomId: string, page: number = 1, limit: number = 50): Promise<ChatMessage[]> {
    const response = await apiClient.get(`/api/chat/history/${roomId}`, {
      params: { page, limit }
    });
    return response.data;
  }

  // ========== 私聊相关方法 ==========

  // 获取私聊会话列表
  async getConversations(page: number = 1, limit: number = 20): Promise<Conversation[]> {
    const response = await apiClient.get('/api/private-chat/conversations', {
      params: { page, limit }
    });
    return response.data;
  }

  // 获取私聊历史消息
  async getPrivateChatHistory(targetUserId: string, page: number = 1, limit: number = 50): Promise<ChatMessage[]> {
    const response = await apiClient.get('/api/private-chat/history', {
      params: { target_user_id: targetUserId, page, limit }
    });
    return response.data;
  }

  // ========== 统一的WebSocket方法 ==========

  // 连接聊天室
  connectToRoom(roomId: string, token: string): void {
    this.connect(ChatType.ROOM, roomId, token);
  }

  // 连接私聊
  connectToPrivateChat(targetUserId: string, token: string): void {
    this.connect(ChatType.PRIVATE, targetUserId, token);
  }

  // 统一的连接方法
  private connect(chatType: ChatType, targetId: string, token: string): void {
    // 断开现有连接
    this.disconnect();

    this.currentChatType = chatType;
    this.currentTargetId = targetId;

    // 根据聊天类型构建不同的WebSocket URL
    let wsUrl: string;
    if (chatType === ChatType.ROOM) {
      wsUrl = `ws://localhost:8080/ws/chat/${targetId}?token=${token}`;
    } else {
      wsUrl = `ws://localhost:8080/ws/private-chat?target_user_id=${targetId}&token=${token}`;
    }

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log(`Connected to ${chatType}:`, targetId);
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // 统一消息处理
      let messageType: string;
      if (chatType === ChatType.ROOM) {
        messageType = 'message';
      } else {
        messageType = 'private_message';
      }

      if (data.type === messageType) {
        this.messageCallbacks.forEach(callback => callback(data.message));
      }
    };

    this.ws.onclose = () => {
      console.log(`Disconnected from ${chatType}`);
      this.reset();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  // 发送消息
  sendMessage(content: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.currentChatType) {
      return;
    }

    let messageType: string;
    if (this.currentChatType === ChatType.ROOM) {
      messageType = 'message';
    } else {
      messageType = 'private_message';
    }

    this.ws.send(JSON.stringify({
      type: messageType,
      content: content
    }));
  }

  // 删除消息 (HTTP API)
  async deleteMessage(messageId: string): Promise<void> {
    let endpoint: string;
    if (this.currentChatType === ChatType.ROOM) {
      endpoint = `/api/chat/messages/${messageId}`;
    } else {
      endpoint = `/api/private-chat/messages/${messageId}`;
    }

    await apiClient.delete(endpoint);
  }

  // 监听新消息
  onMessage(callback: (message: ChatMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  // 断开连接
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageCallbacks = [];
    this.reset();
  }

  // 重置状态
  private reset(): void {
    this.currentChatType = null;
    this.currentTargetId = null;
  }

  // 获取当前连接状态
  getConnectionStatus(): { isConnected: boolean; chatType: ChatType | null; targetId: string | null } {
    return {
      isConnected: this.ws?.readyState === WebSocket.OPEN,
      chatType: this.currentChatType,
      targetId: this.currentTargetId
    };
  }
}

// 导出统一的服务实例
export const chatService = new UnifiedChatService();
