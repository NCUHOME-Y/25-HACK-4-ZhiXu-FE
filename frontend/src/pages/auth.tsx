import { useState } from "react"
import { useNavigate } from "react-router-dom"
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

type AuthMode = "login" | "signup" | "otp" | "otp-input"

/**
 * 认证页面
 * 支持账号密码登录、注册、验证码登录等方式
 */
export default function AuthPage() {
  const navigate = useNavigate()
  
  // ========== 本地状态 ==========
  // 当前显示的认证模式
  const [mode, setMode] = useState<AuthMode>("login")
  // 当前手机号（用于跨步骤保留）
  const [phone, setPhone] = useState("")
  // OTP 手机号输入（验证码登录专用）
  const [otpPhone, setOtpPhone] = useState("")
  // 是否已发送验证码
  const [otpSent, setOtpSent] = useState(false)
  
  // 加载状态
  const [sendingOTP, setSendingOTP] = useState(false)
  const [verifyingOTP, setVerifyingOTP] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  
  // 控制提示对话框
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [alertMessage, setAlertMessage] = useState("请先输入手机号")

  // ========== 事件处理器 ==========
  /**
   * 切换到验证码页面(从登录)
   */
  const switchToOTPFromLogin = () => {
    // 直接进入验证码登录的手机号输入页
    setMode("otp")
    setOtpPhone("")
    setOtpSent(false)
  }

  /**
   * 发送验证码
   */
  const handleSendOTP = async () => {
    const value = otpPhone.trim()
    const isValidPhone = /^\d{11}$/.test(value)
    
    if (!value) {
      setAlertMessage("请先输入手机号")
      setShowAlertDialog(true)
      return
    }
    if (!isValidPhone) {
      setAlertMessage("请输入11位有效手机号")
      setShowAlertDialog(true)
      return
    }
    
    setSendingOTP(true)
    try {
      // TODO: 调用后端发送验证码接口
      await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟API调用
      setPhone(value)
      setOtpSent(true)
    } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setAlertMessage("发送验证码失败，请重试")
      setShowAlertDialog(true)
    } finally {
      setSendingOTP(false)
    }
  }

  /**
   * 切换到验证码页面(从注册)
   */
  const switchToOTPFromSignup = () => {
    // 读取注册表单的各字段并做最小校验（不改子组件，使用 DOM 读取）
    const nameInput = document.getElementById("name") as HTMLInputElement | null
    const phoneInput = document.getElementById("phone") as HTMLInputElement | null
    const pwdInput = document.getElementById("password") as HTMLInputElement | null
    const confirmInput = document.getElementById("confirm-password") as HTMLInputElement | null

    const name = nameInput?.value?.trim() ?? ""
    const value = phoneInput?.value?.trim() ?? ""
    const pwd = pwdInput?.value ?? ""
    const confirm = confirmInput?.value ?? ""

    const isValidPhone = /^\d{11}$/.test(value)

    if (!name || !value || !pwd || !confirm) {
      setAlertMessage("请完整填写注册信息")
      setShowAlertDialog(true)
      return
    }
    if (!isValidPhone) {
      setAlertMessage("请输入11位有效手机号")
      setShowAlertDialog(true)
      return
    }
    if (pwd.length < 8) {
      setAlertMessage("密码至少需要 8 个字符")
      setShowAlertDialog(true)
      return
    }
    if (pwd !== confirm) {
      setAlertMessage("两次输入的密码不一致")
      setShowAlertDialog(true)
      return
    }

    setPhone(value)
    setMode("otp")
  }

  /**
   * 处理登录
   */
  const handleLogin = async () => {
    setLoggingIn(true)
    try {
      // TODO: 调用后端登录接口
      await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟API调用
      // 登录成功后跳转到打卡页面
      navigate("/flag")
    } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setAlertMessage("登录失败，请检查账号密码")
      setShowAlertDialog(true)
    } finally {
      setLoggingIn(false)
    }
  }

  /**
   * 验证码验证成功后的处理
   */
  const handleOTPVerificationSuccess = async () => {
    setVerifyingOTP(true)
    try {
      // TODO: 调用后端验证验证码接口
      await new Promise(resolve => setTimeout(resolve, 1500)) // 模拟API调用
      // 登录/注册成功后跳转到打卡页面
      navigate("/flag")
    } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setAlertMessage("验证码验证失败，请重试")
      setShowAlertDialog(true)
    } finally {
      setVerifyingOTP(false)
    }
  }

  // ========== 渲染 ==========
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {/* 登录表单 */}
        {mode === "login" && (
          <div className="space-y-4">
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <LoginForm
                onSwitchToSignup={() => setMode("signup")}
                onSwitchToOTP={switchToOTPFromLogin}
              />
            </form>
            {/* 登录按钮的loading状态覆盖 */}
            {loggingIn && (
              <div className="flex items-center justify-center p-4">
                <Spinner className="mr-2" />
                <span className="text-sm">登录中...</span>
              </div>
            )}
          </div>
        )}

        {/* 注册表单 */}
        {mode === "signup" && (
          <SignupForm
            onSwitchToLogin={() => setMode("login")}
            onSwitchToOTP={switchToOTPFromSignup}
          />
        )}

        {/* 验证码表单 */}
        {mode === "otp" && !otpSent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">验证码登录</CardTitle>
              <CardDescription>
                输入您的手机号以接收验证码
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="otp-phone">手机号</Label>
                  <Input
                    id="otp-phone"
                    type="tel"
                    placeholder="请输入手机号"
                    value={otpPhone}
                    onChange={(e) => setOtpPhone(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  className="w-full" 
                  type="button"
                  disabled={sendingOTP}
                  onClick={handleSendOTP}
                >
                  {sendingOTP && <Spinner className="mr-2" />}
                  {sendingOTP ? "发送中..." : "发送验证码"}
                </Button>
                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="underline underline-offset-4 hover:text-slate-900 dark:hover:text-slate-50"
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
            {/* 显示当前手机号 */}
            {phone && (
              <p className="text-xs text-center text-slate-500">
                验证码已发送至：{phone}
              </p>
            )}
            <OTPForm
              onSwitchToLogin={() => {
                setMode("login")
                setOtpSent(false)
                setOtpPhone("")
                setVerifyingOTP(false)
              }}
              onVerificationSuccess={handleOTPVerificationSuccess}
            />
            {/* 验证按钮的loading状态覆盖 */}
            {verifyingOTP && (
              <div className="flex items-center justify-center p-4">
                <Spinner className="mr-2" />
                <span className="text-sm">验证中...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 提示对话框：移动端紧凑样式 */}
      <AlertDialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <AlertDialogContent
          className="w-[280px] p-4 rounded-xl gap-3 text-center sm:w-[280px]"
        >
          <AlertDialogTitle className="text-base font-medium">提示</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed">
            {alertMessage}
          </AlertDialogDescription>
          <AlertDialogAction className="mt-1 w-full">确定</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
