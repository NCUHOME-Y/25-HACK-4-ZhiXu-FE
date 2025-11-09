import { useRoutes } from 'react-router-dom';
import { routes } from './routes/routes';

const App = () => {
  const element = useRoutes(routes);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        {element}
      </div>
    </div>
  );
};

export default App;