import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import api from '../../utils/api'

function ProfilePicture({ photoURL, onPhotoUpdate }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [currentPhotoURL, setCurrentPhotoURL] = useState(photoURL)
  const fileInputRef = useRef(null)

  // Update local state when photoURL prop changes
  useEffect(() => {
    setCurrentPhotoURL(photoURL)
  }, [photoURL])

  // Debug logging
  console.log('ProfilePicture component - photoURL prop:', photoURL)
  console.log('ProfilePicture component - currentPhotoURL state:', currentPhotoURL)

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB')
      return
    }

    try {
      setIsUploading(true)
      setError('')

      console.log('Starting file upload:', {
        name: file.name,
        type: file.type,
        size: file.size
      })

      // Upload to backend (Cloudinary)
      const form = new FormData()
      form.append('file', file)
      
      const res = await api.post('/auth/profile/picture', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      console.log('Upload response:', res.data)
      
      if (res.data.success && res.data.url) {
        // Update local state immediately to show the new image
        setCurrentPhotoURL(res.data.url);
        
        // Call the callback to update the profile with the new URL and user data
        if (res.data.user) {
          // If we have updated user data, pass it to the callback
          onPhotoUpdate(res.data.url, res.data.user)
        } else {
          // Fallback: just pass the URL
          onPhotoUpdate(res.data.url)
        }
        
        // Clear any previous errors
        setError('')
        
        console.log('Profile picture updated successfully:', res.data.url)
      } else {
        throw new Error('Upload response missing URL')
      }
    } catch (err) {
      console.error('Error uploading image:', err)
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      if (err?.response?.status === 401) {
        setError('Session expired. Please log in again and retry.')
      } else if (err?.response?.status === 503) {
        setError('Image service is not configured. Please contact support.')
      } else if (err?.response?.status === 502) {
        setError('Image upload failed. Please try again later.')
      } else if (err?.response?.status === 400) {
        setError(err.response.data.message || 'Invalid file. Please try again.')
      } else if (err?.response?.status === 413) {
        setError('File too large. Please select a smaller image.')
      } else if (err?.response?.status === 415) {
        setError('Unsupported file type. Please select an image file.')
      } else {
        setError('Failed to upload image. Please try again.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
          {currentPhotoURL ? (
            <img
              src={currentPhotoURL}
              alt="Profile"
              className="w-full h-full object-cover"
              onLoad={() => console.log('Profile image loaded successfully:', currentPhotoURL)}
              onError={(e) => {
                console.error('Profile image failed to load:', currentPhotoURL, e);
                console.log('Image error event:', e.target);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
        </div>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          )}
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      <p className="mt-2 text-sm text-gray-500">
        {isUploading ? 'Uploading...' : 'Click to change profile picture'}
      </p>
    </div>
  )
}

export default ProfilePicture 

ProfilePicture.propTypes = {
  photoURL: PropTypes.string,
  onPhotoUpdate: PropTypes.func.isRequired,
  userId: PropTypes.string
} 