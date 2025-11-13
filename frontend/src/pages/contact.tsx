import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, MessageCircle, Heart, MessageSquare, Send, Search as SearchIcon } from 'lucide-react';
import { BottomNav, Card, Avatar, AvatarImage, AvatarFallback, Popover, PopoverTrigger, PopoverContent, Button, ToggleGroup, ToggleGroupItem, Input, Skeleton } from "../components";
// import contactService from '../services/contact.service'; // TODO: 启用后端API时取消注释

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
  userAvatar?: string; // 评论用户头像
  content: string;
  time: string; // 评论发表时间
}

// 生成更多模拟数据
const generateMockUsers = (): User[] => {
  const baseUsers = [
    { name: '学霸小王', avatar: PRESET_AVATARS[0], message: '今天完成了数学作业的第三章，感觉越来越顺手了！坚持就是胜利 💪' },
    { name: '英语达人', avatar: PRESET_AVATARS[1], message: '分享一份英语四级核心词汇表，整理了常考的2000个单词，希望对大家有帮助！' },
    { name: '健身达人', avatar: PRESET_AVATARS[2], message: '发起一个30天健身挑战！每天运动30分钟，有一起的小伙伴吗？' },
    { name: '代码侠客', avatar: PRESET_AVATARS[3], message: '刚刚解决了一个困扰我一周的Bug，成就感满满！💻' },
    { name: '阅读爱好者', avatar: PRESET_AVATARS[4], message: '推荐《人类简史》这本书，看完真的能让人思考很多！' },
    { name: '早起鸟', avatar: PRESET_AVATARS[5], message: '坚持早起第100天！早起真的能改变生活！🌅' },
    { name: '美食探索家', avatar: PRESET_AVATARS[6], message: '自己做了一顿健康晚餐，低卡又美味~' },
    { name: '音乐发烧友', avatar: PRESET_AVATARS[7], message: '分享一首最近循环的歌，希望你们也喜欢！🎵' },
  ];

  const messages = [
    '今天的学习状态特别好，效率满分！',
    '终于攻克了这个难题，太开心了！',
    '和大家分享一个学习小技巧...',
    '打卡第N天，继续加油！',
    '今天又学到了新知识，充实的一天！',
    '完成今天的目标，给自己点个赞！',
  ];

  return Array.from({ length: 30 }, (_, i) => {
    const baseUser = baseUsers[i % baseUsers.length];
    return {
      id: String(i + 1),
      name: `${baseUser.name}${i > 7 ? i - 7 : ''}`,
      avatar: baseUser.avatar,
      message: i < 3 ? baseUser.message : messages[i % messages.length],
      likes: Math.floor(Math.random() * 50) + 5,
      comments: i % 3 === 0 ? [
        { 
          id: `c${i}1`, 
          userId: String((i + 1) % 8 + 1), 
          userName: baseUsers[(i + 1) % 8].name,
          userAvatar: PRESET_AVATARS[(i + 1) % 8],
          content: ['加油！', '太棒了！', '继续坚持！'][i % 3], 
          time: `${Math.floor(Math.random() * 5) + 1}小时前` 
        },
      ] : [],
      totalDays: Math.floor(Math.random() * 200) + 50,
      completedFlags: Math.floor(Math.random() * 50) + 10,
      totalPoints: Math.floor(Math.random() * 3000) + 500,
    };
  });
};

const mockUsers: User[] = generateMockUsers();

