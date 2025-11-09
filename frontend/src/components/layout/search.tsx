import { Search as SearchIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export function Search() {
  return (
    <div className="w-full bg-background border-b border-border px-4 py-3">
      <div className="relative flex w-full max-w-2xl mx-auto items-center">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="搜索任务、笔记..."
          className="w-full rounded-full bg-muted/50 pl-10 pr-20 h-10 border-0 focus-visible:ring-1 focus-visible:ring-ring"
        />
        <Button 
          type="submit" 
          size="sm" 
          className="absolute right-1 h-8 rounded-full px-4"
        >
          搜索
        </Button>
      </div>
    </div>
  );
}

