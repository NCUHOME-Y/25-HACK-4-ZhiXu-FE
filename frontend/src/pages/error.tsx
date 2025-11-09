import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, Button } from "../components/index";
import { RefreshCw, Home } from "lucide-react";
import { ERROR_CONFIG, type ErrorType } from "../lib/constants";

/**
 * 错误页面
 * 显示各种错误状态（401、404、500、网络错误等）
 * 使用查询参数传递错误信息：?status=404&message=自定义消息
 */
export default function ErrorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const statusParam = searchParams.get('status') || '404';
  const messageParam = searchParams.get('message');
  
  // 解析错误类型
  const status: ErrorType = statusParam === 'network' ? 'network' : (Number(statusParam) as ErrorType);
  const config = ERROR_CONFIG[status] || ERROR_CONFIG[404];
  const Icon = config.icon;
  
  // 优先使用 URL 传递的消息，否则使用默认描述
  const message = messageParam ? decodeURIComponent(messageParam) : config.description;

  const handleAction = () => {
    if ('actionPath' in config && config.actionPath) {
      navigate(config.actionPath);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
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
