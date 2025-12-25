import { api } from './apiClient';
import type { Conversation } from './chat.service';

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  likes: number;
  comments: PostComment[];
  createdAt: string;
  updatedAt: string;
}

// 评论接口类型
export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

// 用户信息接口类型
export interface UserInfo {
  id: string;
  name: string;
  avatar: string;
  totalDays: number;
  completedFlags: number;
  totalPoints: number;
}

// 搜索用户结果类型
export interface SearchUserResult {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 搜索帖子参数
export interface SearchPostsParams {
  query: string;
  page?: number;
  pageSize?: number;
}

// 创建帖子参数
export interface CreatePostParams {
  content: string;
  taskId?: string; // 关联的任务ID（从Flag分享时使用）
}

// 添加评论参数
export interface AddCommentParams {
  postId: string;
  content: string;
}

const contactService = {
  getPosts: async (page: number = 1, pageSize: number = 15): Promise<PaginatedResponse<Post>> => {
    const response = await api.get<{ posts: Post[] }>('/api/getAllPosts');
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPosts = response.posts.slice(startIndex, endIndex);
    
    return {
      data: paginatedPosts,
      total: response.posts.length,
      page,
      pageSize,
      hasMore: endIndex < response.posts.length
    };
  },

  searchPosts: async (params: SearchPostsParams): Promise<PaginatedResponse<Post>> => {
    const response = await api.post<{ post: Post[] }>('/api/searchPosts', { keyword: params.query });
    const posts = response.post || [];
    const page = params.page || 1;
    const pageSize = params.pageSize || 15;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPosts = posts.slice(startIndex, endIndex);
    
    return {
      data: paginatedPosts,
      total: posts.length,
      page,
      pageSize,
      hasMore: endIndex < posts.length
    };
  },

  // 获取单个帖子详情
  getPost: (postId: string) =>
    api.get<Post>(`/api/getPost/${postId}`),

  // 创建帖子
  createPost: (params: CreatePostParams) =>
    api.post<Post>('/api/postUserPost', { 
      title: '',
      content: params.content 
    }),

  // 点赞/取消点赞帖子（后端自动切换状态）
  likePost: (postId: string) =>
    api.post<{ success: boolean; likes: number }>('/api/likepost', { 
      post_id: parseInt(postId)
    }),

  // 取消点赞（使用相同接口，后端会自动判断）
  unlikePost: (postId: string) =>
    api.post<{ success: boolean; likes: number }>('/api/likepost', { 
      post_id: parseInt(postId)
    }),

  // 添加评论
  addComment: async (params: AddCommentParams): Promise<PostComment> => {
    const response = await api.post<{ 
      success: boolean;
      id: number;
      userId: number;
      userName: string;
      userAvatar: string;
      content: string;
      createdAt: string;
    }>('/api/commentOnPost', {
      postId: parseInt(params.postId),
      content: params.content
    });
    
    return {
      id: String(response.id),
      postId: params.postId,
      userId: String(response.userId),
      userName: response.userName,
      userAvatar: response.userAvatar,
      content: response.content,
      createdAt: response.createdAt
    };
  },

  getComments: (postId: string) =>
    api.get<PostComment[]>(`/api/getComments/${postId}`),

  deleteComment: (_postId: string, commentId: string) =>
    api.delete<{ success: boolean }>('/api/deleteComment', {
      data: { comment_id: commentId }
    }),

  getUserInfo: (userId: string) =>
    api.get<UserInfo>(`/api/getUser?user_id=${userId}`),

  deletePost: (postId: string) =>
    api.delete<{ success: boolean }>('/api/deleteUserPost', {
      data: { post_id: parseInt(postId, 10) }
    }),


  createPostFromTask: async (task: { id: string; title: string; detail?: string; label?: number; startDate?: string; endDate?: string }): Promise<Post> => {
    const labelNames: Record<number, string> = {
      1: '学习提升',
      2: '健康运动',
      3: '工作效率',
      4: '兴趣爱好',
      5: '生活习惯'
    };
    
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    let dateRange = '每天';
    if (task.startDate && task.endDate) {
      dateRange = `${formatDate(task.startDate)} ~ ${formatDate(task.endDate)}`;
    } else if (task.startDate) {
      dateRange = `${formatDate(task.startDate)}开始`;
    } else if (task.endDate) {
      dateRange = `${formatDate(task.endDate)}前`;
    }
    
    const content = task.detail
      ? `我的Flag:${task.title}\n详细:${task.detail}\n类型:${labelNames[task.label || 1]}  ${dateRange}`
      : `我的Flag:${task.title}\n类型:${labelNames[task.label || 1]}  ${dateRange}`;
    return api.post<Post>('/api/postUserPost', {
      title: task.title,
      content,
      flag_id: parseInt(task.id) // 添加flag_id关联
    });
  },

  // 根据任务ID删除关联的帖子（后端可能没有这个接口）
  deletePostByTaskId: (taskId: string) =>
    api.delete<{ success: boolean }>('/api/deleteUserPost', {
      data: { task_id: parseInt(taskId, 10) }
    }),

  // P1修复：搜索用户（支持32个头像映射）
  searchUsers: async (query: string): Promise<SearchUserResult[]> => {
    const response = await api.post<{ users: Array<{
      user_id: number;
      name: string;
      email: string;
      head_show?: number;
    }> }>('/api/searchUser', { username: query });
    
    // 头像由后端提供，通过/api/avatar/:id获取
    return (response.users || []).map(user => ({
      id: user.user_id,
      name: user.name,
      email: user.email,
      avatar: user.head_show ? `/api/avatar/${user.head_show}` : ''
    }));
  },

  // 获取所有帖子（不分页）
  getAllPosts: async () => {
    return api.get<{ success: boolean; posts: Post[]; total: number }>('/api/getAllPosts');
  },

  // 获取私聊会话列表
  getPrivateConversations: async () => {
    // 路径已适配 API_BASE，无需硬编码域名
    return api.get<{ conversations: Conversation[] }>('/api/private-chat/conversations');
  },

  // 获取当前用户点过赞的帖子ID列表
  getUserLikedPosts: async (): Promise<number[]> => {
    const response = await api.get<{ liked_post_ids: number[] }>('/api/getUserLikedPosts');
    return response.liked_post_ids || [];
  },
};

export default contactService;
