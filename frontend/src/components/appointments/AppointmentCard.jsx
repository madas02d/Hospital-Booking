import React from 'react';
import { format } from 'date-fns';
import { FaCalendarAlt, FaClock, FaUserMd, FaMapMarkerAlt } from 'react-icons/fa';

const AppointmentCard = ({ appointment, onCancel, onEdit }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    return format(new Date(date), 'EEEE, MMMM do, yyyy');
  };

  const formatTime = (time) => {
    return time;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {appointment.doctorName}
          </h3>
          <p className="text-sm text-gray-600">{appointment.specialty}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-gray-600">
          <FaCalendarAlt className="mr-2 text-blue-500" />
          <span>{formatDate(appointment.date)}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <FaClock className="mr-2 text-blue-500" />
          <span>{formatTime(appointment.time)}</span>
        </div>

        <div className="flex items-center text-gray-600">
          <FaUserMd className="mr-2 text-blue-500" />
          <span>Dr. {appointment.doctorName}</span>
        </div>

        {appointment.reason && (
          <div className="text-gray-700">
            <strong>Reason:</strong> {appointment.reason}
          </div>
        )}

        {appointment.notes && (
          <div className="text-gray-700">
            <strong>Notes:</strong> {appointment.notes}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
        {appointment.status === 'scheduled' && (
          <>
            <button
              onClick={() => onEdit(appointment)}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onCancel(appointment._id)}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;
