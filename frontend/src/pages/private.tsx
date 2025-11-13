import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback, Input, Button } from "../components";
import { Separator } from "../components/ui/separator";

// 私聊消息数据
interface PrivateMessage {
  id: string;
  message: string;
  time: string;
  isMe: boolean;
  avatar?: string;
  userName?: string;
}

export default function PrivatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user || { name: '用户', avatar: '' };
  
  const [message, setMessage] = useState('');
  const [messages, _setMessages] = useState<PrivateMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket连接
  useEffect(() => {
    // TODO: 替换为实际的WebSocket URL
    // const ws = new WebSocket(`ws://your-backend-url/private-chat/${user.id}`);

    // ws.onopen = () => {
    //   console.log('WebSocket连接已建立');
    // };

    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   const newMessage: PrivateMessage = {
    //     id: data.id,
    //     message: data.message,
    //     time: data.time,
    //     isMe: data.userId === 'currentUserId',
    //     avatar: data.isMe ? undefined : user.avatar,
    //     userName: data.isMe ? '我' : user.name,
    //   };
    //   _setMessages((prev) => [...prev, newMessage]);
    // };

    // ws.onerror = (error) => {
    //   console.error('WebSocket错误:', error);
    // };

    // ws.onclose = () => {
    //   console.log('WebSocket连接已关闭');
    // };

    // return () => {
    //   if (ws.readyState === WebSocket.OPEN) {
    //     ws.close();
    //   }
    // };
  }, [user.id, user.avatar, user.name]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // TODO: 通过WebSocket发送消息
    // const messageData = {
    //   message: message.trim(),
    //   time: new Date().toISOString(),
    //   recipientId: user.id,
    // };
    
    // if (ws && ws.readyState === WebSocket.OPEN) {
    //   ws.send(JSON.stringify(messageData));
    // }

    setMessage('');
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 顶部导航 */}
      <nav className="bg-white sticky top-0 z-10">
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

      {/* 聊天消息列表 */}
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

      {/* 底部输入框 */}
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
