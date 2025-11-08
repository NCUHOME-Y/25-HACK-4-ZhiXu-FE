import { useState } from "react"
import { LoginForm } from "../components/layout/login-form"
import { SignupForm } from "../components/layout/signup-form"
import { OTPForm } from "../components/layout/otp-form"

type AuthMode = "login" | "signup" | "otp"
type OTPContext = "login" | "signup"

export default function AuthPage() {
  // 当前显示的认证模式
  const [mode, setMode] = useState<AuthMode>("login")
  // OTP验证从登录还是注册页面来
  const [otpContext, setOtpContext] = useState<OTPContext>("login")

  // 切换到验证码页面（从登录）
  const switchToOTPFromLogin = () => {
    setOtpContext("login")
    setMode("otp")
  }

  // 切换到验证码页面（从注册）
  const switchToOTPFromSignup = () => {
    setOtpContext("signup")
    setMode("otp")
  }

  // 验证码验证成功后的处理
  const handleOTPVerificationSuccess = () => {
    if (otpContext === "login") {
      alert("登录成功！")
    } else if (otpContext === "signup") {
      alert("注册成功！")
    }
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
          <OTPForm
            onSwitchToLogin={() => setMode("login")}
            onVerificationSuccess={handleOTPVerificationSuccess}
          />
        )}
      </div>
    </div>
  )
}
