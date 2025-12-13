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
import { Input } from "../ui/input"

interface SignupFormProps extends React.ComponentProps<typeof Card> {
  onSwitchToLogin?: () => void
  onSwitchToOTP?: () => void
  error?: string // 添加错误信息
}

export function SignupForm({ onSwitchToLogin, onSwitchToOTP, error, ...props }: SignupFormProps) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>创建账户</CardTitle>
        <CardDescription>
          输入以下信息以创建您的账户
        </CardDescription>
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
              <FieldLabel htmlFor="name">名称</FieldLabel>
              <Input id="name" type="text" placeholder="请输入名称" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">邮箱</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱"
                required
              />
              <FieldDescription>
                我们将使用此邮箱与您联系。我们不会与他人分享您的邮箱。
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">密码</FieldLabel>
              <Input id="password" type="password" required />
              <FieldDescription>
                密码至少需要 8 个字符，且包含大写字母、小写字母、数字、特殊符号中的至少三种。
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                确认密码
              </FieldLabel>
              <Input id="confirm-password" type="password" required />
              <FieldDescription>请再次输入您的密码。</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="button" onClick={onSwitchToOTP}>创建账户</Button>
                <FieldDescription className="px-6 text-center">
                  已有账户？{" "}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="underline underline-offset-4 hover:text-slate-900 dark:hover:text-slate-50"
                  >
                    登录
                  </button>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
