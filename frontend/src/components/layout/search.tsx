import { Search as SearchIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export function Search() {
  return (
    <div className="relative flex w-full items-center">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="搜索..."
        className="w-full rounded-full bg-muted pl-10 pr-20 shadow-sm"
      />
      <Button type="submit" size="sm" className="absolute right-1.5 h-8 rounded-full">
        搜索
      </Button>
    </div>
  );
}
