import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback, Input, Button } from "../components";
import { Separator } from "../components/ui/separator";
import type { ChatMessage } from '../lib/types/types';
import { scrollToBottom, getAvatarUrl } from '../lib/helpers/helpers';
import authService from '../services/auth.service';
import { useUser } from '../lib/stores/stores';
import { api, makeWsUrl } from '../services/apiClient';

/** 格式化聊天消息时间 */
function formatChatTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const timeStr = date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  if (msgDate.getTime() === today.getTime()) {
    // 今天：只显示时间
    return timeStr;
  } else if (msgDate.getTime() === yesterday.getTime()) {
    // 昨天：显示"昨天 + 时间"
    return `昨天 ${timeStr}`;
  } else {
    // 更早：显示月/日 + 时间
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day} ${timeStr}`;
  }
}

/**
 * 群聊室页面
 */
export default function PublicPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user: currentUserCtx } = useUser();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  
  const roomId = searchParams.get('roomId') || 'room-1';
  const roomName = (location.state as { roomName?: string })?.roomName || '学习交流室';

  useEffect(() => {
    if (currentUserCtx?.id) {
      setCurrentUserId(currentUserCtx.id);
    }
  }, [currentUserCtx]);

  // 加载历史消息
  useEffect(() => {
    const loadHistory = async () => {
      if (!roomId || !currentUserCtx?.id) return;
      try {
        interface HistoryMessage {
          id?: number;
          from: number;
          userName?: string;
          userAvatar?: string;
          content: string;
          createdAt: string;
        }
        const response = await api.get<{ messages: HistoryMessage[] }>(`/api/chat/history/${roomId}?limit=30`);
        
        if (response.messages && response.messages.length > 0) {
          const historyMessages: ChatMessage[] = response.messages.map((msg: HistoryMessage) => ({
            id: `${msg.id || msg.from}-${msg.createdAt}`,
            userId: String(msg.from),
            userName: msg.userName || `用户${msg.from}`,
            avatar: msg.userAvatar || '',
            message: msg.content,
            time: formatChatTime(msg.createdAt),
            isMe: String(msg.from) === currentUserCtx.id,
          }));
          setMessages(historyMessages);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('❌ 加载聊天历史失败:', error);
        setMessages([]);
      }
    };
    loadHistory();
  }, [roomId, currentUserCtx?.id]);

  useEffect(() => {
    scrollToBottom(messagesEndRef);
  }, [messages]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const token = authService.getToken();
    if (!token) {
      navigate('/auth');
      return;
    }

    let ws: WebSocket | null = null;
    let isIntentionallyClosed = false;

    const connect = () => {
      if (isIntentionallyClosed) return;
      
      const wsUrl = makeWsUrl(`/ws/chat?roomId=${roomId}&token=${token}`);
      
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (String(data.from) === currentUserId) {
              return;
            }
            
            const newMessage: ChatMessage = {
              id: `${data.from}-${Date.now()}`,
              userId: String(data.from),
              userName: data.userName || `用户${data.from}`,
              avatar: data.userAvatar || '',
              message: data.content,
              time: formatChatTime(data.createdAt || new Date()),
              isMe: false,
            };
            setMessages((prev) => [...prev, newMessage]);
          } catch (err) {
            console.error('消息解析失败:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('群聊WebSocket错误:', error);
        };

        ws.onclose = () => {
          wsRef.current = null;
          
          if (!isIntentionallyClosed && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttemptsRef.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 10000);
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          }
        };
      } catch (error) {
        console.error('创建WebSocket失败:', error);
        if (reconnectAttemptsRef.current === 0) {
          alert('无法建立聊天连接，请检查网络设置');
        }
      }
    };

    connect();

    return () => {
      isIntentionallyClosed = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close(1000, '页面离开');
      }
    };
  }, [roomId, currentUserId, navigate]);

  const handleSendMessage = () => {
    if (!message.trim()) {
      return;
    }
    
    if (!wsRef.current) {
      alert('聊天连接未建立，请稍候重试');
      return;
    }
    
    if (wsRef.current.readyState !== WebSocket.OPEN) {
      alert('聊天连接已断开，正在重新连接...');
      return;
    }
    
    const messageData = {
      content: message.trim(),
      to: 0,
    };
    
    try {
      wsRef.current.send(JSON.stringify(messageData));
      
      const newMessage: ChatMessage = {
        id: `local-${Date.now()}`,
        userId: currentUserId,
        userName: currentUserCtx?.name || '我',
        avatar: currentUserCtx?.avatar || '',
        message: message.trim(),
        time: formatChatTime(new Date()),
        isMe: true,
      };
      setMessages((prev) => [...prev, newMessage]);
      
      setMessage('');
    } catch (error) {
      console.error('发送消息失败:', error);
      alert('发送失败，请重试');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto w-full flex flex-col min-h-screen">
      <nav className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200/50 shadow-sm">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/chat-rooms')} className="hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">{roomName}</h1>
            <p className="text-xs text-gray-500">房间ID: {roomId}</p>
          </div>
        </div>
      </nav>

      <div className="flex-1 pb-24 overflow-y-auto px-4 pt-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <Send className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <p className="text-gray-600 font-medium text-lg">开始聊天吧</p>
                <p className="text-sm text-gray-500 mt-1">发送第一条消息</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-white shadow-sm">
                    <AvatarImage src={getAvatarUrl(msg.avatar)} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs">
                      {msg.userName.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-[10px] text-gray-500 text-center max-w-[60px] truncate">
                    {msg.userName}
                  </div>
                </div>
                
                <div className={`flex flex-col gap-1 max-w-[70%] ${msg.isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                      msg.isMe
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-sm'
                        : 'bg-white text-gray-900 rounded-tl-sm border border-gray-100'
                    } transition-all duration-200 hover:shadow-md`}
                  >
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                  </div>
                  <div className="text-xs text-gray-500 px-2">{msg.time}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent px-4 py-4">
        <div className="flex items-center w-full max-w-md mx-auto h-12 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-full shadow-lg overflow-hidden">
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
          <Separator orientation="vertical" className="h-8" />
          <Button
            type="submit"
            variant="default"
            size="sm"
            onClick={handleSendMessage}
            className="h-full px-6 rounded-none bg-blue-600 hover:bg-blue-700 transition-all duration-200"
            style={{ borderRadius: 0 }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
