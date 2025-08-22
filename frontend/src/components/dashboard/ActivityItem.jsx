import React from 'react';

function ActivityItem({ activity }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'booking':
        return '📅'
      case 'cancellation':
        return '❌'
      case 'completion':
        return '✅'
      default:
        return '📌'
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'booking':
        return 'text-blue-600'
      case 'cancellation':
        return 'text-red-600'
      case 'completion':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.abs(now - date) / 36e5 // Convert to hours

    if (diffInHours < 24) {
      if (diffInHours < 1) {
        return 'Just now'
      }
      return `${Math.floor(diffInHours)} hours ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  return (
    <div className="flex items-start space-x-3 py-3">
      <div className="text-xl">{getActivityIcon(activity.type)}</div>
      <div className="flex-1">
        <p className={`${getActivityColor(activity.type)}`}>
          {activity.description}
        </p>
        <p className="text-sm text-gray-500">
          {formatDate(activity.date)}
        </p>
        {activity.appointmentDate && (
          <p className="text-sm text-gray-500">
            Appointment: {new Date(activity.appointmentDate).toLocaleDateString()} at {activity.appointmentTime}
          </p>
        )}
      </div>
    </div>
  )
}

export default ActivityItem 