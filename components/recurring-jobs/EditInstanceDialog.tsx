/**
 * Edit Instance Dialog
 * Shows when user tries to edit a recurring job instance
 * Prompts: Edit this only, this and future, or all instances
 */

'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import type { EditScope } from '@/lib/recurring-jobs/types'

type EditInstanceDialogProps = {
  instance: {
    id: string
    title: string
    scheduled_date?: string
    recurrence_instance_number?: number
  }
  onSave: (scope: EditScope) => void
  onCancel: () => void
}

export function EditInstanceDialog({ instance, onSave, onCancel }: EditInstanceDialogProps) {
  const [editScope, setEditScope] = useState<EditScope>('this')
  
  const dateStr = instance.scheduled_date 
    ? new Date(instance.scheduled_date).toLocaleDateString('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'this date'
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-lg mb-1">
              Edit Recurring Job Instance
            </h3>
            <p className="text-sm text-gray-600">
              This job is part of a recurring series. What would you like to edit?
            </p>
          </div>
        </div>
        
        <div className="space-y-3 my-6">
          {/* Option 1: This only */}
          <label 
            className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
              editScope === 'this' 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="edit-scope"
              checked={editScope === 'this'}
              onChange={() => setEditScope('this')}
              className="mt-1 text-orange-600 focus:ring-orange-500"
            />
            <div className="flex-1">
              <div className="font-medium">Only this instance</div>
              <div className="text-sm text-gray-600">
                Changes apply to {dateStr} only
              </div>
            </div>
          </label>
          
          {/* Option 2: This and future */}
          <label 
            className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
              editScope === 'future' 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="edit-scope"
              checked={editScope === 'future'}
              onChange={() => setEditScope('future')}
              className="mt-1 text-orange-600 focus:ring-orange-500"
            />
            <div className="flex-1">
              <div className="font-medium">This and all future instances</div>
              <div className="text-sm text-gray-600">
                Updates from {dateStr} onwards
              </div>
            </div>
          </label>
          
          {/* Option 3: Edit schedule */}
          <label 
            className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
              editScope === 'all' 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="edit-scope"
              checked={editScope === 'all'}
              onChange={() => setEditScope('all')}
              className="mt-1 text-orange-600 focus:ring-orange-500"
            />
            <div className="flex-1">
              <div className="font-medium">Edit the recurring schedule</div>
              <div className="text-sm text-gray-600">
                Change frequency, days, or other schedule settings for the entire series
              </div>
            </div>
          </label>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => onSave(editScope)} 
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Continue
          </button>
          <button 
            onClick={onCancel} 
            className="flex-1 border border-gray-300 hover:bg-gray-50 font-medium py-2 px-4 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
