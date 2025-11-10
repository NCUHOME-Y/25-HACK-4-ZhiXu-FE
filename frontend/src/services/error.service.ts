import type { AxiosError } from 'axios';

/**
 * 错误处理服务
 * 集中处理各种错误场景的跳转和提示
 */

/**
 * 处理API请求错误
 * 根据错误状态码跳转到相应的错误页面
 */
export function handleApiError(error: AxiosError): void {
  // 网络错误
  if (!error.response) {
    window.location.href = '/error?status=network&message=网络连接失败';
    return;
  }

  const status = error.response.status;

  // 根据状态码跳转到对应错误页面
  if (status === 401) {
    localStorage.removeItem('authToken');
    window.location.href = '/error?status=401';
  } else if (status === 404) {
    window.location.href = '/error?status=404';
  } else if (status >= 500) {
    window.location.href = '/error?status=500';
  }
}

/**
 * 处理通用错误
 * 显示错误提示并可选择是否跳转
 */
export function handleGeneralError(message: string, shouldRedirect = false): void {
  console.error(message);
  
  if (shouldRedirect) {
    window.location.href = `/error?status=500&message=${encodeURIComponent(message)}`;
  }
}

/**
 * 清除认证信息并跳转到登录页
 */
export function handleUnauthorized(): void {
  localStorage.removeItem('authToken');
  window.location.href = '/error?status=401';
}

/**
 * 处理404错误
 */
export function handleNotFound(resource?: string): void {
  const message = resource ? `未找到${resource}` : '页面不存在';
  window.location.href = `/error?status=404&message=${encodeURIComponent(message)}`;
}

/**
 * 处理服务器错误
 */
export function handleServerError(message?: string): void {
  const errorMessage = message || '服务器错误，请稍后重试';
  window.location.href = `/error?status=500&message=${encodeURIComponent(errorMessage)}`;
}
