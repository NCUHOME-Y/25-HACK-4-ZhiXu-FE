import { cn } from "../../lib/helpers/helpers"
import { Button } from "../ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Spinner } from "../ui/spinner"

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onSwitchToSignup?: () => void
  onSwitchToOTP?: () => void
  onForgotPassword?: () => void
  onSubmit?: (e: React.FormEvent) => void // 添加提交回调
  loading?: boolean // 添加加载状态
  error?: string // 添加错误信息
}

export function LoginForm({
  className,
  onSwitchToSignup,
  onSwitchToOTP,
  onForgotPassword,
  onSubmit,
  loading = false,
  error,
  ...props
}: LoginFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">登录</CardTitle>
          <CardDescription>
            输入您的邮箱以登录您的账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-6">
              {/* 错误提示 */}
              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入邮箱"
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">密码</Label>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    disabled={loading}
                  >
                    忘记密码？
                  </button>
                </div>
                <Input id="password" type="password" required disabled={loading} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Spinner className="mr-2" />}
                {loading ? "登录中..." : "登录"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                type="button"
                onClick={onSwitchToOTP}
                disabled={loading}
              >
                验证码登录
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              还没有账户？{" "}
              <button
                type="button"
                onClick={onSwitchToSignup}
                className="underline underline-offset-4 hover:text-slate-900 dark:hover:text-slate-50"
                disabled={loading}
              >
                注册
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
