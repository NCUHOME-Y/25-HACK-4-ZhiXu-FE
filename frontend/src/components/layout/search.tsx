import { Search as SearchIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

export function Search() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white md:hidden">
      <div className="flex h-16 items-center justify-center px-4">
        <div className="flex items-center w-full max-w-md h-12 bg-white border border-border rounded-full shadow-sm overflow-hidden">
          <div className="flex items-center flex-1 pl-4 pr-2 h-full">
            <SearchIcon className="h-5 w-5 text-muted-foreground mr-2" />
            <Input
              type="search"
              placeholder="搜索任务、笔记..."
              className="border-none shadow-none focus-visible:ring-0 focus-visible:border-none bg-transparent text-base h-8"
            />
          </div>
          <Separator orientation="vertical" className="h-full" />
          <Button
            type="submit"
            variant="default"
            size="sm"
            className="h-full px-6 rounded-none"
            style={{ borderRadius: 0 }}
          >
            搜索
          </Button>
        </div>
      </div>
    </nav>
  );
}