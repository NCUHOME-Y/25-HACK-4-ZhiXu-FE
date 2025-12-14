import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, MessageCircle, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback, Button, Card } from "../components";
import { useUser } from '../lib/stores/userContext';
import { api } from '../services/apiClient';
import { getAvatarUrl } from '../lib/helpers/asset-helpers';

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
  const { user: currentUserCtx, refreshFromStorage } = useUser();
  const [conversations, setConversations] = useState<PrivateConversation[]>([]);
  const [comments, setComments] = useState<CommentNotification[]>([]);
  const [commentsRedDot, setCommentsRedDot] = useState(() => {
    const userId = currentUserCtx?.id || localStorage.getItem('currentUserId');
    return userId ? localStorage.getItem(`commentsRead_${userId}`) !== 'true' : false;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCommentDetails, setShowCommentDetails] = useState(false);

  useEffect(() => {
    const id = currentUserCtx?.id;
    if (!id) return;
    localStorage.setItem('currentUserId', id); // 向旧逻辑兼容存储
    Promise.all([
      loadPrivateConversations(id),
      loadComments(id)
    ]).finally(() => {
      localStorage.setItem(`lastReadTime_${id}`, new Date().toISOString());
      setLoading(false);
    });
  }, [currentUserCtx]);

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
    const userId = currentUserCtx?.id || localStorage.getItem('currentUserId');
    if (userId) {
      localStorage.setItem(`commentsRead_${userId}`, 'true');
      refreshFromStorage();
    }
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
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto w-full">
      {/* 顶部导航栏 */}
      <nav className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200/50 shadow-sm">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">收到的消息</h1>
            <p className="text-xs text-gray-500">查看私聊和评论通知</p>
          </div>
        </div>
      </nav>

      <div className="flex-1 pb-6 px-4 pt-6">
        {/* 私聊会话列表 */}
        {conversations.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground px-2">私聊消息</h2>
            {conversations.map((conv) => (
              <Card
                key={conv.userId}
                className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-white/80 backdrop-blur-sm border border-gray-200/50"
                onClick={() => handleConversationClick(conv)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-white">
                    <AvatarImage src={getAvatarUrl(conv.userAvatar)} />
                    <AvatarFallback>{conv.userName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{conv.userName}</h3>
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
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground px-2">评论通知</h2>
          <Card
            className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-white/80 backdrop-blur-sm border border-gray-200/50"
            onClick={handleCommentsClick}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-teal-500 shadow-lg shadow-green-200 flex items-center justify-center flex-shrink-0 ring-2 ring-white">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">对你的评论</h3>
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
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground px-2">评论详情</h2>
            {comments.map((comment) => (
              <Card key={comment.id} className="p-4 bg-white/80 backdrop-blur-sm border border-gray-200/50">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={getAvatarUrl(comment.fromUserAvatar)} />
                    <AvatarFallback>{comment.fromUserName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900">{comment.fromUserName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      评论了你的帖子「{comment.postTitle}」
                    </p>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <Card className="p-6 mb-6 bg-gradient-to-r from-red-50 to-pink-50 border-red-200 shadow-sm">
            <div className="text-center space-y-3">
              <div className="text-2xl">⚠️</div>
              <p className="text-red-700 font-medium">{error}</p>
              <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-full px-6">
                重新加载
              </Button>
            </div>
          </Card>
        )}

        {/* 空状态 - 只在没有私聊会话时显示 */}
        {!error && conversations.length === 0 && (
          <Card className="p-8 text-center bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-sm">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <p className="text-gray-600 font-medium text-lg">暂无私聊消息</p>
                <p className="text-sm text-gray-500 mt-1">收到的私聊消息会显示在这里</p>
              </div>
            </div>
          </Card>
        )}

        {!error && conversations.length > 0 && (
          <div className="mt-8 text-center text-xs text-gray-500 space-y-1 bg-white/40 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50">
            <p className="flex items-center justify-center gap-1">
              <span className="text-blue-500">💬</span>
              点击私聊消息进入聊天界面
            </p>
            <p className="flex items-center justify-center gap-1">
              <span className="text-green-500">🔔</span>
              评论通知会实时更新
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
