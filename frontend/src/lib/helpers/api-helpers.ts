/** API 辅助函数 - 减少 service 层的重复代码 */

import type { AxiosInstance, AxiosRequestConfig } from 'axios';

/** 创建统一的 API 调用包装器 */
export function createApiWrapper(client: AxiosInstance) {
  return {
    /** GET 请求并返回 data */
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
      const response = await client.get<T>(url, config);
      return response.data;
    },

    /** POST 请求并返回 data */
    async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
      const response = await client.post<T>(url, data, config);
      return response.data;
    },

    /** PUT 请求并返回 data */
    async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
      const response = await client.put<T>(url, data, config);
      return response.data;
    },

    /** DELETE 请求并返回 data */
    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
      const response = await client.delete<T>(url, config);
      return response.data;
    },

    /** PATCH 请求并返回 data */
    async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
      const response = await client.patch<T>(url, data, config);
      return response.data;
    },
  };
}

/** 错误处理包装器 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage = '操作失败'
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(errorMessage, error);
    throw error;
  }
}

/**
 * 批量操作辅助函数
 */
export async function batchOperation<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  onProgress?: (completed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i++) {
    const result = await operation(items[i]);
    results.push(result);
    onProgress?.(i + 1, items.length);
  }
  return results;
}

/**
 * 重试机制
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
}
