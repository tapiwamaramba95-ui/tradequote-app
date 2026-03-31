import Link from 'next/link';
import { Search, Book, Lightbulb, MessageCircleQuestion, ArrowRight, Mail } from 'lucide-react';
import { SearchBar } from './components/SearchBar';
import { ArticleCard } from './components/ArticleCard';
import { createSupabaseServer } from '@/lib/supabase-server';

export const metadata = {
  title: 'Help Center | TradeQuote',
  description: 'Find answers to your questions about TradeQuote',
};

export default async function HelpCenterPage() {
  const supabase = await createSupabaseServer();

  // Fetch featured articles and category counts
  const { data: featuredArticles } = await supabase
    .from('help_articles')
    .select('*')
    .eq('is_published', true)
    .eq('featured', true)
    .order('display_order', { ascending: true })
    .limit(6);

  // Get article counts by category
  const { data: categories } = await supabase
    .from('help_articles')
    .select('category')
    .eq('is_published', true);

  const categoryData = [
    {
      slug: 'getting-started',
      name: 'Getting Started',
      description: 'Quick start guides and tutorials',
      icon: <Book className="w-6 h-6" />,
      color: 'blue',
      count: categories?.filter((c: any) => c.category === 'getting-started').length || 0,
    },
    {
      slug: 'features',
      name: 'Features',
      description: 'Learn about TradeQuote features',
      icon: <Lightbulb className="w-6 h-6" />,
      color: 'orange',
      count: categories?.filter((c: any) => c.category === 'features').length || 0,
    },
    {
      slug: 'faq',
      name: 'FAQ',
      description: 'Frequently asked questions',
      icon: <MessageCircleQuestion className="w-6 h-6" />,
      color: 'green',
      count: categories?.filter((c: any) => c.category === 'faq').length || 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
            <p className="text-xl text-orange-100 mb-8">
              Search our knowledge base or browse articles by category
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <SearchBar />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Browse by Category</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {categoryData.map((category) => (
              <Link
                key={category.slug}
                href={`/help/category/${category.slug}`}
                className="group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all border-2 border-gray-100 hover:border-orange-500"
              >
                <div className={`inline-flex p-3 rounded-lg bg-${category.color}-100 text-${category.color}-600 mb-4`}>
                  {category.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600">
                  {category.name}
                </h3>
                <p className="text-gray-600 mb-3">{category.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{category.count} articles</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Articles */}
        {featuredArticles && featuredArticles.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Featured Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredArticles.map((article: any) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        )}

        {/* Contact Support */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-8 text-center text-white">
          <Mail className="w-12 h-12 mx-auto mb-4 text-orange-400" />
          <h2 className="text-2xl font-semibold mb-2">Still need help?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is happy to help.
          </p>
          <a
            href="mailto:support@tradequote.com.au"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Mail className="w-5 h-5" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
