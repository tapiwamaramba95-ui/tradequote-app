'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'

interface PhotoUploadProps {
  jobId: string
  onUploadComplete?: () => void
  photoType?: 'before' | 'during' | 'after' | 'other'
  maxPhotos?: number
}

export default function PhotoUpload({ 
  jobId, 
  onUploadComplete,
  photoType = 'during',
  maxPhotos = 20
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Check max photos limit
    const { count } = await supabase
      .from('job_photos')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', jobId)

    if (count && count >= maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed per job`)
      return
    }

    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload each file
      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Validate file
        if (!file.type.startsWith('image/')) {
          throw new Error('Only image files are allowed')
        }

        // Max 10MB per file
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File size must be less than 10MB')
        }

        // Create form data
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
        formData.append('folder', `tradequote/jobs/${jobId}`)

        // Upload to Cloudinary
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        )

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const data = await response.json()

        // Save to database
        const { error: dbError } = await supabase
          .from('job_photos')
          .insert({
            job_id: jobId,
            user_id: user.id,
            photo_url: data.secure_url,
            public_id: data.public_id,
            file_name: file.name,
            file_size: file.size,
            width: data.width,
            height: data.height,
            photo_type: photoType
          })

        if (dbError) throw dbError

        // Update progress
        setProgress(((index + 1) / files.length) * 100)
      })

      await Promise.all(uploadPromises)

      // Success
      setUploading(false)
      setProgress(100)
      
      // Reset file input
      e.target.value = ''

      // Callback
      if (onUploadComplete) {
        onUploadComplete()
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block">
        <div className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all
          ${uploading 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
            : 'border-gray-300 hover:border-orange-500 hover:bg-orange-50'
          }
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}>
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
              <p className="text-sm text-gray-600">Uploading... {Math.round(progress)}%</p>
              <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full from-orange-500 to-orange-600 transition-all duration-300"
                  style={{ 
                    background: 'linear-gradient(to right, #ea580c, #dc2626)',
                    width: `${progress}%`
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Click to upload photos
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, HEIC up to 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <X className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  )
}