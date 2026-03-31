'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ArticleFeedbackButtonsProps {
  articleId: string;
}

export function ArticleFeedbackButtons({ articleId }: ArticleFeedbackButtonsProps) {
  const [voted, setVoted] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (wasHelpful: boolean) => {
    setIsSubmitting(true);

    try {

      // Get current user (optional - can vote anonymously)
      const { data: { user } } = await supabase.auth.getUser();

      // Record feedback
      const { error: feedbackError } = await supabase
        .from('article_feedback')
        .insert({
          article_id: articleId,
          user_id: user?.id || null,
          was_helpful: wasHelpful,
        });

      if (feedbackError) throw feedbackError;

      // Update article counts
      const columnToIncrement = wasHelpful ? 'helpful_count' : 'not_helpful_count';
      
      const { data: article } = await supabase
        .from('help_articles')
        .select(columnToIncrement)
        .eq('id', articleId)
        .single();

      if (article) {
        await supabase
          .from('help_articles')
          .update({ [columnToIncrement]: (article[columnToIncrement] || 0) + 1 })
          .eq('id', articleId);
      }

      setVoted(wasHelpful);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (voted !== null) {
    return (
      <div className="flex items-center justify-center gap-2 text-green-600">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">Thanks for your feedback!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => handleVote(true)}
        disabled={isSubmitting}
        className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 rounded-lg 
                 hover:border-green-500 hover:bg-green-50 hover:text-green-700
                 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ThumbsUp className="w-5 h-5" />
        <span className="font-medium">Yes</span>
      </button>
      
      <button
        onClick={() => handleVote(false)}
        disabled={isSubmitting}
        className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 rounded-lg 
                 hover:border-red-500 hover:bg-red-50 hover:text-red-700
                 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ThumbsDown className="w-5 h-5" />
        <span className="font-medium">No</span>
      </button>
    </div>
  );
}
