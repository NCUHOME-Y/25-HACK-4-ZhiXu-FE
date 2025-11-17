import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, MessageCircle, Heart, MessageSquare, Send, Search as SearchIcon, Plus, Inbox } from 'lucide-react';
import { BottomNav, Card, Avatar, AvatarImage, AvatarFallback, Popover, PopoverTrigger, PopoverContent, Button, ToggleGroup, ToggleGroupItem, Input, Skeleton, Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose, Textarea, Tabs, TabsList, TabsTrigger, TabsContent } from "../components";
import contactService, { type SearchUserResult } from '../services/contact.service';
import type { Conversation } from '../services/chat.service';
import type { ContactUser as User, ContactComment as Comment } from '../lib/types/types';
import { adaptPostToUser } from '../lib/helpers/helpers';
import { POSTS_PER_PAGE } from '../lib/constants/constants';
import { getAvatarUrl } from '../lib/helpers/asset-helpers';

/**
 * 联系页面(翰林院论)
 * 展示用户动态、支持搜索、点赞、评论等社交功能
 */
export default function ContactPage() {
  const navigate = useNavigate();

  // ========== 本地状态 ==========
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
  const [hasUnreadMessages, setHasUnreadMessages] = useState(() => {
    const userId = localStorage.getItem('currentUserId');
    const commentsUnread = localStorage.getItem(`commentsRead_${userId}`) !== 'true';
    const privateUnread = Number(localStorage.getItem(`privateUnread_${userId}`) || '0') > 0;
    return commentsUnread || privateUnread;
  });

  // ========== 事件处理器 ==========
  /**
   * 加载更多帖子(分页加载)
   */
  const loadMorePosts = useCallback(() => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    setError(null);
    
    contactService.getPosts(page, POSTS_PER_PAGE)
      .then((response) => {
        if (!response || !Array.isArray(response.data) || response.data.length === 0) {
          setHasMore(false);
        } else {
          const adaptedPosts = response.data.map(adaptPostToUser);
          setDisplayedPosts(prev => [...prev, ...adaptedPosts]);
          // 合并已点赞状态（确保翻页时也能标注已点赞）
          contactService.getUserLikedPosts()
            .then((ids) => {
              setLikedPosts(prev => {
                const s = new Set(prev);
                ids.forEach(id => s.add(String(id)));
                return s;
              });
            })
            .catch((e) => console.warn('无法获取已点赞帖子', e));
          setPage(prev => prev + 1);
          setHasMore(response.hasMore);
        }
        setLoading(false);
      })
      .catch((error: unknown) => {
        console.error('加载帖子失败:', error);
        setError('无法连接到服务器，请检查后端服务是否启动');
        setLoading(false);
        setHasMore(false);
      });
  }, [loading, hasMore, page]);

  /**
   * 检查是否有未读消息/评论
   */
  const checkUnreadMessages = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      const lastReadTime = localStorage.getItem(`lastReadTime_${user.id}`);
      
      if (!lastReadTime) {
        setHasUnreadMessages(true);
        return;
      }

      // 检查是否有新的私聊消息
      const conversationsResponse = await contactService.getPrivateConversations();
      const hasNewPrivateMsg = conversationsResponse?.conversations?.some((conv: Conversation) => 
        new Date(conv.last_message_at) > new Date(lastReadTime)
      ) || false;

      // 检查是否有新的评论
      const postsResponse = await contactService.getAllPosts();
      const posts = postsResponse?.posts || [];
      let hasNewComment = false;
      
      posts.forEach((post) => {
        // 断言 post 结构，保证类型安全
        const p = post as unknown as { user_id?: string; comments?: Array<{ userId: string; created_at?: string }> };
        if (p.user_id && String(p.user_id) === String(user.id) && p.comments) {
          p.comments.forEach((comment) => {
            // 兼容 comment.created_at 可能不存在的情况
            if (String(comment.userId) !== String(user.id) && 
                comment.created_at && new Date(comment.created_at) > new Date(lastReadTime)) {
              hasNewComment = true;
            }
          });
        }
      });

      setHasUnreadMessages(hasNewPrivateMsg || hasNewComment);
    } catch (error) {
      console.error('检查未读消息失败:', error);
    }
  };

  // ========== 副作用 ==========
  /**
   * 初始加载和搜索触发
   */
  useEffect(() => {
    setDisplayedPosts([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    setError(null);
    
    // 检查未读消息
    checkUnreadMessages();
    
    if (activeSearchQuery.trim()) {
      // 同时搜索帖子和用户
      Promise.all([
        contactService.searchPosts({ query: searchQuery, page: 1, pageSize: POSTS_PER_PAGE }),
        contactService.searchUsers(searchQuery)
      ])
        .then(([postsResponse, usersResponse]) => {
          // 处理帖子搜索结果
          if (postsResponse && Array.isArray(postsResponse.data)) {
            const adaptedPosts = postsResponse.data.map(adaptPostToUser);
            setDisplayedPosts(adaptedPosts);
            setPage(2);
            setHasMore(postsResponse.hasMore);
          } else {
            setDisplayedPosts([]);
            setHasMore(false);
          }
          
          // 处理用户搜索结果
          if (usersResponse && Array.isArray(usersResponse)) {
            setSearchUserResults(usersResponse);
          } else {
            setSearchUserResults([]);
          }
          
          setLoading(false);
        })
        .catch((error: unknown) => {
          console.error('搜索失败:', error);
          setError('搜索失败，请检查网络连接或稍后再试');
          setLoading(false);
          setHasMore(false);
        });
    } else {
      contactService.getPosts(1, POSTS_PER_PAGE)
        .then((response) => {
          if (response && Array.isArray(response.data)) {
            const adaptedPosts = response.data.map(adaptPostToUser);
            setDisplayedPosts(adaptedPosts);
            setPage(2);
            setHasMore(response.hasMore);
              // 加载当前用户的已点赞帖子并设置状态
              contactService.getUserLikedPosts()
                .then((ids) => {
                  const setIds = new Set(ids.map(id => String(id)));
                  setLikedPosts(setIds);
                })
                .catch((e) => console.warn('无法获取已点赞帖子', e));
              contactService.getUserLikedPosts()
                .then((ids) => setLikedPosts(new Set(ids.map(id => String(id)))))
                .catch((e) => console.warn('无法获取已点赞帖子', e));
          } else {
            setDisplayedPosts([]);
            setHasMore(false);
          }
          setLoading(false);
        })
        .catch((error: unknown) => {
          console.error('加载帖子失败:', error);
          setError('无法连接到服务器，请确保后端服务已启动（http://localhost:8080）');
          setLoading(false);
          setHasMore(false);
        });
    }
  }, [activeSearchQuery, searchQuery]);

  /**
   * 滚动监听(触发分页加载)
   */
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

  /**
   * 点赞处理（后端自动切换点赞/取消状态）
   */
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

  /**
   * 评论处理
   */
  const handleAddComment = (postId: string) => {
    const comment = newComment[postId]?.trim();
    if (!comment) return;

    // 调用后端接口添加评论
    contactService.addComment({ postId, content: comment })
      .then(savedComment => {
        // 用后端返回的评论数据更新UI
        const adaptedComment: Comment = {
          id: savedComment.id,
          userId: savedComment.userId,
          userName: savedComment.userName,
          userAvatar: savedComment.userAvatar,
          content: savedComment.content,
          time: savedComment.createdAt
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

  /**
   * 发布新帖子
   */
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="pb-20">
        {/* 页面标题 */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-slate-200">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">翰林院论</h1>
                <p className="text-sm text-slate-600">分享学习心得，交流生活感悟</p>
              </div>
            </div>
          </div>
        </header>

        {/* 搜索框 */}
        <div className="px-4 py-4">
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
        <div className="px-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <Card
              className="p-4 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200"
              onClick={() => navigate('/rank')}
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div className="font-semibold text-slate-700">排行榜</div>
            </Card>

            <Card
              className="p-4 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200"
              onClick={() => navigate('/chat-rooms')}
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div className="font-semibold text-slate-700">聊天室</div>
            </Card>

            <Card
              className="p-4 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-br from-green-50 to-teal-50 border-green-200 relative"
              onClick={() => {
                setHasUnreadMessages(false);
                const userId = localStorage.getItem('currentUserId');
                localStorage.setItem(`commentsRead_${userId}`, 'true');
                navigate('/receive');
              }}
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
                <Inbox className="h-6 w-6 text-white" />
              </div>
              <div className="font-semibold text-slate-700">收到的消息</div>
              {hasUnreadMessages && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </Card>
          </div>
        </div>

        {/* 动态列表标题 */}
        <div className="px-4 py-2">
          <h2 className="text-lg font-semibold text-slate-800">最新动态</h2>
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
                    <Card key={user.id} className="p-4 mx-4 bg-white shadow-sm hover:shadow-lg transition-all duration-300 border-slate-200 rounded-2xl overflow-hidden">
                      {/* 用户信息行 */}
                      <div className="flex items-center gap-3 mb-4">
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
                                  <p className="text-sm text-slate-500">点击查看详情</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 rounded-xl p-3">
                                <div className="space-y-1">
                                  <div className="font-bold text-xl text-blue-600">{user.totalDays}</div>
                                  <div className="text-xs text-slate-500 font-medium">打卡天数</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="font-bold text-xl text-green-600">{user.completedFlags}</div>
                                  <div className="text-xs text-slate-500 font-medium">完成flag</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="font-bold text-xl text-purple-600">{user.totalPoints}</div>
                                  <div className="text-xs text-slate-500 font-medium">总积分</div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
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
                          {user.comments.length > 0 && (
                            <span className="text-xs text-slate-500 mt-1 block">
                              最后回复: {user.comments[user.comments.length - 1].time}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 帖子内容 */}
                      <div className="mb-4">
                        <p className="text-slate-800 leading-relaxed text-base whitespace-pre-wrap break-words">{user.message}</p>
                      </div>

                      {/* 互动按钮 */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <ToggleGroup
                            type="multiple"
                            size="sm"
                            onValueChange={(value) => handleLike(user.id, value)}
                          >
                            <ToggleGroupItem
                              value="liked"
                              aria-label="点赞"
                              className={`h-9 px-4 gap-2 rounded-full transition-all duration-200 font-semibold ${
                                likedPosts.has(user.id)
                                  ? 'text-red-600 bg-red-100 border-red-300 shadow-sm hover:shadow-md'
                                  : 'text-slate-600 bg-white border-slate-200 shadow-sm hover:shadow-md hover:text-red-600 hover:bg-red-50 hover:border-red-200'
                              }`}
                            >
                      <Heart className={`h-4 w-4 transition-all duration-200 ${likedPosts.has(user.id) ? 'text-red-600 fill-red-600 scale-110' : 'text-slate-600'}`} />
                              <span className="font-bold">{user.likes}</span>
                            </ToggleGroupItem>
                          </ToggleGroup>

                          <button
                            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-all duration-200 h-9 px-4 rounded-full hover:bg-blue-50 border border-transparent hover:border-blue-200 font-semibold shadow-sm hover:shadow-md"
                            onClick={() => setShowComments({ ...showComments, [user.id]: !showComments[user.id] })}
                          >
                            <MessageSquare className={`h-4 w-4 transition-all duration-200 ${showComments[user.id] ? 'scale-110' : ''}`} />
                            <span className="font-bold">{user.comments.length}</span>
                          </button>
                        </div>
                          {/* 评论数统计行已移除 */}
                      </div>

                      {/* 评论列表 */}
                      {showComments[user.id] && user.comments.length > 0 && (
                        <div className="mt-4 space-y-3">
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
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-700 font-semibold">
                              {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).name.slice(0, 2) : '我'}
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
                  searchUserResults.map((searchUser) => (
                    <Card key={searchUser.id} className="p-4 mx-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 border-slate-200">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 bg-gradient-to-br from-blue-500 to-purple-600">
                          <AvatarImage src={getAvatarUrl(searchUser.avatar)} alt="Avatar" />
                          <AvatarFallback className="text-lg font-bold text-white bg-blue-500">
                            {searchUser.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h2 className="text-lg font-bold text-slate-900 truncate">{searchUser.name}</h2>
                          <p className="text-sm text-slate-600 truncate">{searchUser.email}</p>
                        </div>
                        <Button
                          size="sm"
                          className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4"
                          onClick={() => navigate('/send', {
                            state: {
                              user: {
                                id: String(searchUser.id),
                                name: searchUser.name,
                                avatar: searchUser.avatar
                              }
                            }
                          })}
                        >
                          <Send className="h-3 w-3 mr-2" />
                          发消息
                        </Button>
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
            <Card key={user.id} className="p-4 mx-4 bg-white shadow-sm hover:shadow-lg transition-all duration-300 border-slate-200 rounded-2xl overflow-hidden">
              {/* 用户信息行 */}
              <div className="flex items-center gap-3 mb-4">
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
                          <p className="text-sm text-slate-500">点击查看详情</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 rounded-xl p-3">
                        <div className="space-y-1">
                          <div className="font-bold text-xl text-blue-600">{user.totalDays}</div>
                          <div className="text-xs text-slate-500 font-medium">打卡天数</div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-xl text-green-600">{user.completedFlags}</div>
                          <div className="text-xs text-slate-500 font-medium">完成flag</div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-xl text-purple-600">{user.totalPoints}</div>
                          <div className="text-xs text-slate-500 font-medium">总积分</div>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm"
                        className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
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
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base truncate">{user.name}</span>
                  </div>
                  {user.comments.length > 0 && (
                    <span className="text-xs text-slate-500 mt-1 block">
                      最后回复: {user.comments[user.comments.length - 1].time}
                    </span>
                  )}
                </div>
              </div>

              {/* 帖子内容 */}
              <div className="mb-4">
                <p className="text-slate-800 leading-relaxed text-base whitespace-pre-wrap break-words">{user.message}</p>
              </div>
              
              {/* 互动按钮 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ToggleGroup 
                    type="multiple" 
                    size="sm"
                    onValueChange={(value) => handleLike(user.id, value)}
                  >
                    <ToggleGroupItem 
                      value="liked" 
                      aria-label="点赞" 
                      className={`h-9 px-4 gap-2 rounded-full transition-all duration-200 font-semibold data-[state=on]:bg-red-100 data-[state=on]:text-red-600 data-[state=on]:border-red-300 ${
                        likedPosts.has(user.id) 
                          ? 'text-red-600 bg-red-100 border-red-300 shadow-sm hover:shadow-md' 
                          : 'text-slate-600 bg-white border-slate-200 shadow-sm hover:shadow-md hover:text-red-600 hover:bg-red-50 hover:border-red-200'
                      }`}
                    >
                      <Heart className={`h-4 w-4 transition-all duration-200 ${likedPosts.has(user.id) ? 'text-red-600 fill-red-600 scale-110' : 'text-slate-600'}`} />
                      <span className="font-bold">{user.likes}</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                  
                  <button 
                    className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-all duration-200 h-9 px-4 rounded-full hover:bg-blue-50 border border-transparent hover:border-blue-200 font-semibold shadow-sm hover:shadow-md"
                    onClick={() => setShowComments({ ...showComments, [user.id]: !showComments[user.id] })}
                  >
                    <MessageSquare className={`h-4 w-4 transition-all duration-200 ${showComments[user.id] ? 'scale-110' : ''}`} />
                    <span className="font-bold">{user.comments.length}</span>
                  </button>
                </div>

                <div className="text-xs text-slate-400 font-medium">
                  {user.comments.length > 0 ? `${user.comments.length} 条评论` : '暂无评论'}
                </div>
              </div>

                      {/* 评论列表 */}
                      {showComments[user.id] && user.comments.length > 0 && (
                        <div className="mt-4 space-y-3">
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
                <div className="flex items-end gap-3 mt-4">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700 font-semibold">
                      {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).name.slice(0, 2) : '我'}
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
              placeholder="写下你想说的话...\n\n可以分享学习心得、生活感悟、或是提出问题"
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
      
      <BottomNav />
    </div>
  );
}
