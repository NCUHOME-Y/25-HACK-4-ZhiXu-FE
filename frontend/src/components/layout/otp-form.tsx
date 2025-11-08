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
}

export function OTPForm({ onSwitchToLogin, onVerificationSuccess, ...props }: OTPFormProps) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>输入验证码</CardTitle>
        <CardDescription>我们已向您的手机发送了 6 位验证码。</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <FieldGroup>
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
              <Button type="button" onClick={onVerificationSuccess}>验证</Button>
              <FieldDescription className="text-center">
                没有收到验证码？ <a href="#">重新发送</a>
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
