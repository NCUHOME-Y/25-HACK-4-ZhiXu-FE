import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, MessageCircle, Heart, MessageSquare, Send } from 'lucide-react';
import { BottomNav, Search, Card, Avatar, AvatarImage, AvatarFallback, Popover, PopoverTrigger, PopoverContent, Button, ToggleGroup, ToggleGroupItem, Input } from "../components";

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

// 模拟用户数据
interface User {
  id: string;
  name: string;
  avatar: string; // 预设头像之一
  message: string;
  likes: number;
  comments: Comment[];
  totalDays?: number; // 打卡总天数
  completedFlags?: number; // 完成flag总数
  totalPoints?: number; // 总积分
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  time: string; // 评论发表时间
}

const mockUsers: User[] = [
  {
    id: '1',
    name: '学霸小王',
    avatar: PRESET_AVATARS[0],
    message: '今天完成了数学作业的第三章，感觉越来越顺手了！坚持就是胜利 💪',
    likes: 12,
    comments: [
      { id: 'c1', userId: '2', userName: '英语达人', content: '加油！', time: '2小时前' },
      { id: 'c2', userId: '3', userName: '健身达人', content: '坚持就是胜利', time: '1小时前' },
    ],
    totalDays: 156,
    completedFlags: 45,
    totalPoints: 2340,
  },
  {
    id: '2',
    name: '英语达人',
    avatar: PRESET_AVATARS[1],
    message: '分享一份英语四级核心词汇表，整理了常考的2000个单词，希望对大家有帮助！',
    likes: 25,
    comments: [
      { id: 'c3', userId: '1', userName: '学霸小王', content: '太有用了，谢谢分享！', time: '3小时前' },
    ],
    totalDays: 142,
    completedFlags: 38,
    totalPoints: 2130,
  },
  {
    id: '3',
    name: '健身达人',
    avatar: PRESET_AVATARS[2],
    message: '发起一个30天健身挑战！每天运动30分钟，有一起的小伙伴吗？',
    likes: 18,
    comments: [],
    totalDays: 138,
    completedFlags: 32,
    totalPoints: 1890,
  },
];

// 联系我们页面
export default function ContactPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<User[]>(mockUsers);
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // 点赞处理
  const handleLike = (postId: string, liked: string[]) => {
    const isLiked = liked.includes('liked');
    
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: isLiked ? post.likes + 1 : post.likes - 1 }
        : post
    ));
    
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.add(postId);
      } else {
        newSet.delete(postId);
      }
      return newSet;
    });
    
    // TODO: 调用后端接口更新点赞状态
  };

  // 评论处理
  const handleAddComment = (postId: string) => {
    const comment = newComment[postId]?.trim();
    if (!comment) return;

    const newCommentObj: Comment = {
      id: `c${Date.now()}`,
      userId: 'me',
      userName: '我',
      content: comment,
      time: '刚刚',
    };

    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, comments: [...post.comments, newCommentObj] }
        : post
    ));

    setNewComment({ ...newComment, [postId]: '' });
    // TODO: 调用后端接口添加评论
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Search />
      <div className="flex-1 pb-20 pt-16 px-4">
        {/* 顶部导航模块 */}
        <section className="grid grid-cols-2 gap-3 mb-4 -mx-4 px-4">
          <Card 
            className="p-3 flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors border-transparent"
            onClick={() => navigate('/rank')}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold">排行榜</div>
              <div className="text-[10px] text-muted-foreground truncate">查看大家的进度</div>
            </div>
          </Card>
          
          <Card 
            className="p-3 flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors border-transparent"
            onClick={() => navigate('/public')}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold">聊天室</div>
              <div className="text-[10px] text-muted-foreground truncate">和大家一起交流</div>
            </div>
          </Card>
        </section>

        {/* 动态列表标题 */}
        <div className="mb-3">
          <h2 className="text-base font-semibold">翰林院论</h2>
        </div>

        {/* 用户动态列表 */}
        <section className="space-y-3 -mx-4">
          {posts.map((user) => (
            <Card key={user.id} className="p-3 rounded-xl border-x-0">
              {/* 第一行：头像、昵称、发表时间 */}
              <div className="flex items-center gap-2 mb-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="cursor-pointer flex-shrink-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{user.name}</h4>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-semibold text-base">{user.totalDays}</div>
                          <div className="text-muted-foreground text-[10px]">打卡天数</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-base">{user.completedFlags}</div>
                          <div className="text-muted-foreground text-[10px]">完成flag</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-base">{user.totalPoints}</div>
                          <div className="text-muted-foreground text-[10px]">总积分</div>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm"
                        className="w-full rounded-full h-8"
                        onClick={() => navigate('/private', { state: { user } })}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        发消息
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{user.name}</span>
                </div>
                
                {user.comments.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {user.comments[user.comments.length - 1].time}
                  </span>
                )}
              </div>

              {/* 第二行：帖子内容 */}
              <p className="text-sm mb-2 break-words px-1">{user.message}</p>
              
              {/* 第三行：点赞和评论按钮 */}
              <div className="flex items-center gap-3 mb-2 px-1">
                <ToggleGroup 
                  type="multiple" 
                  size="sm"
                  onValueChange={(value) => handleLike(user.id, value)}
                >
                  <ToggleGroupItem 
                    value="liked" 
                    aria-label="点赞" 
                    className={`h-7 px-2 gap-1 ${likedPosts.has(user.id) ? 'text-red-500 data-[state=on]:text-red-500' : ''}`}
                  >
                    <Heart className={`h-3 w-3 ${likedPosts.has(user.id) ? 'fill-red-500' : ''}`} />
                    <span className="text-xs">{user.likes}</span>
                  </ToggleGroupItem>
                </ToggleGroup>
                
                <button 
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-500 transition-colors h-7 px-2"
                  onClick={() => setShowComments({ ...showComments, [user.id]: !showComments[user.id] })}
                >
                  <MessageSquare className="h-3 w-3" />
                  <span>{user.comments.length}</span>
                </button>
              </div>

              {/* 第四行：评论列表 */}
              {showComments[user.id] && user.comments.length > 0 && (
                <div className="space-y-2 mb-2 pl-3 border-l-2 border-slate-100">
                  {user.comments.map((comment) => (
                    <div key={comment.id} className="text-xs">
                      <span className="font-medium">{comment.userName}</span>
                      <span className="text-muted-foreground">: {comment.content}</span>
                      <div className="text-[10px] text-muted-foreground">{comment.time}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* 评论输入框 */}
              {showComments[user.id] && (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={newComment[user.id] || ''}
                    onChange={(e) => setNewComment({ ...newComment, [user.id]: e.target.value })}
                    placeholder="写评论..."
                    className="h-7 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddComment(user.id);
                      }
                    }}
                  />
                  <Button 
                    size="sm" 
                    className="h-7 px-3 text-xs"
                    onClick={() => handleAddComment(user.id)}
                  >
                    发送
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
