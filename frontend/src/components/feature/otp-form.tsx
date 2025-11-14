import { Button } from "../ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "../ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../ui/input-otp"

interface OTPFormProps extends React.ComponentProps<typeof Card> {
  onSwitchToLogin?: () => void
  onVerificationSuccess?: () => void
  onResend?: () => void // 添加重新发送回调
  error?: string // 添加错误信息
  loading?: boolean // 添加加载状态
  resendCooldown?: number // 添加倒计时状态
}

export function OTPForm({ onSwitchToLogin, onVerificationSuccess, onResend, error, loading = false, resendCooldown = 0, ...props }: OTPFormProps) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>输入验证码</CardTitle>
        <CardDescription>我们已向您的手机发送了 6 位验证码。</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <FieldGroup>
            {/* 错误提示 */}
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400 mb-4">
                {error}
              </div>
            )}
            <Field>
              <FieldLabel htmlFor="otp">验证码</FieldLabel>
              <InputOTP maxLength={6} id="otp" required>
                <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <FieldDescription>
                请输入发送到您手机的 6 位验证码。
              </FieldDescription>
            </Field>
            <FieldGroup>
              <Button type="button" onClick={onVerificationSuccess} disabled={loading}>
                {loading ? "验证中..." : "验证"}
              </Button>
              <FieldDescription className="text-center">
                没有收到验证码？{" "}
                {resendCooldown > 0 ? (
                  <span className="text-slate-500">{resendCooldown}秒后可重新发送</span>
                ) : (
                  <button
                    type="button"
                    onClick={onResend}
                    className="underline underline-offset-4 hover:text-slate-900 dark:hover:text-slate-50"
                  >
                    重新发送
                  </button>
                )}
                {" | "}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="underline underline-offset-4 hover:text-slate-900 dark:hover:text-slate-50"
                >
                  返回登录
                </button>
              </FieldDescription>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
