'use client';

import { useState, useEffect } from 'react';
import { X, Heart, ThumbsUp, Meh, ThumbsDown, Camera, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
}

type Sentiment = 'love' | 'like' | 'neutral' | 'dislike';
type FeedbackType = 'feature' | 'bug' | 'general';

export function FeedbackForm({ isOpen, onClose }: FeedbackFormProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get current user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [type, setType] = useState<FeedbackType>('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-capture context
  const [context] = useState(() => ({
    pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    browser: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    os: typeof navigator !== 'undefined' ? navigator.platform : '',
  }));

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !user) return;

    setIsSubmitting(true);
    setError(null);

    try {

      // Get business_id from user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_id')
        .eq('id', user.id)
        .single();

      if (!profile?.business_id) {
        throw new Error('Business ID not found');
      }

      // Prepare feedback data
      const feedbackData = {
        user_id: user.id,
        business_id: profile.business_id,
        type,
        sentiment,
        title: title.trim() || null,
        description: description.trim(),
        page_url: context.pageUrl,
        browser: context.browser,
        os: context.os,
        status: 'new',
      };

      // Insert feedback
      const { error: insertError } = await supabase
        .from('feedback')
        .insert(feedbackData);

      if (insertError) throw insertError;

      // Show success state
      setIsSuccess(true);
      
      // Reset form after delay
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          setIsSuccess(false);
          setSentiment(null);
          setType('general');
          setTitle('');
          setDescription('');
          setIncludeScreenshot(false);
        }, 300);
      }, 2000);

    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
      setIsSubmitting(false);
    }
  };

  const sentiments: { value: Sentiment; icon: React.ReactNode; label: string; color: string }[] = [
    { value: 'love', icon: <Heart className="w-6 h-6" />, label: 'Love it', color: 'text-red-500 hover:bg-red-50' },
    { value: 'like', icon: <ThumbsUp className="w-6 h-6" />, label: 'Like it', color: 'text-green-500 hover:bg-green-50' },
    { value: 'neutral', icon: <Meh className="w-6 h-6" />, label: 'Neutral', color: 'text-gray-500 hover:bg-gray-50' },
    { value: 'dislike', icon: <ThumbsDown className="w-6 h-6" />, label: 'Dislike', color: 'text-orange-500 hover:bg-orange-50' },
  ];

  const types: { value: FeedbackType; label: string; description: string }[] = [
    { value: 'feature', label: 'Feature Request', description: 'Suggest a new feature' },
    { value: 'bug', label: 'Bug Report', description: 'Report an issue' },
    { value: 'general', label: 'General Feedback', description: 'Share your thoughts' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Success State */}
        {isSuccess ? (
          <div className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Thank You!
            </h3>
            <p className="text-gray-600">
              Your feedback has been submitted successfully.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Send Feedback</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Help us improve TradeQuote by sharing your thoughts
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Sentiment Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How do you feel about TradeQuote?
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {sentiments.map(({ value, icon, label, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSentiment(value)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        sentiment === value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`flex flex-col items-center gap-2 ${color}`}>
                        {icon}
                        <span className="text-xs font-medium text-gray-700">{label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What type of feedback is this?
                </label>
                <div className="space-y-2">
                  {types.map(({ value, label, description }) => (
                    <label
                      key={value}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        type === value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={value}
                        checked={type === value}
                        onChange={(e) => setType(e.target.value as FeedbackType)}
                        className="mt-1 text-orange-500 focus:ring-orange-500"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{label}</div>
                        <div className="text-sm text-gray-500">{description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Title (Optional) */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of your feedback"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us more about your feedback..."
                  rows={5}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {description.length}/1000 characters
                </div>
              </div>

              {/* Screenshot Option (Future Enhancement) */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="screenshot"
                  checked={includeScreenshot}
                  onChange={(e) => setIncludeScreenshot(e.target.checked)}
                  className="text-orange-500 focus:ring-orange-500 rounded"
                  disabled
                />
                <label htmlFor="screenshot" className="flex items-center gap-2 text-sm text-gray-600 cursor-not-allowed">
                  <Camera className="w-4 h-4" />
                  Include screenshot <span className="text-xs text-gray-400">(Coming soon)</span>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Context Info */}
              <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded">
                <strong>Auto-captured:</strong> Page URL, browser info, and OS will be included to help us understand the context.
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!description.trim() || isSubmitting}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
