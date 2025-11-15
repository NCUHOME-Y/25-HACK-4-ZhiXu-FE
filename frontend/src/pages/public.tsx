import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback, Input, Button } from "../components";
import { Separator } from "../components/ui/separator";
import type { ChatMessage } from '../lib/types/types';
import { scrollToBottom } from '../lib/helpers/helpers';
import authService from '../services/auth.service';
import { api } from '../services/apiClient';

/**
 * 群聊室页面
 */
export default function PublicPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const roomId = searchParams.get('room_id') || 'room-1';
  const roomName = (location.state as { roomName?: string })?.roomName || '学习交流室';

  useEffect(() => {
    const loadUser = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    loadUser();
  }, []);

  // 加载历史消息
  useEffect(() => {
    const loadHistory = async () => {
      if (!roomId) return;
      try {
        interface HistoryMessage {
          id?: number;
          from: number;
          user_name?: string;
          user_avatar?: string;
          content: string;
          created_at: string;
        }
        const response = await api.get<{ messages: HistoryMessage[] }>(`/api/chat/history/${roomId}?limit=30`);
        if (response.messages && response.messages.length > 0) {
          const historyMessages: ChatMessage[] = response.messages.map((msg: HistoryMessage) => ({
            id: `${msg.id || msg.from}-${msg.created_at}`,
            userId: String(msg.from),
            userName: msg.user_name || `用户${msg.from}`,
            avatar: msg.user_avatar || '',
            message: msg.content,
            time: new Date(msg.created_at).toLocaleTimeString('zh-CN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isMe: String(msg.from) === currentUserId,
          }));
          setMessages(historyMessages);
        }
      } catch (error) {
        console.log('加载历史消息失败:', error);
      }
    };
    if (currentUserId) {
      loadHistory();
    }
  }, [roomId, currentUserId]);

  useEffect(() => {
    scrollToBottom(messagesEndRef);
  }, [messages]);

  useEffect(() => {
    if (!currentUserId) return;

    const token = authService.getToken();
    if (!token) {
      navigate('/auth');
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:8080/ws/chat?room_id=${roomId}&token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket连接已建立', { roomId, roomName });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newMessage: ChatMessage = {
          id: `${data.from}-${Date.now()}`,
          userId: String(data.from),
          userName: data.user_name || `用户${data.from}`,
          avatar: data.user_avatar || '',
          message: data.content,
          time: new Date(data.created_at).toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isMe: String(data.from) === currentUserId,
        };
        setMessages((prev) => [...prev, newMessage]);
      } catch (error) {
        console.error('解析消息失败:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket连接已关闭');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomId, currentUserId, navigate, roomName]);

  const handleSendMessage = () => {
    if (!message.trim() || !wsRef.current) {
      console.log('无法发送：消息为空或WebSocket未连接');
      return;
    }
    
    const messageData = {
      content: message.trim(),
      to: 0,
    };
    
    console.log('WebSocket状态:', wsRef.current.readyState, '准备发送消息:', messageData);
    
    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(messageData));
      console.log('消息已发送');
      setMessage('');
    } else {
      console.error('WebSocket未连接，状态:', wsRef.current.readyState);
      alert('连接已断开，请刷新页面重试');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <nav className="bg-white sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/chat-rooms')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{roomName}</h1>
            <p className="text-xs text-muted-foreground">房间ID: {roomId}</p>
          </div>
        </div>
      </nav>

      <div className="flex-1 pb-24 overflow-y-auto px-4 pt-4">
        {messages.length === 0 ? (
          <div className="h-full" />
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={msg.avatar} />
                    <AvatarFallback>{msg.userName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="text-[10px] text-muted-foreground text-center max-w-[60px] truncate">
                    {msg.userName}
                  </div>
                </div>
                
                <div className={`flex flex-col gap-1 max-w-[65%] ${msg.isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      msg.isMe
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-slate-100 text-slate-900 rounded-tl-sm'
                    }`}
                  >
                    {msg.message}
                  </div>
                  <div className="text-xs text-muted-foreground px-2">{msg.time}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-transparent px-4 py-3">
        <div className="flex items-center w-full max-w-md mx-auto h-12 bg-white border border-border rounded-full shadow-sm overflow-hidden">
          <div className="flex items-center flex-1 pl-4 pr-2 h-full">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="输入消息..."
              className="border-none shadow-none focus-visible:ring-0 focus-visible:border-none bg-transparent text-base h-8"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
          </div>
          <Separator orientation="vertical" className="h-full" />
          <Button
            type="submit"
            variant="default"
            size="sm"
            onClick={handleSendMessage}
            className="h-full px-6 rounded-none"
            style={{ borderRadius: 0 }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
