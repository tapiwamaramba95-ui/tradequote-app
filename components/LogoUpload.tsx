'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/colors'

interface LogoUploadProps {
  currentLogoUrl?: string
  onLogoUpload: (logoUrl: string) => void
  onLogoRemove: () => void
}

export function LogoUpload({ currentLogoUrl, onLogoUpload, onLogoRemove }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB')
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUploadError('You must be logged in to upload files')
        return
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file)

      if (error) {
        console.error('Upload error:', error)
        setUploadError('Failed to upload logo. Please try again.')
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName)

      // Remove old logo if it exists
      if (currentLogoUrl && currentLogoUrl.includes('supabase')) {
        const oldPath = currentLogoUrl.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('company-logos')
            .remove([`${user.id}/${oldPath}`])
        }
      }

      onLogoUpload(publicUrl)
    } catch (error) {
      console.error('Error uploading logo:', error)
      setUploadError('Failed to upload logo. Please try again.')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveLogo = async () => {
    if (!currentLogoUrl) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Remove from storage if it's a Supabase-hosted file
      if (currentLogoUrl.includes('supabase')) {
        const fileName = currentLogoUrl.split('/').slice(-2).join('/')
        await supabase.storage
          .from('company-logos')
          .remove([fileName])
      }

      onLogoRemove()
    } catch (error) {
      console.error('Error removing logo:', error)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
        Company Logo
      </label>
      
      {/* Current Logo Preview */}
      {currentLogoUrl && (
        <div className="mb-4">
          <div className="relative inline-block">
            <img
              src={currentLogoUrl}
              alt="Company Logo"
              className="h-20 w-auto max-w-48 rounded border"
              style={{ border: `1px solid ${colors.border.DEFAULT}` }}
            />
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              title="Remove logo"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id="logo-upload"
        />
        
        <label
          htmlFor="logo-upload"
          className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
            uploading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
          }`}
          style={{
            backgroundColor: colors.accent.DEFAULT,
            color: 'white',
          }}
        >
          {uploading ? 'Uploading...' : 'Choose Logo File'}
        </label>

        {uploadError && (
          <p className="text-sm text-red-600">{uploadError}</p>
        )}

        <p className="text-xs" style={{ color: colors.text.secondary }}>
          Upload your company logo (JPG, PNG, max 5MB). If no logo is provided, your company name will be displayed.
        </p>
      </div>
    </div>
  )
}