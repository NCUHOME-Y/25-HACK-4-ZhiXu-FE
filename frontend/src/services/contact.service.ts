import { api } from './apiClient';

// 帖子接口类型
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
  // 获取帖子列表（分页）
  getPosts: async (page: number = 1, pageSize: number = 15): Promise<PaginatedResponse<Post>> => {
    const response = await api.get<{ posts: Post[] }>('/api/getAllPosts');
    // 模拟分页
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

  // 搜索帖子
  searchPosts: async (params: SearchPostsParams): Promise<PaginatedResponse<Post>> => {
    const response = await api.post<{ posts: Post[] }>('/api/searchPosts', { query: params.query });
    // 模拟分页
    const page = params.page || 1;
    const pageSize = params.pageSize || 15;
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
    await api.post<{ success: boolean }>('/api/commentOnPost', {
      post_id: parseInt(params.postId),
      content: params.content
    });
    
    // 后端只返回 success，前端需要构造评论对象
    // 注意：实际使用时应该重新获取评论列表或让后端返回完整对象
    return {
      id: String(Date.now()),
      postId: params.postId,
      userId: 'current_user',
      userName: '当前用户',
      userAvatar: '/default-avatar.png',
      content: params.content,
      createdAt: new Date().toISOString()
    };
  },

  // 获取帖子的评论列表
  getComments: (postId: string) =>
    api.get<PostComment[]>(`/api/getComments/${postId}`),

  // 删除评论
  deleteComment: (_postId: string, commentId: string) =>
    api.delete<{ success: boolean }>('/api/deleteComment', {
      data: { comment_id: commentId }
    }),

  // 获取用户信息（后端可能没有这个接口）
  getUserInfo: (userId: string) =>
    api.get<UserInfo>(`/api/getUser?user_id=${userId}`),

  // 删除帖子
  deletePost: (postId: string) =>
    api.delete<{ success: boolean }>('/api/deleteUserPost', {
      data: { post_id: postId }
    }),

  // 从Flag创建帖子（分享Flag到社交页面）
  createPostFromTask: async (task: { id: string; title: string; detail?: string; label?: number; priority?: number }): Promise<Post> => {
    const labelNames: Record<number, string> = {
      1: '学习提升',
      2: '健康运动',
      3: '工作效率',
      4: '兴趣爱好',
      5: '生活习惯'
    };
    const priorityNames: Record<number, string> = {
      1: '急切',
      2: '较急',
      3: '一般',
      4: '不急'
    };
    
    const content = `【我的Flag】${task.title}\n${task.detail || ''}\n\n标签: ${labelNames[task.label || 1]} | 优先级: ${priorityNames[task.priority || 3]}`;
    return api.post<Post>('/api/postUserPost', {
      title: task.title,
      content,
      task_id: task.id
    });
  },

  // 根据任务ID删除关联的帖子（后端可能没有这个接口）
  deletePostByTaskId: (taskId: string) =>
    api.delete<{ success: boolean }>('/api/deleteUserPost', {
      data: { task_id: taskId }
    }),

  // P1修复：搜索用户
  searchUsers: async (query: string): Promise<SearchUserResult[]> => {
    const response = await api.post<{ users: SearchUserResult[] }>('/api/searchUser', { query });
    return response.users || [];
  },
};

export default contactService;
