import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import { FaCalendarAlt, FaClock, FaMoneyBillWave, FaTimes } from 'react-icons/fa';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      await api.patch(`/appointments/${appointmentId}/cancel`);
      fetchAppointments(); // Refresh the appointments list
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setError('Failed to cancel appointment. Please try again.');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Please log in to view your appointments</h2>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Login
            </button>
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
            <p className="mt-4 text-gray-600">Loading appointments...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={fetchAppointments}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Retry
            </button>
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
            <p className="mt-2 text-gray-600">You haven&#39;t booked any appointments yet.</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Appointments</h1>
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
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    appointment.status === 'scheduled'
                      ? 'bg-green-100 text-green-800'
                      : appointment.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
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
                <div className="flex items-center text-gray-600">
                  <FaMoneyBillWave className="mr-2" />
                  <span>${appointment.consultationFee}</span>
                </div>
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
                {appointment.status === 'scheduled' && (
                  <button
                    onClick={() => handleCancelAppointment(appointment._id)}
                    className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    <FaTimes className="mr-2" />
                    Cancel Appointment
                  </button>
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