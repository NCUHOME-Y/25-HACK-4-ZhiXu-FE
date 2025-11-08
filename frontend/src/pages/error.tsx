import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Home, RefreshCw, AlertCircle, ServerCrash, ShieldAlert, FileQuestion, Wifi } from "lucide-react";

interface ErrorState {
  status?: number;
  message?: string;
  details?: string;
}

// 错误类型配置
const ERROR_CONFIG = {
  400: {
    icon: AlertCircle,
    title: "400",
    subtitle: "请求错误",
    description: "您的请求有误,请检查输入内容后重试",
    color: "text-orange-500",
    action: "返回首页" as string | undefined,
    actionPath: undefined as string | undefined,
  },
  401: {
    icon: ShieldAlert,
    title: "401",
    subtitle: "未授权",
    description: "您需要登录才能访问此页面",
    color: "text-yellow-500",
    action: "去登录" as string | undefined,
    actionPath: "/login" as string | undefined,
  },
  403: {
    icon: ShieldAlert,
    title: "403",
    subtitle: "禁止访问",
    description: "您没有权限访问此资源",
    color: "text-red-500",
    action: "返回首页" as string | undefined,
    actionPath: undefined as string | undefined,
  },
  404: {
    icon: FileQuestion,
    title: "404",
    subtitle: "页面未找到",
    description: "抱歉，您访问的页面不存在",
    color: "text-blue-500",
    action: "返回首页" as string | undefined,
    actionPath: undefined as string | undefined,
  },
  500: {
    icon: ServerCrash,
    title: "500",
    subtitle: "服务器错误",
    description: "服务器遇到了问题，请稍后再试",
    color: "text-red-600",
    action: "返回首页" as string | undefined,
    actionPath: undefined as string | undefined,
  },
  503: {
    icon: ServerCrash,
    title: "503",
    subtitle: "服务不可用",
    description: "服务暂时不可用，请稍后再试",
    color: "text-purple-500",
    action: "返回首页" as string | undefined,
    actionPath: undefined as string | undefined,
  },
  network: {
    icon: Wifi,
    title: "网络错误",
    subtitle: "连接失败",
    description: "无法连接到服务器，请检查您的网络连接",
    color: "text-slate-500",
    action: "返回首页" as string | undefined,
    actionPath: undefined as string | undefined,
  },
} as const;

export default function ErrorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorState = (location.state as ErrorState) || {};
  
  // 从 URL 参数或 state 获取错误状态
  const statusParam = searchParams.get('status');
  const messageParam = searchParams.get('message');
  const detailsParam = searchParams.get('details');
  
  const status = errorState.status || (statusParam === 'network' ? 'network' : Number(statusParam)) || 404;
  const config = ERROR_CONFIG[status as keyof typeof ERROR_CONFIG] || ERROR_CONFIG[404];
  const Icon = config.icon;
  
  const customMessage = errorState.message || (messageParam ? decodeURIComponent(messageParam) : null);
  const customDetails = errorState.details || (detailsParam ? decodeURIComponent(detailsParam) : null);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleAction = () => {
    if (config.actionPath) {
      navigate(config.actionPath);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-lg border-slate-200 shadow-lg dark:border-slate-800">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Icon className={`h-10 w-10 ${config.color}`} />
          </div>
          <div>
            <CardTitle className={`text-7xl font-bold ${config.color}`}>
              {config.title}
            </CardTitle>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {config.subtitle}
            </p>
          </div>
          <CardDescription className="text-base text-slate-600 dark:text-slate-400">
            {customMessage || config.description}
          </CardDescription>
        </CardHeader>

        {customDetails && (
          <CardContent className="pb-4">
            <Alert variant="destructive" className="border-slate-200 dark:border-slate-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {customDetails}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}

        <CardFooter className="flex flex-col gap-3 pt-4">
          <div className="flex w-full gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleGoBack}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              返回上页
            </Button>
            <Button 
              className="flex-1"
              onClick={handleAction}
            >
              <Home className="mr-2 h-4 w-4" />
              {config.action || "返回首页"}
            </Button>
          </div>
          
          {typeof status === 'number' && status >= 500 && (
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新页面重试
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}