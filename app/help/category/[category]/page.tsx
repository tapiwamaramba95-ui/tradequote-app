import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase-server';
import { ArticleCard } from '../../components/ArticleCard';

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

const categoryInfo: Record<string, { name: string; description: string }> = {
  'getting-started': {
    name: 'Getting Started',
    description: 'Quick start guides and tutorials to help you get up and running with TradeQuote',
  },
  'features': {
    name: 'Features',
    description: 'Learn about all the powerful features TradeQuote has to offer',
  },
  'faq': {
    name: 'Frequently Asked Questions',
    description: 'Answers to common questions about TradeQuote',
  },
  'billing': {
    name: 'Billing & Subscriptions',
    description: 'Information about pricing, payments, and subscription management',
  },
  'integrations': {
    name: 'Integrations',
    description: 'Connect TradeQuote with your favorite tools and services',
  },
};

export async function generateMetadata({ params }: CategoryPageProps) {
  const { category } = await params;
  const info = categoryInfo[category];

  if (!info) {
    return {
      title: 'Category Not Found | TradeQuote Help',
    };
  }

  return {
    title: `${info.name} | TradeQuote Help`,
    description: info.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const info = categoryInfo[category];

  if (!info) {
    notFound();
  }

  const supabase = await createSupabaseServer();

  // Fetch articles in this category
  const { data: articles, error } = await supabase
    .from('help_articles')
    .select('*')
    .eq('category', category)
    .eq('is_published', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching articles:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/help"
            className="inline-flex items-center text-sm text-gray-600 hover:text-orange-600 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Help Center
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 mb-3">{info.name}</h1>
          <p className="text-xl text-gray-600">{info.description}</p>
        </div>
      </div>

      {/* Articles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {articles && articles.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article: any) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-600">No articles found in this category yet.</p>
            <Link
              href="/help"
              className="inline-block mt-6 text-orange-600 hover:text-orange-700 font-medium"
            >
              Browse all articles
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
