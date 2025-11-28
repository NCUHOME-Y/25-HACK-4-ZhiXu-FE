import { useState, useEffect } from 'react';
import { Button, Card } from "../components";
import { API_BASE, makeWsUrl } from '../services/apiClient';
import authService from '../services/auth.service';

/**
 * WebSocket连接测试页面
 * 用于诊断移动端WebSocket连接问题
 */
export default function WebSocketTestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [wsStatus, setWsStatus] = useState<'未连接' | '连接中' | '已连接' | '连接失败'>('未连接');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('zh-CN');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    // 显示环境信息
    addLog('=== 环境信息 ===');
    addLog(`当前URL: ${window.location.href}`);
    addLog(`API_BASE: ${API_BASE}`);
    addLog(`User Agent: ${navigator.userAgent}`);
    addLog(`是否移动设备: ${/Mobile|Android|iPhone/i.test(navigator.userAgent)}`);
    
    const token = authService.getToken();
    addLog(`Token存在: ${!!token}`);
    if (token) {
      addLog(`Token长度: ${token.length}`);
      addLog(`Token前10位: ${token.substring(0, 10)}...`);
    }
  }, []);

  const testWebSocket = () => {
    setLogs([]);
    addLog('=== 开始WebSocket连接测试 ===');
    
    const token = authService.getToken();
    if (!token) {
      addLog('❌ 错误: 未找到token');
      setWsStatus('连接失败');
      return;
    }

    const roomId = 'room-1';
    const wsUrl = makeWsUrl(`/ws/chat?room_id=${roomId}&token=${token}`);
    addLog(`WebSocket URL: ${wsUrl.replace(/token=.*/, 'token=***')}`);
    
    setWsStatus('连接中');
    
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      addLog('✅ WebSocket对象创建成功');
    } catch (error) {
      addLog(`❌ WebSocket创建失败: ${error}`);
      setWsStatus('连接失败');
      return;
    }

    const timeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        addLog('⏱️ 连接超时（10秒）');
        ws.close();
        setWsStatus('连接失败');
      }
    }, 10000);

    ws.onopen = () => {
      clearTimeout(timeout);
      addLog('✅ WebSocket连接成功！');
      addLog(`ReadyState: ${ws.readyState} (OPEN)`);
      setWsStatus('已连接');
      
      // 测试发送消息
      setTimeout(() => {
        try {
          const testMsg = JSON.stringify({ content: '测试消息', to: 0 });
          ws.send(testMsg);
          addLog('📤 发送测试消息成功');
        } catch (error) {
          addLog(`❌ 发送消息失败: ${error}`);
        }
      }, 1000);
    };

    ws.onmessage = (event) => {
      addLog(`📨 收到消息: ${event.data}`);
    };

    ws.onerror = (error) => {
      clearTimeout(timeout);
      addLog(`❌ WebSocket错误: ${error}`);
      addLog(`ReadyState: ${ws.readyState}`);
      setWsStatus('连接失败');
    };

    ws.onclose = (event) => {
      clearTimeout(timeout);
      addLog(`🔌 WebSocket关闭`);
      addLog(`关闭代码: ${event.code}`);
      addLog(`关闭原因: ${event.reason || '无'}`);
      addLog(`是否正常关闭: ${event.wasClean}`);
      
      if (wsStatus === '连接中') {
        setWsStatus('连接失败');
      }
    };

    // 5秒后自动关闭
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        addLog('⏰ 测试完成，关闭连接');
        ws.close(1000, '测试完成');
      }
    }, 5000);
  };

  const testHttpApi = async () => {
    addLog('=== 测试HTTP API连接 ===');
    try {
      const { api } = await import('../services/apiClient');
      addLog('📡 请求 /api/chat/rooms...');
      const response = await api.get('/api/chat/rooms');
      addLog(`✅ HTTP请求成功`);
      addLog(`响应数据: ${JSON.stringify(response).substring(0, 100)}...`);
    } catch (error: unknown) {
      addLog(`❌ HTTP请求失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const copyLogs = () => {
    const logsText = logs.join('\n');
    navigator.clipboard.writeText(logsText).then(() => {
      alert('日志已复制到剪贴板');
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto w-full space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">WebSocket 连接测试</h1>
        
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">连接状态:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                wsStatus === '已连接' ? 'bg-green-100 text-green-700' :
                wsStatus === '连接中' ? 'bg-yellow-100 text-yellow-700' :
                wsStatus === '连接失败' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {wsStatus}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={testWebSocket} className="flex-1">
                测试WebSocket连接
              </Button>
              <Button onClick={testHttpApi} variant="outline" className="flex-1">
                测试HTTP API
              </Button>
            </div>
            
            <Button onClick={copyLogs} variant="outline" className="w-full">
              复制日志
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-3">连接日志</h2>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">点击"测试WebSocket连接"开始测试...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-4 bg-blue-50">
          <h3 className="font-semibold text-blue-900 mb-2">诊断提示</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 如果连接超时：检查后端服务是否启动</li>
            <li>• 如果立即失败：检查WebSocket URL是否正确</li>
            <li>• 如果Token错误：尝试重新登录</li>
            <li>• 移动端问题：确保使用HTTPS和WSS协议</li>
            <li>• 网络问题：检查防火墙和网络设置</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
