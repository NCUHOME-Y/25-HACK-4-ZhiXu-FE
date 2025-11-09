import { cn } from "../../lib/helpers/utils"
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

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onSwitchToSignup?: () => void
  onSwitchToOTP?: () => void
}

export function LoginForm({
  className,
  onSwitchToSignup,
  onSwitchToOTP,
  ...props
}: LoginFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">登录</CardTitle>
          <CardDescription>
            输入您的手机号以登录您的账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="phone">手机号</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="请输入手机号"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">密码</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    忘记密码？
                  </a>
                </div>
                <Input id="password" type="password" required />
              </div>
              <Button type="submit" className="w-full">
                登录
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                type="button"
                onClick={onSwitchToOTP}
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
