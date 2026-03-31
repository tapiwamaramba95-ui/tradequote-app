import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Eye, ThumbsUp, ThumbsDown, Mail } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { createSupabaseServer } from '@/lib/supabase-server';
import { ArticleFeedbackButtons } from '../../components/ArticleFeedbackButtons';

interface ArticlePageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { category, slug } = await params;
  const supabase = await createClient();

  const { data: article } = await supabase
    .from('help_articles')
    .select('title, description')
    .eq('slug', slug)
    .eq('category', category)
    .eq('is_published', true)
    .single();

  if (!article) {
    return {
      title: 'Article Not Found | TradeQuote Help',
    };
  }

  return {
    title: `${article.title} | TradeQuote Help`,
    description: article.description || `Learn about ${article.title}`,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { category, slug } = await params;
  const supabase = await createSupabaseServer();

  // Fetch article
  const { data: article, error } = await supabase
    .from('help_articles')
    .select('*')
    .eq('slug', slug)
    .eq('category', category)
    .eq('is_published', true)
    .single();

  if (error || !article) {
    notFound();
  }

  // Increment view count (fire and forget)
  supabase
    .from('help_articles')
    .update({ view_count: (article.view_count || 0) + 1 })
    .eq('id', article.id)
    .then(() => {});

  // Fetch related articles in same category
  const { data: relatedArticles } = await supabase
    .from('help_articles')
    .select('id, slug, title, category, description')
    .eq('category', category)
    .eq('is_published', true)
    .neq('id', article.id)
    .order('display_order', { ascending: true })
    .limit(3);

  const categoryNames: Record<string, string> = {
    'getting-started': 'Getting Started',
    'features': 'Features',
    'faq': 'FAQ',
    'billing': 'Billing',
    'integrations': 'Integrations',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/help"
            className="inline-flex items-center text-sm text-gray-600 hover:text-orange-600 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Help Center
          </Link>

          <div className="mb-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
              {categoryNames[article.category] || article.category}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>

          {article.description && (
            <p className="text-xl text-gray-600 mb-4">{article.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{article.view_count} views</span>
            </div>
            <span>•</span>
            <span>Updated {new Date(article.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <article className="prose prose-lg max-w-none
                           prose-headings:text-gray-900 prose-headings:font-semibold
                           prose-p:text-gray-700 prose-p:leading-relaxed
                           prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline
                           prose-strong:text-gray-900 prose-strong:font-semibold
                           prose-ul:text-gray-700 prose-ol:text-gray-700
                           prose-li:text-gray-700 prose-li:my-1
                           prose-code:text-orange-600 prose-code:bg-orange-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                           prose-pre:bg-gray-900 prose-pre:text-gray-100
                           prose-hr:border-gray-300">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </article>
        </div>

        {/* Was this helpful? */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Was this article helpful?
          </h3>
          <ArticleFeedbackButtons articleId={article.id} />
          <p className="text-sm text-gray-500 text-center mt-4">
            {article.helpful_count > 0 && (
              <span>{article.helpful_count} people found this helpful</span>
            )}
          </p>
        </div>

        {/* Related Articles */}
        {relatedArticles && relatedArticles.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {relatedArticles.map((related: any) => (
                <Link
                  key={related.id}
                  href={`/help/${related.category}/${related.slug}`}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all"
                >
                  <h3 className="font-medium text-gray-900 hover:text-orange-600 mb-1">
                    {related.title}
                  </h3>
                  {related.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{related.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Contact Support */}
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <p className="text-gray-700 mb-4">Still need help with this topic?</p>
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
