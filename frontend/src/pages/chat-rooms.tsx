import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Plus, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose, Badge, Skeleton } from "../components";
import { api } from '../services/apiClient';

interface ChatRoom {
  id: string;
  name: string;
  user_count: number;
  max_users: number;
  created_at: string;
  creator_id: number;
}

/**
 * 聊天室列表页面
 */
export default function ChatRoomsPage() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ rooms: ChatRoom[] }>('/api/chat/rooms');
      setRooms(response.rooms || []);
      setError(null);
    } catch (err) {
      console.error('加载聊天室列表失败:', err);
      setError('无法加载聊天室列表');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    const name = newRoomName.trim();
    if (!name) return;

    setIsCreating(true);
    try {
      await api.post('/api/chat/rooms', { name });
      setNewRoomName('');
      setIsDrawerOpen(false);
      await loadRooms();
    } catch (err) {
      console.error('创建聊天室失败:', err);
      alert('创建失败，请重试');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEnterRoom = (room: ChatRoom) => {
    if (room.user_count >= room.max_users) {
      alert('聊天室已满，无法进入');
      return;
    }
    navigate(`/public?room_id=${room.id}`, { state: { roomName: room.name } });
  };

  const getRoomStatusColor = (userCount: number, maxUsers: number) => {
    const ratio = userCount / maxUsers;
    if (ratio >= 0.9) return 'bg-red-100 text-red-700 border-red-200';
    if (ratio >= 0.6) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <nav className="bg-white sticky top-0 z-10 border-b">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/contact')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">聊天室列表</h1>
            <p className="text-xs text-muted-foreground">选择一个聊天室开始交流</p>
          </div>
          <Button size="sm" onClick={() => setIsDrawerOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" />
            创建
          </Button>
        </div>
      </nav>

      <div className="flex-1 pb-6 px-4 pt-4">
        {error && (
          <Card className="p-6 mb-4 bg-red-50 border-red-200">
            <div className="text-center space-y-3">
              <p className="text-red-600 font-medium">⚠️ {error}</p>
              <Button size="sm" onClick={loadRooms} className="bg-red-600 hover:bg-red-700">
                重试
              </Button>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>暂无聊天室</p>
            <p className="text-sm mt-1">点击右上角创建一个新聊天室</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => {
              const isDefault = ['room-1', 'room-2', 'room-3'].includes(room.id);
              const isFull = room.user_count >= room.max_users;
              
              return (
                <Card
                  key={room.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    isFull ? 'opacity-60' : ''
                  }`}
                  onClick={() => handleEnterRoom(room)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-full ${
                      isDefault 
                        ? 'bg-gradient-to-br from-blue-400 to-purple-500' 
                        : 'bg-gradient-to-br from-green-400 to-teal-500'
                    } flex items-center justify-center flex-shrink-0`}>
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{room.name}</h3>
                        {isDefault && (
                          <Badge variant="outline" className="text-xs">默认</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{room.user_count}/{room.max_users}</span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getRoomStatusColor(room.user_count, room.max_users)}`}
                        >
                          {isFull ? '已满' : room.user_count === 0 ? '空闲' : '在线中'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && rooms.length > 0 && (
          <div className="mt-6 text-center text-xs text-muted-foreground space-y-1">
            <p>💡 每个聊天室最多支持50人在线</p>
            <p>🗑️ 空闲超过10小时的聊天室将自动删除</p>
          </div>
        )}
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>创建新聊天室</DrawerTitle>
            <DrawerDescription>
              给你的聊天室起个名字，邀请朋友一起交流
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 py-4">
            <Input
              placeholder="输入聊天室名称..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              maxLength={20}
              disabled={isCreating}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateRoom();
                }
              }}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {newRoomName.length}/20 字符
            </p>
          </div>

          <DrawerFooter>
            <Button
              onClick={handleCreateRoom}
              disabled={!newRoomName.trim() || isCreating}
              className="w-full"
            >
              {isCreating ? '创建中...' : '创建聊天室'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full" disabled={isCreating}>
                取消
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