// 联系我们页面
export default function ContactPage() {
  const navigate = useNavigate();
  const [posts] = useState<User[]>(mockUsers);
  const [displayedPosts, setDisplayedPosts] = useState<User[]>([]);
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  const POSTS_PER_PAGE = 15;

  // 过滤帖子
  const filteredPosts = posts.filter(post => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.name.toLowerCase().includes(query) ||
      post.message.toLowerCase().includes(query) ||
      post.comments.some(comment => 
        comment.userName.toLowerCase().includes(query) ||
        comment.content.toLowerCase().includes(query)
      )
    );
  });

  // 加载更多帖子
  const loadMorePosts = useCallback(() => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    
    // TODO: 启用后端API
    // contactService.getPosts(page, POSTS_PER_PAGE)
    //   .then(response => {
    //     if (response.data.length === 0) {
    //       setHasMore(false);
    //     } else {
    //       setDisplayedPosts(prev => [...prev, ...response.data]);
    //       setPage(prev => prev + 1);
    //       setHasMore(response.hasMore);
    //     }
    //     setLoading(false);
    //   })
    //   .catch(error => {
    //     console.error('加载帖子失败:', error);
    //     setLoading(false);
    //   });
    
    // 模拟网络延迟（临时使用，启用后端后删除）
    setTimeout(() => {
      const startIndex = (page - 1) * POSTS_PER_PAGE;
      const endIndex = startIndex + POSTS_PER_PAGE;
      const newPosts = filteredPosts.slice(startIndex, endIndex);
      
      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setDisplayedPosts(prev => [...prev, ...newPosts]);
        setPage(prev => prev + 1);
      }
      setLoading(false);
    }, 500);
  }, [loading, hasMore, page, filteredPosts]);

  // 初始加载
  useEffect(() => {
    setDisplayedPosts([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    
    // TODO: 启用后端API（搜索功能）
    // if (searchQuery.trim()) {
    //   contactService.searchPosts({ query: searchQuery, page: 1, pageSize: POSTS_PER_PAGE })
    //     .then(response => {
    //       setDisplayedPosts(response.data);
    //       setPage(2);
    //       setHasMore(response.hasMore);
    //       setLoading(false);
    //     })
    //     .catch(error => {
    //       console.error('搜索失败:', error);
    //       setLoading(false);
    //     });
    // } else {
    //   contactService.getPosts(1, POSTS_PER_PAGE)
    //     .then(response => {
    //       setDisplayedPosts(response.data);
    //       setPage(2);
    //       setHasMore(response.hasMore);
    //       setLoading(false);
    //     })
    //     .catch(error => {
    //       console.error('加载帖子失败:', error);
    //       setLoading(false);
    //     });
    // }
    
    // 模拟网络延迟（临时使用，启用后端后删除）
    setTimeout(() => {
      const filtered = posts.filter(post => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          post.name.toLowerCase().includes(query) ||
          post.message.toLowerCase().includes(query) ||
          post.comments.some(comment => 
            comment.userName.toLowerCase().includes(query) ||
            comment.content.toLowerCase().includes(query)
          )
        );
      });
      
      const initialPosts = filtered.slice(0, POSTS_PER_PAGE);
      setDisplayedPosts(initialPosts);
      setPage(2);
      setHasMore(filtered.length > POSTS_PER_PAGE);
      setLoading(false);
    }, 500);
  }, [searchQuery, posts]);

  // 滚动监听
  useEffect(() => {
    const currentObserver = observerRef.current;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (currentObserver) {
      observer.observe(currentObserver);
    }

    return () => {
      if (currentObserver) {
        observer.unobserve(currentObserver);
      }
    };
  }, [hasMore, loading, loadMorePosts]);

  // 点赞处理
  const handleLike = (postId: string, liked: string[]) => {
    const isLiked = liked.includes('liked');
    
    // 先更新UI
    setDisplayedPosts(displayedPosts.map(post => 
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
    // if (isLiked) {
    //   contactService.likePost(postId).catch(error => {
    //     console.error('点赞失败:', error);
    //     // 回滚UI
    //     setDisplayedPosts(displayedPosts.map(post => 
    //       post.id === postId ? { ...post, likes: post.likes - 1 } : post
    //     ));
    //     setLikedPosts(prev => {
    //       const newSet = new Set(prev);
    //       newSet.delete(postId);
    //       return newSet;
    //     });
    //   });
    // } else {
    //   contactService.unlikePost(postId).catch(error => {
    //     console.error('取消点赞失败:', error);
    //     // 回滚UI
    //     setDisplayedPosts(displayedPosts.map(post => 
    //       post.id === postId ? { ...post, likes: post.likes + 1 } : post
    //     ));
    //     setLikedPosts(prev => {
    //       const newSet = new Set(prev);
    //       newSet.add(postId);
    //       return newSet;
    //     });
    //   });
    // }
  };

  // 评论处理
  const handleAddComment = (postId: string) => {
    const comment = newComment[postId]?.trim();
    if (!comment) return;

    const newCommentObj: Comment = {
      id: `c${Date.now()}`,
      userId: 'me',
      userName: '我',
      userAvatar: PRESET_AVATARS[0],
      content: comment,
      time: '刚刚',
    };

    // 先更新UI
    setDisplayedPosts(displayedPosts.map(post => 
      post.id === postId 
        ? { ...post, comments: [...post.comments, newCommentObj] }
        : post
    ));

    setNewComment({ ...newComment, [postId]: '' });
    
    // TODO: 调用后端接口添加评论
    // contactService.addComment({ postId, content: comment })
    //   .then(savedComment => {
    //     // 用后端返回的评论替换临时评论
    //     setDisplayedPosts(displayedPosts.map(post => {
    //       if (post.id === postId) {
    //         const comments = post.comments.filter(c => c.id !== newCommentObj.id);
    //         return { ...post, comments: [...comments, savedComment] };
    //       }
    //       return post;
    //     }));
    //   })
    //   .catch(error => {
    //     console.error('添加评论失败:', error);
    //     // 回滚UI
    //     setDisplayedPosts(displayedPosts.map(post => {
    //       if (post.id === postId) {
    //         return { ...post, comments: post.comments.filter(c => c.id !== newCommentObj.id) };
    //       }
    //       return post;
    //     }));
    //   });
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex-1 pb-20">
        {/* 搜索框 */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center w-full h-12 bg-white border border-border rounded-full shadow-sm overflow-hidden">
            <div className="flex items-center flex-1 pl-4 pr-2 h-full">
              <SearchIcon className="h-5 w-5 text-muted-foreground mr-2" />
              <Input
                type="search"
                placeholder="搜索帖子、用户、评论..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // TODO: 调用后端搜索API
                    console.log('搜索:', searchQuery);
                  }
                }}
                className="border-none shadow-none focus-visible:ring-0 focus-visible:border-none bg-transparent text-base h-8"
              />
            </div>
            <div className="h-full w-px bg-border" />
            <Button
              type="submit"
              variant="default"
              size="sm"
              onClick={() => {
                // TODO: 调用后端搜索API
                console.log('搜索:', searchQuery);
              }}
              className="h-full px-6 rounded-none"
            >
              搜索
            </Button>
          </div>
        </div>

        {/* 顶部导航模块 */}
        <section className="grid grid-cols-2 gap-3 mb-4 px-4">
          <Card 
            className="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors border-transparent"
            onClick={() => navigate('/rank')}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">排行榜</div>
              <div className="text-xs text-muted-foreground truncate">查看大家的进度</div>
            </div>
          </Card>
          
          <Card 
            className="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors border-transparent"
            onClick={() => navigate('/public')}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">聊天室</div>
              <div className="text-xs text-muted-foreground truncate">和大家一起交流</div>
            </div>
          </Card>
        </section>

        {/* 动态列表标题 */}
        <div className="mb-3 px-4">
          <h2 className="text-base font-semibold">翰林院论</h2>
        </div>

        {/* 用户动态列表 */}
        <section className="space-y-3">
          {displayedPosts.length === 0 && !loading ? (
            <Card className="p-8 text-center text-muted-foreground">
              <p>没有找到相关帖子</p>
            </Card>
          ) : (
            displayedPosts.map((user) => (
            <Card key={user.id} className="p-3 rounded-xl border-x-0">
              {/* 第一行：头像、昵称、发表时间 */}
              <div className="flex items-center gap-2 mb-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="cursor-pointer flex-shrink-0">
                      <Avatar className="h-11 w-11">
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
                <div className="space-y-3 mb-2 pl-2 border-l-2 border-slate-100">
                  {user.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage src={comment.userAvatar} />
                        <AvatarFallback>{comment.userName.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-sm">{comment.userName}</span>
                          <span className="text-[10px] text-muted-foreground">{comment.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{comment.content}</p>
                      </div>
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
          ))
          )}

          {/* 加载骨架屏 */}
          {loading && (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={`skeleton-${i}`} className="p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full mb-2" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* 加载更多触发器 */}
          {hasMore && !loading && displayedPosts.length > 0 && (
            <div ref={observerRef} className="h-10 flex items-center justify-center">
              <span className="text-sm text-muted-foreground">加载更多...</span>
            </div>
          )}

          {/* 没有更多内容提示 */}
          {!hasMore && displayedPosts.length > 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              没有更多内容了
            </div>
          )}
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
