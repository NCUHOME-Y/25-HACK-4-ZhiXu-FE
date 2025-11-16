import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback, Input, Button } from "../components";
import { Separator } from "../components/ui/separator";
import type { PrivateMessage } from '../lib/types/types';
import { scrollToBottom } from '../lib/helpers/helpers';
import authService from '../services/auth.service';
import { API_BASE, makeWsUrl } from '../services/apiClient';

/**
 * 私聊发送页面
 */
// API返回的私聊消息类型
interface PrivateMessageApi {
  id?: string | number;
  ID?: string | number;
  content: string;
  created_at: string;
  from_user_id: string | number;
}

export default function SendPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useMemo(() => location.state?.user || { id: '', name: '用户', avatar: '' }, [location.state]);
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 验证是否有用户信息
  useEffect(() => {
    if (!user.id) {
      console.error('❌ 没有用户信息,返回上一页');
      alert('未选择聊天对象,请从消息列表选择用户');
      navigate('/receive');
    } else {
      console.log('✅ 用户信息正常:', user);
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setCurrentUserId(currentUser.id);
      }
    };
    loadUser();
  }, []);

  // 加载历史消息
  useEffect(() => {
    const loadHistoryMessages = async () => {
      if (!currentUserId || !user.id) {
        console.log('⏭️ 跳过加载历史消息，缺少用户信息:', { currentUserId, targetUserId: user.id });
        return;
      }
      
      try {
        const token = authService.getToken();
        if (!token) {
          console.error('❌ 没有token，无法加载历史消息');
          return;
        }
        
        console.log('📡 开始加载历史消息...', { currentUserId, targetUserId: user.id });
        const response = await fetch(
          `${API_BASE}/api/private-chat/history?target_user_id=${user.id}&limit=50`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('📦 API返回数据:', data);
          
          if (data.messages && Array.isArray(data.messages)) {
              const historyMessages: PrivateMessage[] = data.messages.map((msg: PrivateMessageApi) => ({
              id: String(msg.id || msg.ID),
              message: msg.content,
              time: new Date(msg.created_at).toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              isMe: String(msg.from_user_id) === currentUserId,
              avatar: String(msg.from_user_id) === currentUserId ? undefined : user.avatar,
              userName: String(msg.from_user_id) === currentUserId ? '我' : user.name,
            }));
            
            setMessages(historyMessages);
            console.log('✅ 历史消息加载成功，共', historyMessages.length, '条');
          } else {
            console.log('ℹ️ 没有历史消息');
          }
        } else {
          const errorText = await response.text();
          console.error('❌ 加载历史消息失败:', response.status, errorText);
        }
      } catch (error) {
        console.error('❌ 加载历史消息异常:', error);
      }
    };
    
    loadHistoryMessages();
  }, [currentUserId, user.id, user.avatar, user.name]);

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

    // 使用统一的 API_BASE / makeWsUrl 来生成 WS 地址
    const wsUrl = makeWsUrl(`/ws/chat?token=${token}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ 私聊WebSocket连接已建立', { targetUserId: user.id });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 收到私聊消息:', data);
        
        // 只接收来自目标用户的消息（自己的消息已经在发送时显示）
        if (String(data.from) === user.id && String(data.to) === currentUserId) {
          const newMessage: PrivateMessage = {
            id: `${data.from}-${Date.now()}`,
            message: data.content,
            time: new Date(data.created_at).toLocaleTimeString('zh-CN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isMe: false,
            avatar: user.avatar,
            userName: user.name,
          };
          setMessages((prev) => [...prev, newMessage]);
        } else if (String(data.from) === currentUserId) {
          console.log('⏭️ 跳过自己的私聊消息');
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
      // 立即在本地显示
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
      
      // 发送到服务器
      wsRef.current.send(JSON.stringify(messageData));
      console.log('✅ 私聊消息已发送并显示:', messageData);
      setMessage('');
    } else {
      console.error('私聊WebSocket未连接，状态:', wsRef.current.readyState);
      alert('连接已断开，请刷新页面重试');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <nav className="sticky top-0 z-10 bg-transparent">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <h1 className="text-lg font-semibold bg-transparent shadow-none border-none m-0 p-0">{user.name}</h1>
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
