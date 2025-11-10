import apiClient from './apiClient';

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  created_at: string;
  member_count: number;
}

class ChatService {
  private ws: WebSocket | null = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];

  // 获取聊天室列表
  async getChatRooms(): Promise<ChatRoom[]> {
    const response = await apiClient.get('/api/chat/rooms');
    return response.data;
  }

  // 获取聊天室历史消息
  async getChatHistory(roomId: string, page: number = 1, limit: number = 50): Promise<ChatMessage[]> {
    const response = await apiClient.get(`/api/chat/history/${roomId}`, {
      params: { page, limit }
    });
    return response.data;
  }

  // 连接聊天室WebSocket
  connectChatRoom(roomId: string, token: string): void {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(`ws://localhost:8080/ws/chat/${roomId}?token=${token}`);

    this.ws.onopen = () => {
      console.log('Connected to chat room:', roomId);
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'message') {
        this.messageCallbacks.forEach(callback => callback(data.message));
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected from chat room');
      this.ws = null;
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  // 发送消息
  sendMessage(content: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message',
        content: content
      }));
    }
  }

  // 删除消息 (HTTP API)
  async deleteMessageHttp(messageId: string): Promise<void> {
    await apiClient.delete(`/api/chat/messages/${messageId}`);
  }

  // 监听新消息
  onMessage(callback: (message: ChatMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  // 断开连接
  disconnectChatRoom(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageCallbacks = [];
  }
}

export const chatService = new ChatService();