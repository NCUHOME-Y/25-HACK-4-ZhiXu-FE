import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, MessageCircle, Heart, MessageSquare, Send, Search as SearchIcon } from 'lucide-react';
import { BottomNav, Card, Avatar, AvatarImage, AvatarFallback, Popover, PopoverTrigger, PopoverContent, Button, ToggleGroup, ToggleGroupItem, Input, Skeleton } from "../components";
import contactService from '../services/contact.service';
import type { ContactUser as User, ContactComment as Comment } from '../lib/types/types';
import { adaptPostToUser } from '../lib/helpers/helpers';
import { POSTS_PER_PAGE } from '../lib/constants/constants';

/**
 * 联系页面(翰林院论)
 * 展示用户动态、支持搜索、点赞、评论等社交功能
 */
export default function ContactPage() {
  const navigate = useNavigate();

  // ========== 本地状态 ==========
  const [displayedPosts, setDisplayedPosts] = useState<User[]>([]);
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

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
        if (response.data.length === 0) {
          setHasMore(false);
        } else {
          const adaptedPosts = response.data.map(adaptPostToUser);
          setDisplayedPosts(prev => [...prev, ...adaptedPosts]);
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
    
    if (searchQuery.trim()) {
      contactService.searchPosts({ query: searchQuery, page: 1, pageSize: POSTS_PER_PAGE })
        .then((response) => {
          const adaptedPosts = response.data.map(adaptPostToUser);
          setDisplayedPosts(adaptedPosts);
          setPage(2);
          setHasMore(response.hasMore);
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
          const adaptedPosts = response.data.map(adaptPostToUser);
          setDisplayedPosts(adaptedPosts);
          setPage(2);
          setHasMore(response.hasMore);
          setLoading(false);
        })
        .catch((error: unknown) => {
          console.error('加载帖子失败:', error);
          setError('无法连接到服务器，请确保后端服务已启动（http://localhost:8080）');
          setLoading(false);
          setHasMore(false);
        });
    }
  }, [searchQuery]);

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
   * 点赞处理
   */
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

  /**
   * 评论处理
   */
  const handleAddComment = (postId: string) => {
    const comment = newComment[postId]?.trim();
    if (!comment) return;

    const newCommentObj: Comment = {
      id: `c${Date.now()}`,
      userId: 'me',
      userName: '我',
      userAvatar: '/default-avatar.png',
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

  // ========== 渲染 ==========
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
