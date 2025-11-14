import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Lock, LogOut, Info } from 'lucide-react';
import { 
  Card, 
  Button,
  Label,
  Separator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components";

/**
 * 系统设置页面
 * 通知、主题、隐私设置等
 */
export default function SetPage() {
  const navigate = useNavigate();
  
  // ========== 本地状态 ========== 
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [notificationHour, setNotificationHour] = useState('09');
  const [notificationMinute, setNotificationMinute] = useState('00');
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 生成小时和分钟选项
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // ========== 事件处理器 ========== 
  const handleLogout = async () => {
    try {
      const { authService } = await import('../services/auth.service');
      await authService.logout();
      localStorage.removeItem('auth_token');
      setLogoutDialogOpen(false);
      navigate('/auth');
    } catch (error) {
      console.error('登出失败:', error);
      // 即使失败也清除token并跳转
      localStorage.removeItem('auth_token');
      setLogoutDialogOpen(false);
      navigate('/auth');
    }
  };

  // P1修复：调用后端修改密码API
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    if (newPassword.length < 6) {
      alert('密码长度至少6位');
      return;
    }
    try {
      const { changePassword } = await import('../services/set.service');
      await changePassword(oldPassword, newPassword);
      alert('密码修改成功');
      setChangePasswordDialogOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('修改密码失败:', error);
      alert('修改密码失败，请检查旧密码是否正确');
    }
  };

  // P1修复：调用后端更新通知状态API
  const handleToggleNotification = async (enabled: boolean) => {
    try {
      const { updateNotificationEnabled } = await import('../services/set.service');
      await updateNotificationEnabled(enabled);
      setNotificationEnabled(enabled);
    } catch (error) {
      console.error('更新通知状态失败:', error);
    }
  };

  // P1修复：调用后端更新通知时间API
  const handleUpdateNotificationTime = async (hour: string, minute: string) => {
    try {
      const { updateNotificationTime } = await import('../services/set.service');
      await updateNotificationTime(hour, minute);
    } catch (error) {
      console.error('更新通知时间失败:', error);
    }
  };

  // ========== 渲染 ========== 
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 固定标题栏 - 与search栏相同样式 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white">
        <div className="flex h-16 items-center px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => navigate('/mine')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">系统设置</h1>
        </div>
      </nav>

      {/* 可滚动内容区域 - 添加顶部padding避免被固定标题遮挡 */}
      <div className="flex-1 pb-8 space-y-3 pt-20 px-4">
        {/* 推送通知 */}
        <Card className="p-4 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">推送通知</h3>
                <p className="text-xs text-muted-foreground">接收打卡提醒和任务通知</p>
              </div>
            </div>
            <button
              onClick={() => handleToggleNotification(!notificationEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationEnabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="text-sm font-medium">通知时间</Label>
            <div className="flex gap-2">
              <Select value={notificationHour} onValueChange={(hour) => { setNotificationHour(hour); handleUpdateNotificationTime(hour, notificationMinute); }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="时" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="flex items-center text-lg font-medium">:</span>
              <Select value={notificationMinute} onValueChange={(minute) => { setNotificationMinute(minute); handleUpdateNotificationTime(notificationHour, minute); }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="分" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {minutes.map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">设置每日打卡提醒时间</p>
          </div>
        </Card>

        {/* 修改密码 */}
        <Card 
          className="p-4 rounded-xl cursor-pointer active:scale-[0.98] transition-transform hover:bg-slate-50"
          onClick={() => setChangePasswordDialogOpen(true)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <Lock className="h-5 w-5 text-slate-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">修改密码</h3>
              <p className="text-xs text-muted-foreground">定期修改密码保护账户安全</p>
            </div>
          </div>
        </Card>

        {/* 关于我们 - 使用Accordion */}
        <Card className="p-4 rounded-xl">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="about" className="border-none">
              <AccordionTrigger className="hover:no-underline p-0">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-green-50">
                    <Info className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium">关于我们</h3>
                    <p className="text-xs text-muted-foreground">版本信息与协议</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-3 pl-11">
                  <div>
                    <h4 className="text-sm font-medium mb-1">版本信息</h4>
                    <p className="text-xs text-muted-foreground">知序 v1.0.0</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <button className="text-sm text-blue-600 hover:underline block">
                      用户协议
                    </button>
                    <button className="text-sm text-blue-600 hover:underline block">
                      隐私政策
                    </button>
                    <button className="text-sm text-blue-600 hover:underline block">
                      开源许可
                    </button>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-1">联系我们</h4>
                    <p className="text-xs text-muted-foreground">support@zhixu.com</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        {/* 退出登录 */}
        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
            onClick={() => setLogoutDialogOpen(true)}
          >
            <LogOut className="h-4 w-4 mr-2" />
            退出登录
          </Button>
        </div>
      </div>

      {/* 退出登录确认 Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="rounded-3xl max-w-[320px] mx-4">
          <DialogHeader>
            <DialogTitle>确认退出</DialogTitle>
            <DialogDescription>
              确定要退出登录吗？退出后需要重新登录才能使用。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              className="rounded-full px-4 py-2 my-1 min-w-[80px] border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={() => setLogoutDialogOpen(false)}
            >
              取消
            </Button>
            <Button 
              variant="destructive" 
              className="rounded-full px-4 py-2 my-1 min-w-[80px] text-white"
              onClick={handleLogout}
            >
              确认退出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 修改密码 Dialog */}
      <Dialog open={changePasswordDialogOpen} onOpenChange={setChangePasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[calc(100vw-2rem)] rounded-3xl">
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
            <DialogDescription>
              请输入旧密码和新密码。新密码长度至少6位。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="old-password">旧密码</Label>
              <Input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入旧密码"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">新密码</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">确认新密码</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              className="rounded-full px-4 py-2 my-1 min-w-[80px] border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={() => {
                setChangePasswordDialogOpen(false);
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
            >
              取消
            </Button>
            <Button 
              className="rounded-full px-4 py-2 my-1 min-w-[80px]"
              onClick={handleChangePassword}
            >
              确认修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
