import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import { FaCalendarAlt, FaClock, FaMoneyBillWave, FaTimes, FaPhone, FaMapMarkerAlt, FaGlobe, FaExclamationTriangle } from 'react-icons/fa';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else {
      fetchAppointments();
    }
  }, [currentUser, navigate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/appointments');
      setAppointments(response.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      setCancellingId(appointmentId);
      setError(null);
      await api.patch(`/appointments/${appointmentId}/cancel`);
      setSuccessMessage('Appointment cancelled successfully!');
      setShowCancelConfirm(null);
      fetchAppointments(); // Refresh the appointments list
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setError('Failed to cancel appointment. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const confirmCancel = (appointmentId) => {
    setShowCancelConfirm(appointmentId);
  };

  const cancelCancel = () => {
    setShowCancelConfirm(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'confirmed':
        return '✅';
      case 'cancelled':
        return '❌';
      case 'completed':
        return '🏥';
      default:
        return '📅';
    }
  };

  const canCancelAppointment = (appointment) => {
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
    
    // Can cancel if status is pending or confirmed, and appointment is more than 2 hours away
    return (appointment.status === 'pending' || appointment.status === 'confirmed') && hoursUntilAppointment > 2;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your appointments...</p>
          </div>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">No appointments found</h2>
            <p className="mt-2 text-gray-600">You haven't booked any appointments yet.</p>
            <button
              onClick={() => navigate('/find-clinics')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Book an Appointment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <button
            onClick={() => navigate('/find-clinics')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Book New Appointment
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-600">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {appointments.map((appointment) => (
            <div
              key={appointment._id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{appointment.doctorName}</h3>
                  <p className="text-sm text-gray-600">{appointment.specialty}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                  {getStatusIcon(appointment.status)} {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <FaCalendarAlt className="mr-2" />
                  <span>{format(new Date(appointment.date), 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaClock className="mr-2" />
                  <span>{appointment.time}</span>
                </div>
                
                {appointment.consultationFee > 0 && (
                  <div className="flex items-center text-gray-600">
                    <FaMoneyBillWave className="mr-2" />
                    <span>€{appointment.consultationFee}</span>
                  </div>
                )}

                {appointment.clinicAddress && (
                  <div className="flex items-start text-gray-600">
                    <FaMapMarkerAlt className="mr-2 mt-0.5" />
                    <span className="text-sm">{appointment.clinicAddress}</span>
                  </div>
                )}

                {appointment.clinicPhone && (
                  <div className="flex items-center text-gray-600">
                    <FaPhone className="mr-2" />
                    <a href={`tel:${appointment.clinicPhone}`} className="text-sm text-blue-600 hover:text-blue-800">
                      {appointment.clinicPhone}
                    </a>
                  </div>
                )}

                {appointment.clinicWebsite && (
                  <div className="flex items-center text-gray-600">
                    <FaGlobe className="mr-2" />
                    <a href={appointment.clinicWebsite} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
                      Visit Website
                    </a>
                  </div>
                )}

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Reason for Visit</h4>
                  <p className="mt-1 text-sm text-gray-600">{appointment.reason}</p>
                </div>

                {appointment.notes && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900">Additional Notes</h4>
                    <p className="mt-1 text-sm text-gray-600">{appointment.notes}</p>
                  </div>
                )}

                {appointment.insurance && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900">Insurance</h4>
                    <p className="mt-1 text-sm text-gray-600">{appointment.insurance}</p>
                  </div>
                )}

                {/* Cancel Button */}
                {canCancelAppointment(appointment) && (
                  <div className="mt-4">
                    {showCancelConfirm === appointment._id ? (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="flex items-center mb-2">
                          <FaExclamationTriangle className="text-red-600 mr-2" />
                          <p className="text-sm font-medium text-red-800">Confirm Cancellation</p>
                        </div>
                        <p className="text-sm text-red-700 mb-3">
                          Are you sure you want to cancel this appointment? This action cannot be undone.
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleCancelAppointment(appointment._id)}
                            disabled={cancellingId === appointment._id}
                            className="flex-1 bg-red-600 text-white text-sm py-2 px-3 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancellingId === appointment._id ? 'Cancelling...' : 'Yes, Cancel'}
                          </button>
                          <button
                            onClick={cancelCancel}
                            className="flex-1 bg-gray-300 text-gray-700 text-sm py-2 px-3 rounded-md hover:bg-gray-400"
                          >
                            Keep Appointment
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => confirmCancel(appointment._id)}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        <FaTimes className="mr-2" />
                        Cancel Appointment
                      </button>
                    )}
                  </div>
                )}

                {/* Cannot Cancel Message */}
                {!canCancelAppointment(appointment) && (appointment.status === 'pending' || appointment.status === 'confirmed') && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <FaExclamationTriangle className="inline mr-1" />
                      Cannot cancel: Appointment is less than 2 hours away
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
