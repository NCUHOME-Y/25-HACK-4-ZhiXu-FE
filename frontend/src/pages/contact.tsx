import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, SearchIcon, Heart, MessageSquare, Send, Trophy, Inbox, Plus, Trash2 } from 'lucide-react';
import { BottomNav, Card, Avatar, AvatarImage, AvatarFallback, Popover, PopoverTrigger, PopoverContent, Button, ToggleGroup, ToggleGroupItem, Input, Skeleton, Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose, Textarea, Tabs, TabsList, TabsTrigger, TabsContent, Tutorial } from "../components";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import contactService, { type SearchUserResult } from '../services/contact.service';
import { api } from '../services/apiClient';
import type { ContactUser as User, ContactComment as Comment } from '../lib/types/types';
import { adaptPostToUser, formatTimeAgo } from '../lib/helpers/helpers';
import { useUser } from '../lib/stores/userContext';
import { POSTS_PER_PAGE } from '../lib/constants/constants';
import { getAvatarUrl } from '../lib/helpers/asset-helpers';
import { BirdMascot } from '../components/feature';

/**
 * 用户统计数据组件：显示打卡天数、完成flag、总积分
 */
const UserStatsBlock: React.FC<{ userId: string }> = ({ userId }) => {
  const [stats, setStats] = useState<{ daka_days: number; completed_flags: number; total_points: number } | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true);
    interface UserStatsResponse { daka_days?: number; completed_flags?: number; total_points?: number }
    api.get(`/api/getUserStats?user_id=${userId}`)
      .then((raw) => {
        if (!active) return;
        const res = raw as UserStatsResponse;
        setStats({
          daka_days: res.daka_days ?? 0,
          completed_flags: res.completed_flags ?? 0,
          total_points: res.total_points ?? 0,
        });
      })
      .catch(() => active && setStats({ daka_days: 0, completed_flags: 0, total_points: 0 }))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [userId]);
  return (
    <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 rounded-xl p-3">
      <div className="space-y-1">
        <div className="font-bold text-xl text-blue-600">{loading ? '…' : stats?.daka_days ?? 0}</div>
        <div className="text-xs text-slate-500 font-medium">打卡天数</div>
      </div>
      <div className="space-y-1">
        <div className="font-bold text-xl text-green-600">{loading ? '…' : stats?.completed_flags ?? 0}</div>
        <div className="text-xs text-slate-500 font-medium">完成flag</div>
      </div>
      <div className="space-y-1">
        <div className="font-bold text-xl text-purple-600">{loading ? '…' : stats?.total_points ?? 0}</div>
        <div className="text-xs text-slate-500 font-medium">总积分</div>
      </div>
    </div>
  );
};

/**
 * 联系页面(翰林院论)
 * 展示用户动态、支持搜索、点赞、评论等社交功能
 */
