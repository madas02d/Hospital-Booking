# Profile Picture Upload System

This document explains how the profile picture upload system works in the Hospital Booking application.

## Overview

The system allows users to upload profile pictures which are:
1. Stored in Cloudinary (cloud image hosting service)
2. URLs are saved in the MongoDB database
3. Automatically displayed in the user interface

## Backend Implementation

### 1. Cloudinary Configuration
- **Environment Variables** (in `.env`):
  ```
  CLOUDINARY_CLOUD_NAME=dvpclufrt
  CLOUDINARY_API_KEY=883351784998811
  CLOUDINARY_API_SECRET=_l9B3B4MeT-YDi4Bt4BzqHdqydE
  ```

### 2. API Endpoint
- **Route**: `POST /api/auth/profile/picture`
- **Middleware**: Protected route requiring authentication
- **File Upload**: Uses Multer for handling multipart/form-data

### 3. Upload Process
1. **File Validation**: Checks file type (image only) and size (max 5MB)
2. **Cloudinary Upload**: Uploads to 'profile-pictures' folder with user-specific ID
3. **Image Processing**: Automatically resizes to 400x400px with face detection
4. **Database Update**: Saves the Cloudinary URL to user.profilePicture field
5. **Cleanup**: Optionally removes old profile pictures from Cloudinary

### 4. Response Format
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/dvpclufrt/image/upload/v1234567890/profile-pictures/user_123.jpg",
  "user": {
    "id": "123",
    "firstName": "John",
    "lastName": "Doe",
    "profilePicture": "https://res.cloudinary.com/dvpclufrt/image/upload/v1234567890/profile-pictures/user_123.jpg",
    // ... other user fields
  },
  "message": "Profile picture uploaded successfully"
}
```

## Frontend Implementation

### 1. ProfilePicture Component
- **Location**: `frontend/src/components/profile/ProfilePicture.jsx`
- **Features**:
  - Drag & drop or click to upload
  - File type and size validation
  - Upload progress indicator
  - Error handling and user feedback
  - Automatic image display after upload

### 2. Profile Page Integration
- **Location**: `frontend/src/pages/Profile.jsx`
- **Features**:
  - Displays current profile picture
  - Handles photo update callbacks
  - Shows success/error messages
  - Integrates with AuthContext for state management

### 3. AuthContext Integration
- **Location**: `frontend/src/contexts/AuthContext.jsx`
- **Features**:
  - Manages user state including profilePicture
  - Handles profile updates
  - Maintains authentication state

## Database Schema

### User Model
```javascript
{
  profilePicture: {
    type: String,
    // Stores the Cloudinary URL
  }
  // ... other user fields
}
```

## Security Features

1. **Authentication Required**: Only logged-in users can upload
2. **File Type Validation**: Only image files allowed
3. **File Size Limit**: Maximum 5MB per image
4. **User Isolation**: Each user can only update their own profile
5. **Secure URLs**: Uses HTTPS Cloudinary URLs

## Error Handling

### Common Error Scenarios
1. **File Too Large**: Returns 413 status with clear message
2. **Invalid File Type**: Returns 415 status with clear message
3. **Cloudinary Service Down**: Returns 502 status
4. **Authentication Failed**: Returns 401 status
5. **Database Update Failed**: Returns 500 status

### User-Friendly Messages
- Clear, actionable error messages
- Automatic error message cleanup after 5 seconds
- Success message cleanup after 3 seconds

## Usage Example

### Upload a Profile Picture
1. Navigate to Profile page
2. Click the camera icon on the profile picture
3. Select an image file (JPG, PNG, etc.)
4. Wait for upload to complete
5. See the new profile picture immediately

### Update Profile Picture
- Simply upload a new image to replace the existing one
- Old image is automatically cleaned up from Cloudinary
- Database is updated with the new URL

## Testing

The system has been tested and verified to work with:
- ✅ Cloudinary connection
- ✅ File upload functionality
- ✅ Database updates
- ✅ Frontend state synchronization
- ✅ Error handling
- ✅ Security measures

## Troubleshooting

### Common Issues
1. **Upload Fails**: Check Cloudinary credentials in .env
2. **Image Not Displaying**: Verify the URL is accessible
3. **Database Not Updated**: Check MongoDB connection
4. **Frontend Not Updating**: Verify AuthContext state management

### Debug Information
- Check browser console for frontend logs
- Check server console for backend logs
- Verify environment variables are loaded
- Test Cloudinary connection separately 