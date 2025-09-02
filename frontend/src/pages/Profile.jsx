import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/common/Button'
import ProfilePicture from '../components/profile/ProfilePicture'
import UserAppointments from '../components/profile/UserAppointments'

function Profile() {
  console.log('Profile component - FUNCTION START')
  
  const { currentUser, updateProfile, changePassword, loading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    dateOfBirth: '',
    gender: '',
    bloodGroup: ''
  })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
  const [message, setMessage] = useState({ type: '', text: '' })

  // Debug logging
  console.log('Profile component - currentUser:', currentUser)
  console.log('Profile component - profilePicture:', currentUser?.profilePicture)
  console.log('Profile component - loading:', loading)
  console.log('Profile component - rendering...')

  // Update form data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: {
          street: currentUser.address?.street || '',
          city: currentUser.address?.city || '',
          state: currentUser.address?.state || '',
          zipCode: currentUser.address?.zipCode || ''
        },
        dateOfBirth: currentUser.dateOfBirth || '',
        gender: currentUser.gender || '',
        bloodGroup: currentUser.bloodGroup || ''
      })
    }
  }, [currentUser])

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  // Show error if no user is authenticated
  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
            <p className="text-gray-600">Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateProfile(formData)
      setMessage({ type: 'success', text: 'Profile updated successfully' })
      setIsEditing(false)
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update profile' })
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Handle nested address fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handlePhotoUpdate = async (photoURL, updatedUserData) => {
    try {
      console.log('Profile: handlePhotoUpdate called with:', { photoURL, updatedUserData })
      
      if (updatedUserData) {
        // If we have updated user data from the upload, update the AuthContext directly
        // This ensures the entire user object is synchronized
        await updateProfile({ profilePicture: photoURL })
        
        // The updateProfile function should already update the AuthContext state
        // But we can also manually update the local state if needed
        setFormData(prev => ({
          ...prev,
          profilePicture: photoURL
        }))
      } else {
        // Fallback: Update the profile with the new picture URL
        await updateProfile({ profilePicture: photoURL })
      }
      
      setMessage({ type: 'success', text: 'Profile picture updated successfully' })
      
      // Clear the success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' })
      }, 3000)
      
    } catch (err) {
      console.error('Error updating profile picture:', err)
      // Don't show error message if it's just a profile update failure
      // The ProfilePicture component will handle upload errors
      if (err?.response?.status !== 401) {
        setMessage({ type: 'error', text: 'Failed to update profile picture. Please try again.' })
        
        // Clear the error message after 5 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' })
        }, 5000)
      }
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!passwords.newPassword || passwords.newPassword !== passwords.confirmNewPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    try {
      await changePassword(passwords.currentPassword, passwords.newPassword)
      setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
      setMessage({ type: 'success', text: 'Password changed successfully' })
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to change password' })
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <div className="space-x-4">
            {!isEditing && (
              <Button 
                variant="secondary" 
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
            {/* <Button 
              variant="secondary" 
              onClick={logout}
            >
              Logout
            </Button> */}
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-md mb-6 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="mb-8">
          <ProfilePicture 
            photoURL={currentUser?.profilePicture || currentUser?.photoURL}
            onPhotoUpdate={handlePhotoUpdate}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{currentUser?.firstName || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{currentUser?.lastName || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{currentUser?.email || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{currentUser?.phone || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              {isEditing ? (
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">
                  {currentUser?.dateOfBirth 
                    ? new Date(currentUser.dateOfBirth).toLocaleDateString() 
                    : 'Not set'
                  }
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              {isEditing ? (
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-gray-900">{currentUser?.gender || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Group
              </label>
              {isEditing ? (
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              ) : (
                <p className="text-gray-900">{currentUser?.bloodGroup || 'Not set'}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Street</label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address?.street || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address?.city || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">State</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address?.state || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address?.zipCode || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-900">
                {currentUser?.address?.street || currentUser?.address?.city || currentUser?.address?.state || currentUser?.address?.zipCode 
                  ? `${currentUser.address.street || ''} ${currentUser.address.city || ''} ${currentUser.address.state || ''} ${currentUser.address.zipCode || ''}`.trim() || 'Not set'
                  : 'Not set'
                }
              </p>
            )}
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="secondary"
                onClick={() => {
                  setIsEditing(false)
                  setFormData({
                    firstName: currentUser?.firstName || '',
                    lastName: currentUser?.lastName || '',
                    email: currentUser?.email || '',
                    phone: currentUser?.phone || '',
                    address: {
                      street: currentUser?.address?.street || '',
                      city: currentUser?.address?.city || '',
                      state: currentUser?.address?.state || '',
                      zipCode: currentUser?.address?.zipCode || ''
                    },
                    dateOfBirth: currentUser?.dateOfBirth || '',
                    gender: currentUser?.gender || '',
                    bloodGroup: currentUser?.bloodGroup || ''
                  })
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </div>
          )}
        </form>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirmNewPassword}
                onChange={(e) => setPasswords(p => ({ ...p, confirmNewPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" variant="secondary">Update Password</Button>
            </div>
          </form>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <UserAppointments />
        </div>
      </div>
    </div>
  )
}

export default Profile 