import { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav, Avatar, AvatarImage, AvatarFallback, Input, Button } from "../components";

// 预设头像列表
const PRESET_AVATARS = [
  '/avatars/avatar-1.png',
  '/avatars/avatar-2.png',
  '/avatars/avatar-3.png',
  '/avatars/avatar-4.png',
  '/avatars/avatar-5.png',
  '/avatars/avatar-6.png',
  '/avatars/avatar-7.png',
  '/avatars/avatar-8.png',
];

// 聊天消息数据
interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  message: string;
  time: string;
  isMe?: boolean;
}

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    userId: '1',
    userName: '学霸小王',
    avatar: PRESET_AVATARS[0],
    message: '大家好！今天完成了数学作业，感觉很有成就感！',
    time: '10:30',
  },
  {
    id: '2',
    userId: '2',
    userName: '英语达人',
    avatar: PRESET_AVATARS[1],
    message: '太棒了！坚持就是胜利 💪',
    time: '10:32',
  },
  {
    id: '3',
    userId: 'me',
    userName: '我',
    avatar: PRESET_AVATARS[4],
    message: '我也刚完成了今天的flag，大家一起加油！',
    time: '10:35',
    isMe: true,
  },
  {
    id: '4',
    userId: '3',
    userName: '健身达人',
    avatar: PRESET_AVATARS[2],
    message: '有没有人想一起做30天健身挑战？',
    time: '10:38',
  },
];

export default function PublicPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage: ChatMessage = {
      id: String(Date.now()),
      userId: 'me',
      userName: '我',
      avatar: PRESET_AVATARS[4],
      message: message.trim(),
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
    // TODO: 调用后端接口发送消息
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 顶部导航 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
        <div className="flex h-14 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">公共聊天室</h1>
        </div>
      </nav>

      {/* 聊天消息列表 */}
      <div className="flex-1 pt-14 pb-24 px-4 overflow-y-auto">
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
        </div>
      </div>

      {/* 底部输入框 */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t px-4 py-3">
        <div className="flex items-center gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="输入消息..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <Button
            size="icon"
            className="rounded-full"
            onClick={handleSendMessage}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
