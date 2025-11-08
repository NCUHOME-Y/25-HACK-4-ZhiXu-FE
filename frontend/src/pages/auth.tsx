import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LoginForm, SignupForm, OTPForm } from "../components/index"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "../components/ui/alert-dialog"

type AuthMode = "login" | "signup" | "otp"

export default function AuthPage() {
  const navigate = useNavigate()
  
  // 当前显示的认证模式
  const [mode, setMode] = useState<AuthMode>("login")
  // 当前手机号（用于跨步骤保留）
  const [phone, setPhone] = useState("")
  
  // 控制提示对话框
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [alertMessage, setAlertMessage] = useState("请先输入手机号")

  // 切换到验证码页面(从登录)
  const switchToOTPFromLogin = () => {
    // 检查手机号是否已输入
    const phoneInput = document.getElementById("phone") as HTMLInputElement
    const value = phoneInput?.value?.trim() ?? ""
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
    setPhone(value)
    setMode("otp")
  }

  // 切换到验证码页面（从注册）
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

  // 验证码验证成功后的处理
  const handleOTPVerificationSuccess = () => {
    // 登录/注册成功后跳转到打卡页面
    navigate("/flag")
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {/* 登录表单 */}
        {mode === "login" && (
          <LoginForm
            onSwitchToSignup={() => setMode("signup")}
            onSwitchToOTP={switchToOTPFromLogin}
          />
        )}

        {/* 注册表单 */}
        {mode === "signup" && (
          <SignupForm
            onSwitchToLogin={() => setMode("login")}
            onSwitchToOTP={switchToOTPFromSignup}
          />
        )}

        {/* 验证码表单 */}
        {mode === "otp" && (
          <div className="space-y-3">
            {/* 显示当前手机号 */}
            {phone && (
              <p className="text-xs text-center text-slate-500">
                验证码已发送至：{phone}
              </p>
            )}
            <OTPForm
              onSwitchToLogin={() => setMode("login")}
              onVerificationSuccess={handleOTPVerificationSuccess}
            />
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
