import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../services/apiClient"
import { authService } from "../services/auth.service"
import {
  LoginForm,
  SignupForm,
  OTPForm,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Spinner,
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "../components"

type AuthMode = "login" | "signup" | "otp" | "otp-input" | "forgot-password" | "reset-password" // P1修复：添加忘记密码模式

/**
 * 认证页面
 * 支持账号密码登录、注册、验证码登录等方式
 */
export default function AuthPage() {
  const navigate = useNavigate()
  
  const [mode, setMode] = useState<AuthMode>("login")
  // 当前手机号（用于跨步骤保留）
  const [phone, setPhone] = useState("")
  // OTP 手机号输入（验证码登录专用）
  const [otpPhone, setOtpPhone] = useState("")
  // 是否已发送验证码
  const [otpSent, setOtpSent] = useState(false)
  // OTP使用场景：login（验证码登录）或 signup（注册验证）
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'signup'>('login')
  // 临时存储注册信息，等待验证码验证后再提交
  const [pendingSignupData, setPendingSignupData] = useState<{ name: string; email: string; password: string } | null>(null)
  
  // P1修复：忘记密码相关状态
  const [forgotEmail, setForgotEmail] = useState("")
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  
  // 加载状态
  const [sendingOTP, setSendingOTP] = useState(false)
  const [verifyingOTP, setVerifyingOTP] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [sendingResetCode, setSendingResetCode] = useState(false) // P1修复：发送重置验证码
  const [resettingPassword, setResettingPassword] = useState(false) // P1修复：重置密码
  
  // 控制提示对话框
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [alertMessage, setAlertMessage] = useState("请先输入手机号")
  
  // 登录错误状态
  const [loginError, setLoginError] = useState<string>("")
  
  // 注册错误状态
  const [signupError, setSignupError] = useState<string>("")
  
  // 忘记密码错误状态
  const [forgotPasswordError, setForgotPasswordError] = useState<string>("")
  const [resetPasswordError, setResetPasswordError] = useState<string>("")
  
  // 验证码倒计时状态
  const [resendCooldown, setResendCooldown] = useState(0) // 重新发送验证码的冷却时间(秒)
  const [resetCodeCooldown, setResetCodeCooldown] = useState(0) // 重置密码验证码的冷却时间(秒)
  
  // 强密码验证函数
  const validateStrongPassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: "密码至少需要 8 个字符" }
    }
    
    let typeCount = 0
    if (/[a-z]/.test(password)) typeCount++ // 小写字母
    if (/[A-Z]/.test(password)) typeCount++ // 大写字母
    if (/[0-9]/.test(password)) typeCount++ // 数字
    if (/[^a-zA-Z0-9]/.test(password)) typeCount++ // 特殊符号
    
    if (typeCount < 3) {
      return { valid: false, message: "密码需要包含大写字母、小写字母、数字、特殊符号中的至少三种" }
    }
    
    return { valid: true, message: "" }
  }

  // 倒计时定时器
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])
  
  useEffect(() => {
    if (resetCodeCooldown > 0) {
      const timer = setTimeout(() => {
        setResetCodeCooldown(resetCodeCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resetCodeCooldown])

  /** 切换到验证码页面(从登录) */
  const switchToOTPFromLogin = () => {
    // 直接进入验证码登录的邮箱输入页
    setMode("otp")
    setOtpPhone("")
    setOtpSent(false)
    setOtpPurpose('login') // 设置为验证码登录
    setLoginError("") // 清除登录错误信息
  }

  /** 发送验证码 */
  const handleSendOTP = async () => {
    // 防止重复发送
    if (sendingOTP || resendCooldown > 0) {
      return;
    }
    
    const value = otpPhone.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    
    if (!value) {
      setAlertMessage("请先输入邮箱");
      setShowAlertDialog(true);
      return;
    }
    if (!isValidEmail) {
      setAlertMessage("请输入有效的邮箱地址");
      setShowAlertDialog(true);
      return;
    }
    
    setSendingOTP(true)
    try {
      // P1修复：调用后端发送邮箱验证码API
      const result = await authService.sendEmailCode(value)
      if (result.success) {
        setPhone(value)
        setOtpSent(true)
        setResendCooldown(60) // 设置60秒冷却时间
        setAlertMessage("验证码已发送至邮箱，请检查收件箱或垃圾箱")
        setShowAlertDialog(true)
      } else {
        // 如果是429错误，设置倒计时
        if (result.waitSeconds) {
          setResendCooldown(result.waitSeconds)
        }
        setAlertMessage(result.message)
        setShowAlertDialog(true)
      }
    } catch {
      setAlertMessage("发送验证码失败，请重试")
      setShowAlertDialog(true)
    } finally {
      setSendingOTP(false)
    }
  }

  /** 切换到验证码页面(从注册) */
  const switchToOTPFromSignup = async () => {
    // 读取注册表单的各字段并做最小校验（不改子组件，使用 DOM 读取）
    const nameInput = document.getElementById("name") as HTMLInputElement | null
    const emailInput = document.getElementById("email") as HTMLInputElement | null
    const pwdInput = document.getElementById("password") as HTMLInputElement | null
    const confirmInput = document.getElementById("confirm-password") as HTMLInputElement | null

    const name = nameInput?.value?.trim() ?? ""
    const value = emailInput?.value?.trim() ?? ""
    const pwd = pwdInput?.value ?? ""
    const confirm = confirmInput?.value ?? ""

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

    setSignupError("") // 清除之前的错误
    
    if (!name || !value || !pwd || !confirm) {
      setSignupError("请完整填写注册信息")
      return
    }
    if (!isValidEmail) {
      setSignupError("请输入有效的邮箱地址")
      return
    }
    
    // 强密码验证
    const passwordValidation = validateStrongPassword(pwd)
    if (!passwordValidation.valid) {
      setSignupError(passwordValidation.message)
      return
    }
    
    if (pwd !== confirm) {
      setSignupError("两次输入的密码不一致")
      return
    }

    // 第一步：只发送验证码，不创建用户
    setSendingOTP(true)
    try {
      const response = await api.post('/api/register', {
        name: name,
        email: value,
        password: pwd
      })
      
      if (response) {
        // 暂存注册信息，等待验证码验证
        setPendingSignupData({
          name: name,
          email: value,
          password: pwd
        })
        // 切换到验证码输入页面
        setPhone(value)
        setOtpPurpose('signup') // 设置为注册验证
        setOtpSent(true) // 标记验证码已发送
        setMode("otp")
      }
    } catch (error) {
      console.error('发送验证码失败:', error)
      let errorMessage = "发送验证码失败，请重试"
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } }
        errorMessage = axiosError.response?.data?.error || errorMessage
      }
      setSignupError(errorMessage)
    } finally {
      setSendingOTP(false)
    }
  }

  /** 处理登录 */
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    setLoggingIn(true)
    setLoginError("") // 清除之前的错误
    
    try {
      // P1修复：调用后端登录API
      const emailInput = document.getElementById("email") as HTMLInputElement | null
      const passwordInput = document.getElementById("password") as HTMLInputElement | null
      
      const email = emailInput?.value?.trim() ?? ""
      const password = passwordInput?.value ?? ""
      
      if (!email || !password) {
        setLoginError("请输入邮箱和密码")
        setLoggingIn(false)
        return
      }
      
      const result = await authService.login({ email, password })
      
      if (result.user) {
        // 补充头像信息：读取后端 headShow 转为 /api/avatar/:id
        try {
          const u = await api.get<{ user: { userId: number; name: string; email: string; headShow?: number } }>('/api/getUser');
          const avatarPath = u?.user?.headShow ? `/api/avatar/${u.user.headShow}` : '';
          localStorage.setItem('user', JSON.stringify({ ...result.user, avatar: avatarPath }));
        } catch {
          localStorage.setItem('user', JSON.stringify(result.user));
        }
        // 登录成功后跳转到打卡页面
        navigate("/flag")
      } else {
        setLoginError("登录失败，请检查邮箱和密码")
      }
    } catch (error) {
      console.error('登录失败:', error)
      let errorMessage = "登录失败，请检查邮箱和密码"
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } }
        errorMessage = axiosError.response?.data?.error || errorMessage
      }
      setLoginError(errorMessage)
    } finally {
      setLoggingIn(false)
    }
  }

  /** 验证码登录处理 */
  const handleOTPLogin = async () => {
    setVerifyingOTP(true)
    try {
      const otpInput = document.querySelector('[id="otp"]') as HTMLInputElement | null
      const code = otpInput?.value ?? ""
      
      if (!code || code.length !== 6) {
        setLoginError("请输入完整的6位验证码")
        setVerifyingOTP(false)
        return
      }
      
      const result = await authService.loginWithOTP(phone, code)
      
      if (result.user) {
        try {
          const u = await api.get<{ user: { userId: number; name: string; email: string; headShow?: number } }>('/api/getUser');
          const avatarPath = u?.user?.headShow ? `/api/avatar/${u.user.headShow}` : '';
          localStorage.setItem('user', JSON.stringify({ ...result.user, avatar: avatarPath }));
        } catch {
          localStorage.setItem('user', JSON.stringify(result.user));
        }
        navigate("/flag")
      }
    } catch (error) {
      console.error('验证码登录失败:', error)
      let errorMessage = "验证码登录失败"
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } }
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error
        }
      }
      setLoginError(errorMessage)
    } finally {
      setVerifyingOTP(false)
    }
  }

  /** 验证码验证成功后的处理（用于注册）*/
  const handleOTPVerificationSuccess = async () => {
    setVerifyingOTP(true)
    setSignupError("") // 清除之前的错误
    try {
      const otpInput = document.querySelector('[id="otp"]') as HTMLInputElement | null
      const code = otpInput?.value ?? ""
      
      if (!code || code.length !== 6) {
        setSignupError("请输入完整的6位验证码")
        setVerifyingOTP(false)
        return
      }

      // 检查是否有待提交的注册信息
      if (!pendingSignupData) {
        setSignupError("注册信息丢失，请重新注册")
        setMode('signup')
        setVerifyingOTP(false)
        return
      }
      
      // 第二步：验证验证码并完成注册
      const result = await authService.completeRegistration({
        name: pendingSignupData.name,
        email: pendingSignupData.email,
        password: pendingSignupData.password,
        code: code
      })
      
      if (result.user && result.token) {
        // 清除临时数据
        setPendingSignupData(null)
        
        try {
          const u = await api.get<{ user: { userId: number; name: string; email: string; headShow?: number } }>('/api/getUser');
          const avatarPath = u?.user?.headShow ? `/api/avatar/${u.user.headShow}` : '';
          localStorage.setItem('user', JSON.stringify({ ...result.user, avatar: avatarPath }));
        } catch {
          localStorage.setItem('user', JSON.stringify(result.user));
        }
        // 注册成功，已自动登录，跳转到打卡页面
        navigate("/flag")
      } else {
        setSignupError("注册失败，请重试")
      }
    } catch (error) {
      console.error('完成注册失败:', error)
      let errorMessage = "注册失败，请重试"
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } }
        errorMessage = axiosError.response?.data?.error || errorMessage
      }
      setSignupError(errorMessage)
    } finally {
      setVerifyingOTP(false)
    }
  }

  /** P1修复：发送邮箱验证码（忘记密码）*/
  const handleSendResetCode = async () => {
    const value = forgotEmail.trim()
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    
    setForgotPasswordError("") // 清除之前的错误
    
    if (!value) {
      setForgotPasswordError("请先输入邮箱")
      return
    }
    if (!isValidEmail) {
      setForgotPasswordError("请输入有效的邮箱地址")
      return
    }
    
    setSendingResetCode(true)
    try {
      const result = await authService.sendEmailCode(value)
      if (result.success) {
        setAlertMessage("验证码已发送至邮箱，请检查收件箱或垃圾箱")
        setShowAlertDialog(true)
        setMode("reset-password")
        setResetCodeCooldown(60) // 设置60秒冷却时间
      } else {
        // 如果是429错误，设置倒计时
        if (result.waitSeconds) {
          setResetCodeCooldown(result.waitSeconds)
        }
        setForgotPasswordError(result.message)
      }
    } catch {
      setForgotPasswordError("发送验证码失败，请重试")
    } finally {
      setSendingResetCode(false)
    }
  }

  /** P1修复：重置密码 */
  const handleResetPassword = async () => {
    setResetPasswordError("") // 清除之前的错误
    
    if (!resetCode.trim()) {
      setResetPasswordError("请输入验证码")
      return
    }
    if (!newPassword || newPassword.length < 8) {
      setResetPasswordError("密码长度至少需要8个字符")
      return
    }
    
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
    const typeCount = [hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (typeCount < 3) {
      setResetPasswordError("密码必须包含大写字母、小写字母、数字、特殊符号中的至少三种")
      return
    }
    if (newPassword !== confirmNewPassword) {
      setResetPasswordError("两次输入的密码不一致")
      return
    }
    
    setResettingPassword(true)
    try {
      const result = await authService.resetPassword(forgotEmail, resetCode, newPassword)
      if (result.success) {
        setAlertMessage("密码重置成功，请登录")
        setShowAlertDialog(true)
        setMode("login")
        setForgotEmail("")
        setResetCode("")
        setNewPassword("")
        setConfirmNewPassword("")
      } else {
        setResetPasswordError(result.message)
      }
    } catch {
      setResetPasswordError("密码重置失败，请重试")
    } finally {
      setResettingPassword(false)
    }
  }

  // ========== 渲染 ==========
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-sm">
        {/* 登录表单 */}
        {mode === "login" && (
          <LoginForm
            onSwitchToSignup={() => {
              setMode("signup")
              setLoginError("") // 清除登录错误
            }}
            onSwitchToOTP={switchToOTPFromLogin}
            onForgotPassword={() => {
              setMode("forgot-password")
              setLoginError("") // 清除登录错误
            }}
            onSubmit={handleLogin}
            loading={loggingIn}
            error={loginError}
          />
        )}

        {/* 注册表单 */}
        {mode === "signup" && (
          <SignupForm
            onSwitchToLogin={() => {
              setMode("login")
              setSignupError("") // 清除注册错误
            }}
            onSwitchToOTP={switchToOTPFromSignup}
            error={signupError}
          />
        )}

        {/* 验证码表单 */}
        {mode === "otp" && !otpSent && (
          <Card className="bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl rounded-[2rem]">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-slate-900">邮箱验证</CardTitle>
              <CardDescription className="text-slate-600">
                输入您的邮箱以接收验证码
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                {/* 错误提示 */}
                {(otpPurpose === 'login' ? loginError : signupError) && (
                  <div className="rounded-2xl bg-red-50 border border-red-200/50 p-4 text-sm text-red-700 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">⚠️</span>
                      <span>{otpPurpose === 'login' ? loginError : signupError}</span>
                    </div>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="otp-email">邮箱</Label>
                  <Input
                    id="otp-email"
                    type="email"
                    placeholder="请输入邮箱"
                    value={otpPhone}
                    onChange={(e) => setOtpPhone(e.target.value)}
                    required
                    className="rounded-[1.5rem] border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <Button 
                  className="w-full rounded-3xl bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg" 
                  type="button"
                  disabled={sendingOTP || resendCooldown > 0}
                  onClick={handleSendOTP}
                >
                  {sendingOTP && <Spinner className="mr-2" />}
                  {sendingOTP 
                    ? "发送中..." 
                    : resendCooldown > 0 
                    ? `重新发送 (${resendCooldown}秒)` 
                    : "发送验证码"}
                </Button>
                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login")
                      setLoginError("") // 清除登录错误
                      setSignupError("") // 清除注册错误
                    }}
                    className="text-blue-600 hover:text-blue-700 underline underline-offset-4 transition-colors duration-200 hover:scale-105"
                  >
                    返回登录
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 验证码输入表单 */}
        {mode === "otp" && otpSent && (
          <div className="space-y-3">
            {/* 显示当前邮箱 */}
            {phone && (
              <div className="text-center p-3 rounded-2xl bg-blue-50 border border-blue-200/50">
                <p className="text-sm text-blue-700 font-medium">
                  📧 验证码已发送至：{phone}
                </p>
              </div>
            )}
            <OTPForm
              onSwitchToLogin={() => {
                setMode("login")
                setOtpSent(false)
                setOtpPhone("")
                setVerifyingOTP(false)
                setLoginError("") // 清除登录错误
                setSignupError("") // 清除注册错误
              }}
              onVerificationSuccess={otpPurpose === 'login' ? handleOTPLogin : handleOTPVerificationSuccess}
              onResend={handleSendOTP}
              error={otpPurpose === 'login' ? loginError : signupError}
              loading={verifyingOTP}
              resendCooldown={resendCooldown}
            />
          </div>
        )}

        {/* P1修复：忘记密码 - 输入邮箱 */}
        {mode === "forgot-password" && (
          <Card className="bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl rounded-[2rem]">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-slate-900">忘记密码</CardTitle>
              <CardDescription className="text-slate-600">
                输入您的邮箱地址，我们将发送验证码
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                {/* 错误提示 */}
                {forgotPasswordError && (
                  <div className="rounded-2xl bg-red-50 border border-red-200/50 p-4 text-sm text-red-700 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">⚠️</span>
                      <span>{forgotPasswordError}</span>
                    </div>
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="forgot-email">邮箱地址</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="rounded-[1.5rem] border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <Button 
                  className="w-full rounded-3xl bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg" 
                  type="button"
                  disabled={sendingResetCode || resetCodeCooldown > 0}
                  onClick={handleSendResetCode}
                >
                  {sendingResetCode && <Spinner className="mr-2" />}
                  {sendingResetCode 
                    ? "发送中..." 
                    : resetCodeCooldown > 0 
                    ? `重新发送 (${resetCodeCooldown}秒)` 
                    : "发送验证码"}
                </Button>
                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login")
                      setForgotPasswordError("") // 清除忘记密码错误
                    }}
                    className="text-blue-600 hover:text-blue-700 underline underline-offset-4 transition-colors duration-200 hover:scale-105"
                  >
                    返回登录
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* P1修复：重置密码 - 输入验证码和新密码 */}
        {mode === "reset-password" && (
          <Card className="bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl rounded-[2rem]">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-slate-900">重置密码</CardTitle>
              <CardDescription className="text-slate-600">
                请输入邮箱收到的验证码和新密码
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                {/* 错误提示 */}
                {resetPasswordError && (
                  <div className="rounded-2xl bg-red-50 border border-red-200/50 p-4 text-sm text-red-700 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">⚠️</span>
                      <span>{resetPasswordError}</span>
                    </div>
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="reset-code">验证码</Label>
                  <Input
                    id="reset-code"
                    type="text"
                    placeholder="请输入6位验证码"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    maxLength={6}
                    required
                    className="rounded-[1.5rem] border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password">新密码</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="请输入新密码"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="rounded-[1.5rem] border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-new-password">确认新密码</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="请确认新密码"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    className="rounded-[1.5rem] border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <Button 
                  className="w-full rounded-3xl bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg" 
                  type="button"
                  disabled={resettingPassword}
                  onClick={handleResetPassword}
                >
                  {resettingPassword && <Spinner className="mr-2" />}
                  {resettingPassword ? "重置中..." : "重置密码"}
                </Button>
                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login")
                      setResetPasswordError("") // 清除重置密码错误
                    }}
                    className="text-blue-600 hover:text-blue-700 underline underline-offset-4 transition-colors duration-200 hover:scale-105"
                  >
                    返回登录
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 提示对话框：移动端紧凑样式 */}
      <AlertDialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <AlertDialogContent
          className="w-[280px] p-6 rounded-3xl bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl gap-4 text-center sm:w-[280px]"
        >
          <AlertDialogTitle className="text-lg font-bold text-slate-900">提示</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed text-slate-600">
            {alertMessage}
          </AlertDialogDescription>
          <AlertDialogAction className="mt-2 w-full rounded-3xl bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg">确定</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
