'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/help/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for articles..."
          className="w-full px-6 py-4 pl-14 pr-4 rounded-lg border-2 border-transparent
                   bg-white shadow-lg
                   focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50
                   text-gray-900 placeholder-gray-500 text-lg"
        />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
      </div>
    </form>
  );
}
