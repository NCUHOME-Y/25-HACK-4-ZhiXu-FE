import apiClient from './apiClient';

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
}

// 添加评论参数
export interface AddCommentParams {
  postId: string;
  content: string;
}

const contactService = {
  // 获取帖子列表（分页）
  getPosts: async (page: number = 1, pageSize: number = 15): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get('/posts', {
      params: { page, pageSize }
    });
    return response.data;
  },

  // 搜索帖子
  searchPosts: async (params: SearchPostsParams): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get('/posts/search', {
      params: {
        query: params.query,
        page: params.page || 1,
        pageSize: params.pageSize || 15
      }
    });
    return response.data;
  },

  // 获取单个帖子详情
  getPost: async (postId: string): Promise<Post> => {
    const response = await apiClient.get(`/posts/${postId}`);
    return response.data;
  },

  // 创建帖子
  createPost: async (params: CreatePostParams): Promise<Post> => {
    const response = await apiClient.post('/posts', params);
    return response.data;
  },

  // 点赞帖子
  likePost: async (postId: string): Promise<{ success: boolean; likes: number }> => {
    const response = await apiClient.post(`/posts/${postId}/like`);
    return response.data;
  },

  // 取消点赞
  unlikePost: async (postId: string): Promise<{ success: boolean; likes: number }> => {
    const response = await apiClient.delete(`/posts/${postId}/like`);
    return response.data;
  },

  // 添加评论
  addComment: async (params: AddCommentParams): Promise<PostComment> => {
    const response = await apiClient.post(`/posts/${params.postId}/comments`, {
      content: params.content
    });
    return response.data;
  },

  // 获取帖子的评论列表
  getComments: async (postId: string): Promise<PostComment[]> => {
    const response = await apiClient.get(`/posts/${postId}/comments`);
    return response.data;
  },

  // 删除评论
  deleteComment: async (postId: string, commentId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/posts/${postId}/comments/${commentId}`);
    return response.data;
  },

  // 获取用户信息
  getUserInfo: async (userId: string): Promise<UserInfo> => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  // 删除帖子
  deletePost: async (postId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/posts/${postId}`);
    return response.data;
  }
};

export default contactService;
