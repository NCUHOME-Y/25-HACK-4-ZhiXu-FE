import { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback, Button, Card } from "../components";
import authService from '../services/auth.service';
import { api } from '../services/apiClient';

interface PrivateConversation {
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface CommentNotification {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  content: string;
  postTitle: string;
  createdAt: string;
}

interface ConversationResponse {
  user_id: number;
  user_name: string;
  user_avatar: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface PostData {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: string;
  comments?: CommentData[];
}

interface CommentData {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  content: string;
  created_at: string;
}

/**
 * 接收消息页面 - 显示收到的私聊和评论
 */
export default function ReceivePage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<PrivateConversation[]>([]);
  const [comments, setComments] = useState<CommentNotification[]>([]);
  const [commentsRedDot, setCommentsRedDot] = useState(() => {
    const userId = localStorage.getItem('currentUserId');
    return localStorage.getItem(`commentsRead_${userId}`) !== 'true';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCommentDetails, setShowCommentDetails] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          localStorage.setItem('currentUserId', user.id);
          await Promise.all([
            loadPrivateConversations(user.id),
            loadComments(user.id)
          ]);
          localStorage.setItem(`lastReadTime_${user.id}`, new Date().toISOString());
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const loadPrivateConversations = async (_userId: string) => {
    try {
      console.log('📡 正在加载私聊会话列表...');
      // 调用后端API获取私聊会话列表
      const response = await api.get<{ conversations: ConversationResponse[] }>('/api/private-chat/conversations');
      
      console.log('✅ API响应:', response);
      console.log('✅ 会话数据:', response.conversations);
      
      // 检查响应数据
      if (!response || !response.conversations) {
        console.warn('⚠️ API返回空数据');
        setConversations([]);
        setError(null);
        return;
      }
      
      // 转换后端数据格式为前端格式
      const conversationList: PrivateConversation[] = response.conversations.map((conv: ConversationResponse) => ({
        userId: String(conv.user_id),
        userName: conv.user_name || `用户${conv.user_id}`,
        userAvatar: conv.user_avatar || '',
        lastMessage: conv.last_message,
        lastMessageTime: conv.last_message_at,
        unreadCount: conv.unread_count || 0,
      }));

      // 统计所有未读私聊消息数
      const totalPrivateUnread = conversationList.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      const userId = localStorage.getItem('currentUserId');
      localStorage.setItem(`privateUnread_${userId}`, String(totalPrivateUnread));

      console.log('✅ 转换后的会话列表:', conversationList);
      setConversations(conversationList);
      setError(null);
    } catch (error: unknown) {
      console.error('❌ 加载私聊会话失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const responseError = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      console.error('❌ 错误详情:', responseError || errorMessage);
      setError(`加载会话列表失败: ${responseError || errorMessage}`);
    }
  };

  const loadComments = async (userId: string) => {
    try {
      console.log('📡 正在加载评论通知...');
      // 获取所有帖子评论
      const response = await api.get<{ success: boolean; posts: PostData[]; total: number }>('/api/getAllPosts');
      console.log('✅ API原始响应:', response);
      
      const postsResponse = response.posts || [];
      console.log('✅ 帖子列表:', postsResponse);
      console.log('✅ 帖子数量:', postsResponse.length);
      
      // 过滤出对当前用户帖子的评论
      const myComments: CommentNotification[] = [];
      
      if (postsResponse && Array.isArray(postsResponse)) {
        console.log('🔍 开始遍历帖子，当前用户ID:', userId);
        postsResponse.forEach((post: PostData) => {
          console.log('📝 检查帖子:', {
            post_id: post.id,
            post_user_id: post.user_id,
            is_my_post: String(post.user_id) === userId,
            comments_count: post.comments?.length || 0
          });
          
          // 只处理当前用户的帖子
          if (String(post.user_id) === userId && post.comments && Array.isArray(post.comments)) {
            console.log('✅ 找到我的帖子，评论数:', post.comments.length);
            post.comments.forEach((comment: CommentData) => {
              console.log('💬 检查评论:', {
                comment_id: comment.id,
                comment_user_id: comment.userId,
                is_my_comment: String(comment.userId) === userId
              });
              
              // 排除自己的评论
              if (String(comment.userId) !== userId) {
                console.log('✅ 添加别人的评论');
                myComments.push({
                  id: String(comment.id),
                  fromUserId: String(comment.userId),
                  fromUserName: comment.userName || '匿名用户',
                  fromUserAvatar: comment.userAvatar || '',
                  content: comment.content,
                  postTitle: post.title || '无标题',
                  createdAt: comment.created_at,
                });
              }
            });
          }
        });
      }
      
      console.log('✅ 评论通知加载成功，总数:', myComments.length);
      console.log('📋 评论列表:', myComments);
      setComments(myComments);
    } catch (error) {
      console.error('❌ 加载评论失败:', error);
      // 评论加载失败不影响主要功能
      setComments([]);
    }
  };

  const handleConversationClick = (conversation: PrivateConversation) => {
    console.log('🔄 跳转到私聊页面:', conversation);
    navigate('/send', {
      state: {
        user: {
          id: conversation.userId,
          name: conversation.userName,
          avatar: conversation.userAvatar,
        }
      }
    });
  };

  const handleCommentsClick = () => {
    setShowCommentDetails(!showCommentDetails);
    setCommentsRedDot(false);
    const userId = localStorage.getItem('currentUserId');
    localStorage.setItem(`commentsRead_${userId}`, 'true');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 顶部导航栏 */}
      <nav className="bg-white sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">收到的消息</h1>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 私聊会话列表 */}
        {conversations.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground px-2">私聊消息</h2>
            {conversations.map((conv) => (
              <Card
                key={conv.userId}
                className="p-4 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleConversationClick(conv)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={conv.userAvatar} />
                    <AvatarFallback>{conv.userName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium truncate">{conv.userName}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <div className="flex-shrink-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 评论通知 */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-2">评论通知</h2>
          <Card
            className="p-4 cursor-pointer hover:bg-accent transition-colors"
            onClick={handleCommentsClick}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium">对你的评论</h3>
                <p className="text-sm text-muted-foreground">
                  {comments.length > 0 ? `${comments.length}条新评论` : '暂无新评论'}
                </p>
              </div>

              {comments.length > 0 && commentsRedDot && (
                <div className="flex-shrink-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {comments.length}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 评论详情列表 */}
        {showCommentDetails && comments.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground px-2">评论详情</h2>
            {comments.map((comment) => (
              <Card key={comment.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={comment.fromUserAvatar} />
                    <AvatarFallback>{comment.fromUserName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{comment.fromUserName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      评论了你的帖子「{comment.postTitle}」
                    </p>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>重新加载</Button>
          </div>
        )}

        {/* 空状态 - 只在没有私聊会话时显示 */}
        {!error && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">暂无私聊消息</p>
            <p className="text-sm text-muted-foreground/70 mt-2">
              收到的私聊消息会显示在这里
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
