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
    // 如果在登录/注册页面或数据页面，不跳转，让页面自己处理错误
    const currentPath = window.location.pathname;
    if (currentPath === '/auth' || currentPath === '/' || currentPath === '/data') {
      console.log('[错误处理] 在认证/数据页面,网络错误不跳转');
      return;
    }
    console.warn('[错误处理] 网络错误，但不跳转错误页面，静默处理');
    return;
  }

  const status = error.response.status;

  // 根据状态码跳转到对应错误页面
  if (status === 401) {
    // 如果在登录页面或注册页面，不跳转，让表单显示错误消息
    const currentPath = window.location.pathname;
    console.log('[错误处理] 收到401错误, 当前路径:', currentPath);
    if (currentPath === '/auth' || currentPath === '/') {
      console.log('[错误处理] 在认证页面,401错误不跳转,显示错误提示');
      console.error('认证失败:', error.response.data);
      return;
    }
    // 只有在已登录状态下的401才清除token并跳转
    console.log('[错误处理] 不在认证页面,清除token并跳转到登录页');
    localStorage.removeItem('auth_token');
    window.location.href = '/auth';
  } else if (status === 404) {
    // 如果在登录页面或注册页面，不跳转，让表单显示错误消息
    const currentPath = window.location.pathname;
    console.log('[错误处理] 收到404错误, 当前路径:', currentPath);
    if (currentPath === '/auth' || currentPath === '/' || currentPath === '/data') {
      console.log('[错误处理] 在认证/数据页面,404错误不跳转,显示错误提示');
      console.error('资源未找到:', error.response.data);
      return;
    }
    // 404错误也不跳转，让调用方处理
    console.log('[错误处理] 404错误,不跳转，让调用方处理');
    console.error('资源未找到:', error.response.data);
    return;
  } else if (status === 400) {
    // 如果在登录页面或注册页面，不跳转，让表单显示错误消息
    const currentPath = window.location.pathname;
    console.log('[错误处理] 收到400错误, 当前路径:', currentPath);
    if (currentPath === '/auth' || currentPath === '/' || currentPath === '/data') {
      console.log('[错误处理] 在认证/数据页面,400错误不跳转,显示错误提示');
      console.error('请求错误:', error.response.data);
      return;
    }
    // 不在认证页面的400错误也不跳转,让调用方处理
    console.log('[错误处理] 400错误,不跳转');
    return;
  } else if (status >= 500) {
    // 如果在登录页面或注册页面，不跳转，让表单显示错误消息
    const currentPath = window.location.pathname;
    console.log('[错误处理] 收到500+错误, 当前路径:', currentPath);
    if (currentPath === '/auth' || currentPath === '/' || currentPath === '/data') {
      console.log('[错误处理] 在认证/数据页面,500错误不跳转,显示错误提示');
      console.error('服务器错误:', error.response.data);
      return;
    }
    console.warn('[错误处理] 服务器错误，但不跳转错误页面，静默处理');
    return;
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
  localStorage.removeItem('auth_token');
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
