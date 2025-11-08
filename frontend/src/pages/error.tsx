import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Home, RefreshCw, AlertCircle, ServerCrash, ShieldAlert, Wifi } from "lucide-react";

// 简化的错误类型配置 - 只保留常用的
const ERROR_CONFIG = {
  401: {
    icon: ShieldAlert,
    title: "未授权",
    description: "您需要登录才能访问",
    color: "text-yellow-500",
    actionText: "去登录",
    actionPath: "/auth",
  },
  404: {
    icon: AlertCircle,
    title: "页面未找到",
    description: "抱歉，您访问的页面不存在",
    color: "text-blue-500",
  },
  500: {
    icon: ServerCrash,
    title: "服务器错误",
    description: "服务器遇到了问题，请稍后再试",
    color: "text-red-600",
  },
  network: {
    icon: Wifi,
    title: "网络错误",
    description: "无法连接到服务器，请检查网络连接",
    color: "text-slate-500",
  },
} as const;

export default function ErrorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const statusParam = searchParams.get('status') || '404';
  const messageParam = searchParams.get('message');
  
  const status = statusParam === 'network' ? 'network' : Number(statusParam);
  const config = ERROR_CONFIG[status as keyof typeof ERROR_CONFIG] || ERROR_CONFIG[404];
  const Icon = config.icon;
  
  const message = messageParam ? decodeURIComponent(messageParam) : config.description;

  const handleAction = () => {
    if ('actionPath' in config && config.actionPath) {
      navigate(config.actionPath);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Icon className={`h-10 w-10 ${config.color}`} />
          </div>
          <div>
            <CardTitle className={`text-3xl font-bold ${config.color}`}>
              {config.title}
            </CardTitle>
            <CardDescription className="mt-3 text-base">
              {message}
            </CardDescription>
          </div>
        </CardHeader>

        <CardFooter className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            返回
          </Button>
          <Button 
            className="flex-1"
            onClick={handleAction}
          >
            <Home className="mr-2 h-4 w-4" />
            {'actionText' in config ? config.actionText : '首页'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}