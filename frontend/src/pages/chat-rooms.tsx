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
      // 对聊天室进行排序：默认聊天室优先，然后按创建时间倒序
      const sortedRooms = (response.rooms || []).sort((a, b) => {
        const isDefaultA = ['room-1', 'room-2', 'room-3'].includes(a.id);
        const isDefaultB = ['room-1', 'room-2', 'room-3'].includes(b.id);
        
        // 默认聊天室排在前面
        if (isDefaultA && !isDefaultB) return -1;
        if (!isDefaultA && isDefaultB) return 1;
        
        // 同为默认或非默认聊天室，按创建时间倒序（最新的在前）
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setRooms(sortedRooms);
      setError(null);
    } catch {
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
    } catch {
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
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto w-full">
      <nav className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200/50 shadow-sm">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/contact')} className="hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">聊天室列表</h1>
            <p className="text-xs text-gray-500">选择一个聊天室开始交流</p>
          </div>
          <Button size="sm" onClick={() => setIsDrawerOpen(true)} className="gap-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-full px-4">
            <Plus className="h-4 w-4" />
            创建
          </Button>
        </div>
      </nav>

      <div className="flex-1 pb-6 px-4 pt-6">
        {error && (
          <Card className="p-6 mb-6 bg-gradient-to-r from-red-50 to-pink-50 border-red-200 shadow-sm">
            <div className="text-center space-y-3">
              <div className="text-2xl">⚠️</div>
              <p className="text-red-700 font-medium">{error}</p>
              <Button size="sm" onClick={loadRooms} className="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-full px-6">
                重试
              </Button>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-4 bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-sm">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32 bg-gray-200" />
                    <Skeleton className="h-4 w-24 bg-gray-200" />
                  </div>
                  <Skeleton className="h-6 w-16 bg-gray-200 rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <Card className="p-8 text-center bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-sm">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <p className="text-gray-600 font-medium text-lg">暂无聊天室</p>
                <p className="text-sm text-gray-500 mt-1">点击右上角创建一个新聊天室</p>
              </div>
              <Button
                onClick={() => setIsDrawerOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-full px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                创建聊天室
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => {
              const isDefault = ['room-1', 'room-2', 'room-3'].includes(room.id);
              const isFull = room.user_count >= room.max_users;
              
              return (
                <Card
                  key={room.id}
                  className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-white/80 backdrop-blur-sm border border-gray-200/50 ${
                    isFull ? 'opacity-60 grayscale' : 'hover:bg-white'
                  }`}
                  onClick={() => handleEnterRoom(room)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-full ${
                      isDefault 
                        ? 'bg-gradient-to-br from-blue-400 to-purple-500 shadow-lg shadow-blue-200' 
                        : 'bg-gradient-to-br from-green-400 to-teal-500 shadow-lg shadow-green-200'
                    } flex items-center justify-center flex-shrink-0 ring-2 ring-white`}>
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">{room.name}</h3>
                        {isDefault && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200 rounded-full px-2 py-0.5">
                            默认
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span className="font-medium">{room.user_count}/{room.max_users}</span>
                        </div>
                      </div>

                      <div>
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium rounded-full px-2 py-0.5 ${getRoomStatusColor(room.user_count, room.max_users)}`}
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
          <div className="mt-8 text-center text-xs text-gray-500 space-y-1 bg-white/40 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50">
            <p className="flex items-center justify-center gap-1">
              <span className="text-blue-500">💡</span>
              每个聊天室最多支持50人在线
            </p>
            <p className="flex items-center justify-center gap-1">
              <span className="text-orange-500">🗑️</span>
              空闲超过10小时的聊天室将自动删除
            </p>
          </div>
        )}
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="bg-white border-t border-gray-200 shadow-2xl">
          <DrawerHeader className="border-b border-gray-100 bg-gray-50/50">
            <DrawerTitle className="text-gray-900 text-xl">创建新聊天室</DrawerTitle>
            <DrawerDescription className="text-gray-600 mt-2">
              给你的聊天室起个名字，邀请朋友一起交流
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 py-8 bg-white">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">聊天室名称</label>
                <Input
                  placeholder="输入聊天室名称..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  maxLength={20}
                  disabled={isCreating}
                  className="w-full h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateRoom();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 text-right">
                  {newRoomName.length}/20 字符
                </p>
              </div>
            </div>
          </div>

          <DrawerFooter className="bg-gray-50/50 border-t border-gray-100 px-6 py-4">
            <Button
              onClick={handleCreateRoom}
              disabled={!newRoomName.trim() || isCreating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-lg py-3 font-medium"
            >
              {isCreating ? '创建中...' : '创建聊天室'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full rounded-lg py-3 border-gray-300 hover:bg-gray-50 font-medium" disabled={isCreating}>
                取消
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      </div>
    </div>
  );
}
