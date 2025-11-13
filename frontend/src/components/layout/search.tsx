import { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface SearchProps {
  onSearch?: (query: string) => void;
}

export function Search({ onSearch }: SearchProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white md:hidden">
      <div className="flex h-16 items-center justify-center px-4">
        <div className="flex items-center w-full max-w-md h-12 bg-white border border-border rounded-full shadow-sm overflow-hidden">
          <div className="flex items-center flex-1 pl-4 pr-2 h-full">
            <SearchIcon className="h-5 w-5 text-muted-foreground mr-2" />
            <Input
              type="search"
              placeholder="搜索帖子、用户、评论..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (onSearch) {
                  onSearch(e.target.value);
                }
              }}
              onKeyDown={handleKeyDown}
              className="border-none shadow-none focus-visible:ring-0 focus-visible:border-none bg-transparent text-base h-8"
            />
          </div>
          <Separator orientation="vertical" className="h-full" />
          <Button
            type="submit"
            variant="default"
            size="sm"
            onClick={handleSearch}
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