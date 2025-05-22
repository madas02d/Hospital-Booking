import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { sendAppointmentEmail } from '../../services/emailService';

const BookingForm = ({ clinic, onClose }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    reason: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const availableTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00',
    '14:00', '14:30', '15:00', '15:30', '16:00'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await sendAppointmentEmail({
        to: currentUser.email,
        clinicName: clinic.name,
        clinicEmail: clinic.email || 'clinic@example.com', // Replace with actual clinic email
        patientName: currentUser.displayName || 'Patient',
        appointmentDate: formData.date,
        appointmentTime: formData.time,
        reason: formData.reason,
        notes: formData.notes
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to send appointment request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-4 bg-green-50 text-green-700 rounded-md">
        <p>Appointment request sent successfully!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-2 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date
        </label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Time Slot
        </label>
        <select
          name="time"
          value={formData.time}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          required
          disabled={loading}
        >
          <option value="">Select a time slot</option>
          {availableTimeSlots.map(slot => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reason for Visit
        </label>
        <input
          type="text"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          required
          disabled={loading}
          placeholder="Brief description of your visit"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          disabled={loading}
          placeholder="Any additional information you'd like to share"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Request Appointment'}
        </button>
      </div>
    </form>
  );
};

export default BookingForm; 