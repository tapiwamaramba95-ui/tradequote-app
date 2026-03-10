'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Trash2, Download, X, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

interface Photo {
  id: string
  photo_url: string
  public_id: string
  file_name: string
  photo_type: string
  created_at: string
}

interface PhotoGalleryProps {
  jobId: string
  editable?: boolean
}

export default function PhotoGallery({ jobId, editable = true }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  useEffect(() => {
    loadPhotos()
  }, [jobId])

  const loadPhotos = async () => {
    const { data, error } = await supabase
      .from('job_photos')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })

    if (data) {
      setPhotos(data)
    }
    setLoading(false)
  }

  const handleDelete = async (photoId: string, publicId: string) => {
    if (!confirm('Delete this photo? This cannot be undone.')) return

    try {
      // Delete from database
      const { error } = await supabase
        .from('job_photos')
        .delete()
        .eq('id', photoId)

      if (error) throw error

      // Note: We don't delete from Cloudinary to avoid complexity
      // Cloudinary storage is cheap and we may want to keep backups

      // Refresh photos
      loadPhotos()
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete photo')
    }
  }

  const getOptimizedUrl = (url: string, width: number = 400, height: number = 400) => {
    // Add Cloudinary transformations for optimization
    return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,q_auto,f_auto/`)
  }

  const getFullSizeUrl = (url: string) => {
    // Optimized for viewing
    return url.replace('/upload/', '/upload/q_auto,f_auto/')
  }

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index)
    setLightboxOpen(true)
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <p className="text-sm text-gray-600">No photos yet</p>
        <p className="text-xs text-gray-500 mt-1">Upload photos to document this job</p>
      </div>
    )
  }

  return (
    <>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div key={photo.id} className="relative group aspect-square">
            <img
              src={getOptimizedUrl(photo.photo_url)}
              alt={photo.file_name}
              className="w-full h-full object-cover rounded-lg cursor-pointer transition-transform group-hover:scale-105"
              onClick={() => openLightbox(index)}
            />
            
            {/* Photo type badge */}
            {photo.photo_type !== 'during' && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-semibold rounded">
                {photo.photo_type}
              </div>
            )}

            {/* Delete button (only if editable) */}
            {editable && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(photo.id, photo.public_id)
                }}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous button */}
          {photos.length > 1 && (
            <button
              onClick={prevPhoto}
              className="absolute left-4 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Photo */}
          <div className="max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={getFullSizeUrl(photos[currentPhotoIndex].photo_url)}
              alt={photos[currentPhotoIndex].file_name}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Next button */}
          {photos.length > 1 && (
            <button
              onClick={nextPhoto}
              className="absolute right-4 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 text-white text-sm rounded-lg">
            {currentPhotoIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  )
}