import Link from 'next/link';
import { Search, ChevronLeft } from 'lucide-react';
import { createSupabaseServer } from '@/lib/supabase-server';
import { ArticleCard } from '../components/ArticleCard';
import { SearchBar } from '../components/SearchBar';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';
  
  return {
    title: query ? `Search results for "${query}" | TradeQuote Help` : 'Search Help Center | TradeQuote',
    description: 'Search our help articles and documentation',
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';
  const supabase = await createSupabaseServer();

  let results: any[] = [];

  if (query.trim()) {
    // Full-text search across title, description, and content
    const { data } = await supabase
      .from('help_articles')
      .select('*')
      .eq('is_published', true)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`)
      .order('view_count', { ascending: false })
      .limit(20);

    results = data || [];
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/help"
            className="inline-flex items-center text-orange-100 hover:text-white mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Help Center
          </Link>

          <h1 className="text-3xl font-bold mb-6">Search Help Articles</h1>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {query.trim() ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Search results for "{query}"
              </h2>
              <p className="text-gray-600 mt-1">
                Found {results.length} {results.length === 1 ? 'article' : 'articles'}
              </p>
            </div>

            {results.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600 mb-6">
                  We couldn't find any articles matching "{query}"
                </p>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Try:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Using different keywords</li>
                    <li>Checking your spelling</li>
                    <li>Using more general terms</li>
                  </ul>
                </div>
                <div className="mt-8">
                  <Link
                    href="/help"
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Browse All Articles
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Start your search</h3>
            <p className="text-gray-600">
              Enter a search term above to find help articles
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
