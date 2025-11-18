import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback, Input, Button } from "../components";
import { Separator } from "../components/ui/separator";
import type { ChatMessage } from '../lib/types/types';
import { scrollToBottom, getAvatarUrl } from '../lib/helpers/helpers';
import authService from '../services/auth.service';
import { useUser } from '../lib/stores/userContext';
import { api, makeWsUrl } from '../services/apiClient';

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
  
  const roomId = searchParams.get('room_id') || 'room-1';
  const roomName = (location.state as { roomName?: string })?.roomName || '学习交流室';

  useEffect(() => {
    if (currentUserCtx?.id) {
      setCurrentUserId(currentUserCtx.id);
    }
  }, [currentUserCtx]);

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

    const wsUrl = makeWsUrl(`/ws/chat?room_id=${roomId}&token=${token}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket连接已建立', { roomId, roomName });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 收到消息:', data);
        
        // 跳过自己发送的消息（因为已经在本地显示了）
        if (String(data.from) === currentUserId) {
          console.log('⏭️ 跳过自己的消息');
          return;
        }
        
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
          isMe: false,
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
      // React上下文中的当前用户头像
      const currentUserAvatar = currentUserCtx?.avatar || '';
      
      // 立即在本地显示自己的消息
      const newMessage: ChatMessage = {
        id: `local-${Date.now()}`,
        userId: currentUserId,
        userName: currentUserCtx?.name || '我',
        avatar: currentUserAvatar,
        message: message.trim(),
        time: new Date().toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isMe: true,
      };
      setMessages((prev) => [...prev, newMessage]);
      
      // 发送到服务器
      wsRef.current.send(JSON.stringify(messageData));
      console.log('✅ 消息已发送并显示');
      setMessage('');
    } else {
      console.error('WebSocket未连接，状态:', wsRef.current.readyState);
      alert('连接已断开，请刷新页面重试');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
  );
}
