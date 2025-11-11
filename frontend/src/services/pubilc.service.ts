import apiClient from './apiClient';

export interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

export interface Conversation {
  id: string;
  target_user_id: string;
  target_username: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

class PrivateChatService {
  private ws: WebSocket | null = null;
  private messageCallbacks: ((message: PrivateMessage) => void)[] = [];

  // 获取会话列表
  async getConversations(page: number = 1, limit: number = 20): Promise<Conversation[]> {
    const response = await apiClient.get('/api/private-chat/conversations', {
      params: { page, limit }
    });
    return response.data;
  }

  // 获取私聊历史消息
  async getChatHistory(targetUserId: string, page: number = 1, limit: number = 50): Promise<PrivateMessage[]> {
    const response = await apiClient.get('/api/private-chat/history', {
      params: { target_user_id: targetUserId, page, limit }
    });
    return response.data;
  }

  // 连接私聊WebSocket
  connectPrivateChat(targetUserId: string, token: string): void {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(`ws://localhost:8080/ws/private-chat?target_user_id=${targetUserId}&token=${token}`);

    this.ws.onopen = () => {
      console.log('Connected to private chat:', targetUserId);
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'private_message') {
        this.messageCallbacks.forEach(callback => callback(data.message));
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected from private chat');
      this.ws = null;
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  // 发送私聊消息
  sendPrivateMessage(content: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'private_message',
        content: content
      }));
    }
  }

  // 删除私聊消息 (HTTP API)
  async deletePrivateMessageHttp(messageId: string): Promise<void> {
    await apiClient.delete(`/api/private-chat/messages/${messageId}`);
  }

  // 监听新私聊消息
  onPrivateMessage(callback: (message: PrivateMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  // 断开连接
  disconnectPrivateChat(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageCallbacks = [];
  }
}

export const privateChatService = new PrivateChatService();