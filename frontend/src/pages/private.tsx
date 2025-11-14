import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback, Input, Button } from "../components";
import { Separator } from "../components/ui/separator";
import type { PrivateMessage } from '../lib/types/types';
import { scrollToBottom } from '../lib/helpers/helpers';
import authService from '../services/auth.service';

/**
 * 私聊页面
 */
export default function PrivatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user || { id: '', name: '用户', avatar: '' };
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setCurrentUserId(currentUser.id);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    scrollToBottom(messagesEndRef);
  }, [messages]);

  useEffect(() => {
    if (!currentUserId || !user.id) return;

    const token = authService.getToken();
    if (!token) {
      navigate('/auth');
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:8080/ws/chat?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('私聊WebSocket连接已建立', { targetUserId: user.id });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (String(data.from) === user.id || String(data.from) === currentUserId) {
          const newMessage: PrivateMessage = {
            id: `${data.from}-${Date.now()}`,
            message: data.content,
            time: new Date(data.created_at).toLocaleTimeString('zh-CN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isMe: String(data.from) === currentUserId,
            avatar: String(data.from) === currentUserId ? undefined : user.avatar,
            userName: String(data.from) === currentUserId ? '我' : user.name,
          };
          setMessages((prev) => [...prev, newMessage]);
        }
      } catch (error) {
        console.error('解析私聊消息失败:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('私聊WebSocket错误:', error);
    };

    ws.onclose = () => {
      console.log('私聊WebSocket连接已关闭');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [currentUserId, user.id, user.avatar, user.name, navigate]);

  const handleSendMessage = () => {
    if (!message.trim() || !wsRef.current || !user.id) {
      console.log('无法发送：', { message: message.trim(), ws: !!wsRef.current, userId: user.id });
      return;
    }
    
    const messageData = {
      content: message.trim(),
      to: parseInt(user.id),
    };
    
    console.log('私聊WebSocket状态:', wsRef.current.readyState, '准备发送消息:', messageData);
    
    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(messageData));
      console.log('私聊消息已发送');
      
      const newMessage: PrivateMessage = {
        id: `${currentUserId}-${Date.now()}`,
        message: message.trim(),
        time: new Date().toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isMe: true,
        userName: '我',
      };
      setMessages((prev) => [...prev, newMessage]);
      setMessage('');
    } else {
      console.error('私聊WebSocket未连接，状态:', wsRef.current.readyState);
      alert('连接已断开，请刷新页面重试');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <nav className="bg-white sticky top-0 z-10 border-b">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <h1 className="text-lg font-semibold">{user.name}</h1>
        </div>
      </nav>

      <div className="flex-1 pb-24 overflow-y-auto px-4 pt-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className="flex flex-col items-center gap-1">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={msg.avatar || user.avatar} />
                  <AvatarFallback>{(msg.userName || user.name).slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="text-[10px] text-muted-foreground text-center max-w-[60px] truncate">
                  {msg.userName || (msg.isMe ? '我' : user.name)}
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
