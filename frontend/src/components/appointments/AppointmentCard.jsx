import React from 'react'
import { format } from 'date-fns'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'

export default function AppointmentCard({ appointment, refreshData }) {
  const handleCancel = async () => {
    try {
      const appointmentRef = doc(db, 'appointments', appointment.id)
      await updateDoc(appointmentRef, {
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      })
      
      if (refreshData) {
        refreshData()
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
    }
  }

  const formatDateTime = (date, time) => {
    try {
      const dateTime = new Date(`${date}T${time}`)
      return format(dateTime, 'MMM d, yyyy h:mm a')
    } catch (error) {
      return 'Invalid date'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Dr. {appointment.doctorName}
          </h3>
          <p className="text-gray-600 mt-1">
            {appointment.specialty || 'General Medicine'}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          appointment.status === 'cancelled' 
            ? 'bg-red-100 text-red-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-gray-600">
          <span className="font-medium">Date & Time:</span>{' '}
          {formatDateTime(appointment.date, appointment.time)}
        </p>
        {appointment.notes && (
          <p className="text-gray-600">
            <span className="font-medium">Notes:</span> {appointment.notes}
          </p>
        )}
      </div>

      {appointment.status !== 'cancelled' && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Cancel Appointment
          </button>
        </div>
      )}
    </div>
  )
} 