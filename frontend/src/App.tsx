import { useRoutes } from 'react-router-dom';
import { routes } from './routes';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./components/ui/card";

const App = () => {
  const element = useRoutes(routes);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">欢迎</CardTitle>
          <CardDescription>知序</CardDescription>
        </CardHeader>
        <CardContent>
          {element}
        </CardContent>
      </Card>
    </div>
  );
};

export default App;