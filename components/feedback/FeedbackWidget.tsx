'use client';

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { FeedbackForm } from './FeedbackForm';

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Fixed Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-orange-500 hover:bg-orange-600 
                   text-white p-4 rounded-full shadow-lg transition-all duration-200 
                   hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-400 
                   focus:ring-offset-2 group"
        aria-label="Send Feedback"
      >
        <MessageSquarePlus className="w-6 h-6" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 
                       bg-gray-900 text-white text-sm px-3 py-1 rounded 
                       whitespace-nowrap opacity-0 group-hover:opacity-100 
                       transition-opacity pointer-events-none">
          Send Feedback
        </span>
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <FeedbackForm 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