export default function ContactPage() {
  const navigate = useNavigate();
  const { user: currentUserCtx } = useUser();

  const [displayedPosts, setDisplayedPosts] = useState<User[]>([]);
  const [searchUserResults, setSearchUserResults] = useState<SearchUserResult[]>([]); // 用户搜索结果
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>(''); // 实际执行搜索的查询
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  
  // 发布帖子相关状态
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar: string } | null>(null);

  // 动态获取 userId
  const userId = useMemo(() => currentUserCtx?.id || '', [currentUserCtx?.id]);

  // 鸟消息 - 简化为纯字符串数组（修复被污染的 JSX）
  const messages = useMemo(() => {
    const hour = new Date().getHours();
    let phase: 'early' | 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
    if (hour < 6) phase = 'early';
    else if (hour < 12) phase = 'morning';
    else if (hour < 18) phase = 'afternoon';
    else if (hour < 22) phase = 'evening';
    else phase = 'night';
    const base: string[] = [];
    if (phase === 'early') base.push('清晨的翰林院已经苏醒');
    if (phase === 'morning') base.push('上午好，分享你的感悟吧');
    if (phase === 'afternoon') base.push('下午茶时间，聊聊进步与心得');
    if (phase === 'evening') base.push('傍晚了，整理今日收获');
    if (phase === 'night') base.push('夜深了，注意休息与总结');
    base.push('点击头像可查看实时统计');
    return base;
  }, []);

  // 未读消息检查（从后端API获取最新状态）
  const checkUnreadMessages = useCallback(async () => {
    try {
      if (!userId) return;
      
      // 检查评论未读状态（本地标记）
      const commentsRead = localStorage.getItem(`commentsRead_${userId}`) === 'true';
      
      // 从后端获取私聊未读数
      try {
        const response = await api.get<{ conversations: { unread_count?: number }[] }>('/api/private-chat/conversations');
        if (response?.conversations) {
          const totalPrivateUnread = response.conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
          localStorage.setItem(`privateUnread_${userId}`, String(totalPrivateUnread));
          setHasUnreadMessages(!commentsRead || totalPrivateUnread > 0);
          return;
        }
      } catch (apiError) {
        console.error('获取私聊未读数失败:', apiError);
      }
      
      // API调用失败时，使用本地缓存的值
      const privateUnread = Number(localStorage.getItem(`privateUnread_${userId}`) || '0') > 0;
      setHasUnreadMessages(!commentsRead || privateUnread);
    } catch (e) {
      console.error('检查未读消息失败:', e);
    }
  }, [userId]);

  // 页面可见性变化时重新检查未读消息
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userId) {
        checkUnreadMessages();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId, checkUnreadMessages]);

  // 分页加载更多帖子
  const loadMorePosts = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    contactService.getPosts(page, POSTS_PER_PAGE)
      .then(response => {
        if (response && Array.isArray(response.data)) {
          const newPosts = response.data.map(adaptPostToUser);
          setDisplayedPosts(prev => [...prev, ...newPosts]);
          setPage(prev => prev + 1);
          setHasMore(response.hasMore);
        } else {
          setHasMore(false);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setHasMore(false);
      });
  }, [loading, hasMore, page]);

  /** 获取当前用户信息 */
  useEffect(() => {
    if (currentUserCtx) {
      setCurrentUserId(currentUserCtx.id);
      setCurrentUser(currentUserCtx);
      // 用户信息加载后立即检查未读消息
      checkUnreadMessages();
    }
  }, [currentUserCtx, checkUnreadMessages]);

  /** 初始加载和搜索触发 */
  useEffect(() => {
    setDisplayedPosts([]);
    setPage(1);
    setHasMore(true);
    setSearchUserResults([]);
    setLoading(true);
    setError(null);
    checkUnreadMessages();

    if (activeSearchQuery.trim()) {
      Promise.all([
        contactService.searchPosts({ query: activeSearchQuery, page: 1, pageSize: POSTS_PER_PAGE }),
        contactService.searchUsers(activeSearchQuery)
      ])
        .then(([postsResponse, usersResponse]) => {
          if (postsResponse && Array.isArray(postsResponse.data)) {
            setDisplayedPosts(postsResponse.data.map(adaptPostToUser));
            setPage(2);
            setHasMore(postsResponse.hasMore);
          } else {
            setDisplayedPosts([]);
            setHasMore(false);
          }
          if (usersResponse && Array.isArray(usersResponse)) {
            setSearchUserResults(usersResponse);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('搜索失败:', err);
          setError('搜索失败，请稍后再试');
          setLoading(false);
          setHasMore(false);
        });
    } else {
      contactService.getPosts(1, POSTS_PER_PAGE)
        .then(response => {
          if (response && Array.isArray(response.data)) {
            setDisplayedPosts(response.data.map(adaptPostToUser));
            setPage(2);
            setHasMore(response.hasMore);
            contactService.getUserLikedPosts()
              .then(ids => setLikedPosts(new Set(ids.map(id => String(id)))))
              .catch(() => {});
          } else {
            setDisplayedPosts([]);
            setHasMore(false);
          }
          setLoading(false);
        })
        .catch(() => {
          setError('无法连接到服务器');
          setLoading(false);
          setHasMore(false);
        });
    }
  }, [activeSearchQuery, checkUnreadMessages]);

  /** 监听用户头像更新，重新加载帖子数据 */
  useEffect(() => {
    const handleUserUpdated = () => {
      // 重新加载帖子数据以更新头像
      setDisplayedPosts([]);
      setPage(1);
      setHasMore(true);
      setLoading(true);
      contactService.getPosts(1, POSTS_PER_PAGE)
        .then(response => {
          if (response && Array.isArray(response.data)) {
            setDisplayedPosts(response.data.map(adaptPostToUser));
            setPage(2);
            setHasMore(response.hasMore);
            contactService.getUserLikedPosts()
              .then(ids => setLikedPosts(new Set(ids.map(id => String(id)))))
              .catch(() => {});
          } else {
            setDisplayedPosts([]);
            setHasMore(false);
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          setHasMore(false);
        });
    };

    window.addEventListener('userUpdated', handleUserUpdated);
    return () => window.removeEventListener('userUpdated', handleUserUpdated);
  }, []);

  /** 滚动监听(触发分页加载) */
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

  /** 点赞处理（后端自动切换点赞/取消状态）*/
  const handleLike = (postId: string, liked: string[]) => {
    const isLiked = liked.includes('liked');
    
    // 先乐观更新UI
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
    
    // 调用后端接口（后端自动处理点赞/取消逻辑）
    contactService.likePost(postId)
      .then(response => {
        // 用后端返回的真实点赞数更新UI
        if (response && typeof response.likes === 'number') {
          setDisplayedPosts(displayedPosts.map(post => 
            post.id === postId ? { ...post, likes: response.likes } : post
          ));
        }
      })
      .catch(error => {
        console.error('点赞操作失败:', error);
        // 回滚UI到原始状态
        setDisplayedPosts(displayedPosts.map(post => 
          post.id === postId 
            ? { ...post, likes: isLiked ? post.likes - 1 : post.likes + 1 }
            : post
        ));
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (isLiked) {
            newSet.delete(postId);
          } else {
            newSet.add(postId);
          }
          return newSet;
        });
      });
  };

  /** 评论处理 */
  const handleAddComment = (postId: string) => {
    const comment = newComment[postId]?.trim();
    if (!comment) return;

    // 调用后端接口添加评论
    contactService.addComment({ postId, content: comment })
      .then(savedComment => {
        // 使用React状态中的最新用户信息，确保评论显示最新的用户名、头像等信息
        const userName = currentUser?.name || savedComment.userName;
        const userAvatar = currentUser?.avatar || savedComment.userAvatar;

        const adaptedComment: Comment = {
          id: savedComment.id,
          userId: savedComment.userId,
          userName: userName, // 使用状态中的最新用户名
          userAvatar: userAvatar, // 使用状态中的最新头像
          content: comment, // 使用用户输入的评论内容
          time: formatTimeAgo(new Date().toISOString()) // 使用相对时间格式，与其他评论保持一致
        };
        setDisplayedPosts(displayedPosts.map(post => {
          if (post.id === postId) {
            return { ...post, comments: [...post.comments, adaptedComment] };
          }
          return post;
        }));
        setNewComment({ ...newComment, [postId]: '' });
      })
      .catch(error => {
        console.error('添加评论失败:', error);
        alert('评论失败，请重试');
      });
  };

  /** 删除帖子 */
  const handleDeletePost = async (postId: string) => {
    try {
      await contactService.deletePost(postId);
      // 从本地状态中移除该帖子
      setDisplayedPosts(displayedPosts.filter(post => post.id !== postId));
      
      // 通知其他页面（如flag页面）更新状态
      // 使用localStorage触发跨页面通信
      const event = new CustomEvent('postDeleted', { detail: { postId } });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('删除帖子失败:', error);
      alert('删除失败，请重试');
    }
  };

  /** 发布新帖子 */
  const handleCreatePost = async () => {
    const content = newPostContent.trim();
    if (!content) return;
    
    setIsPosting(true);
    try {
      await contactService.createPost({ content });
      setNewPostContent('');
      setIsDrawerOpen(false);
      // 重新加载帖子列表
      setDisplayedPosts([]);
      setPage(1);
      setHasMore(true);
      const response = await contactService.getPosts(1, POSTS_PER_PAGE);
      const adaptedPosts = response.data.map(adaptPostToUser);
      setDisplayedPosts(adaptedPosts);
      setPage(2);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('发布帖子失败:', error);
    } finally {
      setIsPosting(false);
    }
  };

  // ========== 渲染 ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col relative">
      <div className="pb-20 max-w-2xl mx-auto w-full">
        {/* 页面标题 */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-slate-200">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">翰林</h1>
                  <p className="text-sm text-slate-600">分享心得，交流感悟</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 搜索框 */}
        <div className="px-4 py-3">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="search"
              placeholder="搜索帖子、用户、评论..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setActiveSearchQuery(searchQuery);
                }
              }}
              className="pl-12 pr-20 h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button
              type="submit"
              onClick={() => setActiveSearchQuery(searchQuery)}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700"
            >
              搜索
            </Button>
          </div>
        </div>

        {/* 顶部导航模块 */}
        <div className="px-4 py-2">
          <div className="grid grid-cols-3 gap-4">
            <Card
              className="p-4 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 rounded-2xl"
              onClick={() => navigate('/rank')}
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div className="font-semibold text-slate-700">封神榜</div>
            </Card>

            <Card
              className="p-4 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 rounded-2xl"
              onClick={() => navigate('/chat-rooms')}
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div className="font-semibold text-slate-700">谈玄斋</div>
            </Card>

            <Card
              className="p-4 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-br from-green-50 to-teal-50 border-green-200 relative rounded-2xl"
              onClick={() => {
                setHasUnreadMessages(false);
                localStorage.setItem(`commentsRead_${userId}`, 'true');
                localStorage.setItem(`privateUnread_${userId}`, '0');
                navigate('/receive');
              }}
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
                <Inbox className="h-6 w-6 text-white" />
              </div>
              <div className="font-semibold text-slate-700">雁书札</div>
              {hasUnreadMessages && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </Card>
          </div>
        </div>

        {/* 动态列表标题 */}
        <div className="px-4 py-2 relative">
          <h2 className="text-lg font-semibold text-slate-800">翰林院论</h2>
                                {/* 鸟装饰与气泡 */}
        <BirdMascot position="contact" messages={messages} />
        </div>

        {/* 搜索结果：有搜索关键词时显示 Tabs */}
        {activeSearchQuery.trim() ? (
          <section className="px-4">
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="w-full grid grid-cols-2 h-12 bg-slate-100/80 backdrop-blur-sm p-1 rounded-2xl shadow-sm">
                <TabsTrigger value="posts" className="rounded-xl font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm">相关帖子 ({displayedPosts.length})</TabsTrigger>
                <TabsTrigger value="users" className="rounded-xl font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm">相关用户 ({searchUserResults.length})</TabsTrigger>
              </TabsList>
              
              {/* 帖子结果 Tab */}
              <TabsContent value="posts" className="space-y-3 mt-3">
                {displayedPosts.length === 0 && !loading ? (
                  <Card className="p-8 text-center text-muted-foreground">
                    <p>没有找到相关帖子</p>
                  </Card>
                ) : (
                  displayedPosts.map((user) => (
                    <Card key={user.id} className="p-4 mx-4 bg-white shadow-sm hover:shadow-lg transition-all duration-300 border-slate-200 rounded-2xl overflow-hidden" style={{ position: 'relative', zIndex: 10 }}>
                      {/* 用户信息行 */}
                      <div className="flex items-center gap-3 mb-3">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Avatar className="h-12 w-12 cursor-pointer ring-2 ring-blue-100 hover:ring-blue-300 transition-all duration-200">
                              <AvatarImage src={getAvatarUrl(user.avatar)} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-slate-700 font-semibold">{user.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-4 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-14 w-14 ring-2 ring-blue-100">
                                  <AvatarImage src={getAvatarUrl(user.avatar)} />
                                  <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <h4 className="font-bold text-slate-900 text-lg">{user.name}</h4>
                                </div>
                              </div>
                              <UserStatsBlock userId={String(user.userId)} />
                              {(!currentUserId || currentUserId === '' || String(user.userId) !== currentUserId) && (
                                <Button
                                  size="sm"
                                  className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                                  onClick={() => navigate('/send', {
                                    state: {
                                      user: {
                                        id: user.userId,
                                        name: user.name,
                                        avatar: user.avatar
                                      }
                                    }
                                  })}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  发消息
                                </Button>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-base truncate">{user.name}</span>
                            {user.comments.length > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                💬 {user.comments.length}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 mt-1 block">
                            发布时间: {formatTimeAgo(user.createdAt || '')}
                          </span>
                        </div>

                        {/* 删除按钮 - 只对自己的帖子显示 */}
                        {String(user.userId) === currentUserId && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除这条帖子吗？此操作无法撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeletePost(user.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>

                      {/* 帖子内容 */}
                      <div className="mb-3">
                        <p className="text-slate-800 leading-relaxed text-base whitespace-pre-wrap break-words">{user.message}</p>
                      </div>

                      {/* 互动按钮 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ToggleGroup
                            type="multiple"
                            size="sm"
                            onValueChange={(value) => handleLike(user.id, value)}
                          >
                            <ToggleGroupItem
                              value="liked"
                              aria-label="点赞"
                              className={`h-8 px-3 gap-2 rounded-full transition-all duration-200 font-semibold ${
                                likedPosts.has(user.id)
                                  ? 'text-red-600 bg-red-100 border-red-300 shadow-sm hover:shadow-md'
                                  : 'text-slate-600 bg-white border-slate-200 shadow-sm hover:shadow-md hover:text-red-600 hover:bg-red-50 hover:border-red-200'
                              }`}
                            >
                      <Heart className={`h-3.5 w-3.5 transition-all duration-200 ${likedPosts.has(user.id) ? 'text-red-600 fill-red-600 scale-110' : 'text-red-300'}`} />
                              <span className="font-bold">{user.likes}</span>
                            </ToggleGroupItem>
                          </ToggleGroup>

                          <button
                            className="flex items-center gap-2 text-blue-300 hover:text-blue-600 transition-all duration-200 h-8 px-3 rounded-full hover:bg-blue-50 border border-transparent hover:border-blue-200 font-semibold shadow-sm hover:shadow-md"
                            onClick={() => setShowComments({ ...showComments, [user.id]: !showComments[user.id] })}
                          >
                            <MessageSquare className={`h-3.5 w-3.5 transition-all duration-200 ${showComments[user.id] ? 'scale-110' : ''}`} />
                            <span className="font-bold">{user.comments.length}</span>
                          </button>
                        </div>
                          {/* 评论数统计行已移除 */}
                        </div>

                      {/* 评论列表 */}
                      {showComments[user.id] && user.comments.length > 0 && (
                        <div className="mt-3 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <MessageSquare className="h-4 w-4" />
                            <span>评论 ({user.comments.length})</span>
                          </div>
                          {user.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="h-9 w-9 flex-shrink-0">
                                <AvatarImage src={getAvatarUrl(comment.userAvatar)} />
                                <AvatarFallback className="text-xs bg-slate-100 text-slate-600 font-semibold">{comment.userName.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-sm text-slate-900">{comment.userName}</span>
                                  <span className="text-xs text-slate-500">{comment.time}</span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed break-words">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 评论输入框 */}
                      {showComments[user.id] && (
                        <div className="flex items-end gap-3 mt-4">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={currentUser?.avatar ? getAvatarUrl(currentUser.avatar) : undefined} />
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-700 font-semibold">
                              {currentUser?.name ? currentUser.name.slice(0,2) : '我'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex gap-2">
                            <Input
                              value={newComment[user.id] || ''}
                              onChange={(e) => setNewComment({ ...newComment, [user.id]: e.target.value })}
                              placeholder="写下你的评论..."
                              className="flex-1 h-10 text-sm rounded-full border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            />
                            <Button
                              size="sm"
                              className="h-10 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200"
                              onClick={() => handleAddComment(user.id)}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </TabsContent>
              
              {/* 用户结果 Tab */}
              <TabsContent value="users" className="space-y-3 mt-3">
                {searchUserResults.length === 0 && !loading ? (
                  <Card className="p-8 text-center text-muted-foreground">
                    <p>没有找到相关用户</p>
                  </Card>
                ) : (
                  searchUserResults.map(u => (
                    <Card key={u.id} className="p-4 mx-4 bg-white shadow-sm hover:shadow-lg transition-all duration-300 border-slate-200 rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-3 mb-3">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Avatar className="h-12 w-12 cursor-pointer ring-2 ring-blue-100 hover:ring-blue-300 transition-all duration-200">
                              <AvatarImage src={getAvatarUrl(u.avatar || '')} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-slate-700 font-semibold">{u.name.slice(0,2)}</AvatarFallback>
                            </Avatar>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-4 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-14 w-14 ring-2 ring-blue-100">
                                  <AvatarImage src={getAvatarUrl(u.avatar || '')} />
                                  <AvatarFallback>{u.name.slice(0,2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <h4 className="font-bold text-slate-900 text-lg">{u.name}</h4>
                                </div>
                              </div>
                              <UserStatsBlock userId={String(u.id)} />
                              {String(u.id) !== currentUserId && (
                                <Button
                                  size="sm"
                                  className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                                  onClick={() => navigate('/send', { state: { user: { id: String(u.id), name: u.name, avatar: u.avatar || '' } } })}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  发消息
                                </Button>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-base truncate">{u.name}</span>
                          </div>
                          <span className="text-xs text-slate-500 mt-1 block">{u.email}</span>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </section>
        ) : (
          /* 无搜索时：显示常规帖子列表 */
          <section className="space-y-3">
          {/* 错误提示 */}
          {error && (
            <Card className="p-6 mx-4 bg-red-50 border-red-200">
              <div className="text-center space-y-3">
                <p className="text-red-600 font-medium">⚠️ {error}</p>
                <p className="text-sm text-red-500">开发提示：请先启动后端服务</p>
                <Button 
                  size="sm"
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    contactService.getPosts(1, POSTS_PER_PAGE)
                      .then((response) => {
                        const adaptedPosts = response.data.map(adaptPostToUser);
                        setDisplayedPosts(adaptedPosts);
                        setPage(2);
                        setHasMore(response.hasMore);
                        setLoading(false);
                      })
                      .catch((err: unknown) => {
                        console.error('重试失败:', err);
                        setError('无法连接到服务器，请确保后端服务已启动');
                        setLoading(false);
                      });
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  重试连接
                </Button>
              </div>
            </Card>
          )}

          {displayedPosts.length === 0 && !loading && !error ? (
            <Card className="p-8 text-center text-muted-foreground">
              <p>没有找到相关帖子</p>
            </Card>
          ) : (
            displayedPosts.map((user) => (
            <Card key={user.id} className="p-4 mx-4 bg-white shadow-sm hover:shadow-lg transition-all duration-300 border-slate-200 rounded-2xl overflow-hidden" style={{ position: 'relative', zIndex: 10 }}>
              {/* 用户信息行 */}
              <div className="flex items-center gap-3 mb-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Avatar className="h-12 w-12 cursor-pointer ring-2 ring-blue-100 hover:ring-blue-300 transition-all duration-200">
                      <AvatarImage src={getAvatarUrl(user.avatar)} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-slate-700 font-semibold">{user.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-4 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-14 w-14 ring-2 ring-blue-100">
                            <AvatarImage src={getAvatarUrl(user.avatar)} />
                            <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 text-lg">{user.name}</h4>
                        </div>
                      </div>
                      
                      <UserStatsBlock userId={String(user.userId)} />
                      
                        {(() => {
                          const isMe = String(user.userId) === String(currentUserId);
                          return !isMe && (
                            <Button 
                              size="sm"
                              className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                              onClick={() => navigate('/send', { 
                                state: { 
                                  user: {
                                    id: user.userId,  // 使用userId而不是id
                                    name: user.name,
                                    avatar: user.avatar
                                  }
                                } 
                              })}
                            >
                              <Send className="h-3 w-3 mr-2" />
                              发消息
                            </Button>
                          );
                        })()}
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base truncate">{user.name}</span>
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">
                    发布时间: {formatTimeAgo(user.createdAt || '')}
                  </span>
                </div>

                {/* 删除按钮 - 只对自己的帖子显示 */}
                {String(user.userId) === currentUserId && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[90vw] max-w-[400px] mx-auto rounded-2xl border-0 shadow-2xl bg-white">
                      <AlertDialogHeader className="space-y-3 pb-4">
                        <AlertDialogTitle className="text-lg font-bold text-slate-900 text-center">
                          确认删除
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-slate-600 text-center leading-relaxed px-2">
                          确定要删除这条帖子吗？此操作无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                        <AlertDialogCancel className="flex-1 h-11 rounded-xl border-slate-200 text-slate-700 font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors">
                          取消
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePost(user.id)}
                          className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors shadow-sm hover:shadow-md"
                        >
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {/* 帖子内容 */}
              <div className="mb-3">
                <p className="text-slate-800 leading-relaxed text-base whitespace-pre-wrap break-words">{user.message}</p>
              </div>
              
                      {/* 互动按钮 */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <ToggleGroup 
                            type="multiple" 
                            size="sm"
                            onValueChange={(value) => handleLike(user.id, value)}
                          >
                            <ToggleGroupItem
                              value="liked"
                              aria-label="点赞"
                              className={`h-8 px-3 gap-2 rounded-full transition-all duration-200 font-semibold data-[state=on]:bg-red-100 data-[state=on]:text-red-600 data-[state=on]:border-red-300 ${
                                likedPosts.has(user.id)
                                  ? 'text-red-600 bg-red-100 border-red-300 shadow-sm hover:shadow-md'
                                  : 'text-red-300 bg-white border-slate-200 shadow-sm hover:shadow-md hover:text-red-600 hover:bg-red-50 hover:border-red-200'
                              }`}
                            >
                      <Heart className={`h-3.5 w-3.5 transition-all duration-200 ${likedPosts.has(user.id) ? 'text-red-600 fill-red-600 scale-110' : 'text-red-300'}`} />
                              <span className="font-bold">{user.likes}</span>
                            </ToggleGroupItem>
                          </ToggleGroup>
                          
                          <button 
                            className="flex items-center gap-2 text-blue-300 hover:text-blue-600 transition-all duration-200 h-8 px-3 rounded-full hover:bg-blue-50 border border-transparent hover:border-blue-200 font-semibold shadow-sm hover:shadow-md"
                            onClick={() => setShowComments({ ...showComments, [user.id]: !showComments[user.id] })}
                          >
                            <MessageSquare className={`h-3.5 w-3.5 transition-all duration-200 ${showComments[user.id] ? 'scale-110' : ''}`} />
                            <span className="font-bold">{user.comments.length}</span>
                          </button>
                        </div>
                      </div>                      {/* 评论列表 */}
                      {showComments[user.id] && user.comments.length > 0 && (
                        <div className="mt-2 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <MessageSquare className="h-4 w-4" />
                            <span>评论 ({user.comments.length})</span>
                          </div>
                          {user.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="h-9 w-9 flex-shrink-0">
                                <AvatarImage src={getAvatarUrl(comment.userAvatar)} />
                                <AvatarFallback className="text-xs bg-slate-100 text-slate-600 font-semibold">{comment.userName.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-sm text-slate-900">{comment.userName}</span>
                                  <span className="text-xs text-slate-500">{comment.time}</span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed break-words">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}              {/* 评论输入框 */}
              {showComments[user.id] && (
                <div className="flex items-end gap-3 mt-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={currentUser?.avatar ? getAvatarUrl(currentUser.avatar) : undefined} />
                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700 font-semibold">
                      {currentUser?.name ? currentUser.name.slice(0,2) : '我'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={newComment[user.id] || ''}
                      onChange={(e) => setNewComment({ ...newComment, [user.id]: e.target.value })}
                      placeholder="写下你的评论..."
                      className="flex-1 h-10 text-sm rounded-full border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddComment(user.id);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-10 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200"
                      onClick={() => handleAddComment(user.id)}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
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
        )}
      </div>
      
      {/* 发布帖子按钮 */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="fixed right-6 bottom-24 z-50 w-16 h-16 rounded-full bg-blue-600 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110 flex items-center justify-center text-white"
          aria-label="发布帖子"
        >
          <Plus className="h-8 w-8" strokeWidth={2.5} />
        </button>
        
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>发布新帖子</DrawerTitle>
            <DrawerDescription>
              分享你的想法和动态到翰林院论坛
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 py-4">
            <Textarea
              placeholder="写下你想说的话...可以分享心得、生活感悟、或是提出问题,快来试试吧！"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="min-h-[200px] resize-none text-base"
              disabled={isPosting}
            />
          </div>
          
          <DrawerFooter>
            <Button 
              onClick={handleCreatePost}
              disabled={!newPostContent.trim() || isPosting}
              className="w-full"
            >
              {isPosting ? '发布中...' : '发布'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full" disabled={isPosting}>
                取消
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      
      {/* 功能简介 */}
      <Tutorial />
      
      <BottomNav />
    </div>
  );
}
