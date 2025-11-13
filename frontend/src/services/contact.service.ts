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
  getPosts: (page: number = 1, pageSize: number = 15) =>
    api.get<PaginatedResponse<Post>>('/posts', {
      params: { page, pageSize }
    }),

  // 搜索帖子
  searchPosts: (params: SearchPostsParams) =>
    api.get<PaginatedResponse<Post>>('/posts/search', {
      params: {
        query: params.query,
        page: params.page || 1,
        pageSize: params.pageSize || 15
      }
    }),

  // 获取单个帖子详情
  getPost: (postId: string) =>
    api.get<Post>(`/posts/${postId}`),

  // 创建帖子
  createPost: (params: CreatePostParams) =>
    api.post<Post>('/posts', params),

  // 点赞帖子
  likePost: (postId: string) =>
    api.post<{ success: boolean; likes: number }>(`/posts/${postId}/like`),

  // 取消点赞
  unlikePost: (postId: string) =>
    api.delete<{ success: boolean; likes: number }>(`/posts/${postId}/like`),

  // 添加评论
  addComment: (params: AddCommentParams) =>
    api.post<PostComment>(`/posts/${params.postId}/comments`, {
      content: params.content
    }),

  // 获取帖子的评论列表
  getComments: (postId: string) =>
    api.get<PostComment[]>(`/posts/${postId}/comments`),

  // 删除评论
  deleteComment: (postId: string, commentId: string) =>
    api.delete<{ success: boolean }>(`/posts/${postId}/comments/${commentId}`),

  // 获取用户信息
  getUserInfo: (userId: string) =>
    api.get<UserInfo>(`/users/${userId}`),

  // 删除帖子
  deletePost: (postId: string) =>
    api.delete<{ success: boolean }>(`/posts/${postId}`),

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
    return api.post<Post>('/posts', {
      content,
      taskId: task.id
    });
  },

  // 根据任务ID删除关联的帖子
  deletePostByTaskId: (taskId: string) =>
    api.delete<{ success: boolean }>(`/posts/task/${taskId}`)
};

export default contactService;
