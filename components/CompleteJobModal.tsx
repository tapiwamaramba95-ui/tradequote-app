'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import PhotoUpload from '@/components/PhotoUpload'
import PhotoGallery from '@/components/PhotoGallery'
import { CheckCircle2, Camera, X } from 'lucide-react'

interface CompleteJobModalProps {
  jobId: string
  jobNumber?: string
  onClose: () => void
  onComplete: () => void
}

export default function CompleteJobModal({ 
  jobId, 
  jobNumber,
  onClose, 
  onComplete 
}: CompleteJobModalProps) {
  const [step, setStep] = useState<'photos' | 'confirm'>('photos')
  const [hasPhotos, setHasPhotos] = useState(false)
  const [completing, setCompleting] = useState(false)

  const checkPhotos = async () => {
    const { count } = await supabase
      .from('job_photos')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', jobId)
      .eq('photo_type', 'after')
    
    setHasPhotos((count || 0) > 0)
  }

  const handleComplete = async () => {
    setCompleting(true)
    
    try {
      // Mark job as complete
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)
      
      if (error) throw error
      
      onComplete()
    } catch (err) {
      console.error('Failed to complete job:', err)
      alert('Failed to complete job')
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Complete Job</h2>
            {jobNumber && <p className="text-sm text-gray-600">{jobNumber}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'photos' ? (
            <>
              {/* Photo Upload Section */}
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <Camera className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-blue-900 mb-1">
                      Add Final "After" Photos
                    </h3>
                    <p className="text-xs text-blue-800">
                      Document the completed work. These photos will be available to the customer and serve as proof of completion.
                    </p>
                  </div>
                </div>

                <PhotoUpload 
                  jobId={jobId}
                  photoType="after"
                  onUploadComplete={checkPhotos}
                />

                <div className="mt-4">
                  <PhotoGallery jobId={jobId} editable={true} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 px-4 py-2 text-white rounded-lg font-semibold transition-all"
                  style={{ 
                    background: 'linear-gradient(to right, #ea580c, #dc2626)',
                    boxShadow: '0 1px 3px rgba(234, 88, 12, 0.2)'
                  }}
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Confirmation */}
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Mark Job as Complete?
                </h3>
                
                <p className="text-sm text-gray-600 mb-6">
                  {hasPhotos 
                    ? 'Great! You\'ve added final photos. The job will be marked as complete.'
                    : 'You can still add photos later if needed.'}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('photos')}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={completing}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                  >
                    {completing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Complete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}