import Link from 'next/link';
import { Clock, Eye } from 'lucide-react';

interface ArticleCardProps {
  article: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    category: string;
    view_count: number;
    created_at: string;
  };
}

export function ArticleCard({ article }: ArticleCardProps) {
  const categoryColors: Record<string, string> = {
    'getting-started': 'bg-blue-100 text-blue-700',
    'features': 'bg-orange-100 text-orange-700',
    'faq': 'bg-green-100 text-green-700',
    'billing': 'bg-purple-100 text-purple-700',
    'integrations': 'bg-pink-100 text-pink-700',
  };

  const categoryNames: Record<string, string> = {
    'getting-started': 'Getting Started',
    'features': 'Features',
    'faq': 'FAQ',
    'billing': 'Billing',
    'integrations': 'Integrations',
  };

  return (
    <Link
      href={`/help/${article.category}/${article.slug}`}
      className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-orange-300 p-6"
    >
      <div className="mb-3">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${categoryColors[article.category] || 'bg-gray-100 text-gray-700'}`}>
          {categoryNames[article.category] || article.category}
        </span>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
        {article.title}
      </h3>
      
      {article.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {article.description}
        </p>
      )}
      
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          <span>{article.view_count} views</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{new Date(article.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
