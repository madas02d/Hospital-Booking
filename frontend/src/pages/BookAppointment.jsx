import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { format, isWeekend, parseISO } from 'date-fns';
import { FaCalendarAlt, FaClock, FaShieldAlt } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// German public holidays for 2024 (add more as needed)
const GERMAN_PUBLIC_HOLIDAYS_2024 = [
  '2024-01-01', '2024-03-29', '2024-04-01', '2024-05-01',
  '2024-05-09', '2024-05-20', '2024-10-03', '2024-12-25', '2024-12-26'
];
function isGermanHoliday(date) {
  return GERMAN_PUBLIC_HOLIDAYS_2024.includes(format(date, 'yyyy-MM-dd'));
}

function getTimeOptions() {
  const options = [];
  for (let h = 7; h <= 18; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 18 && m > 0) continue;
      const hour = h.toString().padStart(2, '0');
      const min = m.toString().padStart(2, '0');
      options.push(`${hour}:${min}`);
    }
  }
  return options;
}

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

const HEALTH_INSURANCES = [
  { id: 'tk', name: 'Techniker Krankenkasse (TK)' },
  { id: 'aok', name: 'AOK' },
  { id: 'barmer', name: 'Barmer' },
  { id: 'dak', name: 'DAK-Gesundheit' },
  { id: 'ikk', name: 'IKK classic' },
  { id: 'hkk', name: 'HKK' },
  { id: 'heag', name: 'HEAG' },
  { id: 'bkk', name: 'BKK' }
];

const BookAppointment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const doctor = location.state?.doctor;

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    reason: '',
    notes: '',
    insurance: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // const [bookedTimes, setBookedTimes] = useState([]); // No longer needed
  const [availableTimes, setAvailableTimes] = useState(getTimeOptions());

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else if (!doctor) {
      navigate('/find-clinics');
    } else {
      setIsLoading(false);
    }
  }, [currentUser, doctor, navigate]);

  // Fetch booked times for the selected doctor and date
  useEffect(() => {
    const fetchBookedTimes = async () => {
      if (!formData.date || !doctor?._id) {
        setAvailableTimes(getTimeOptions());
        return;
      }
      try {
        const res = await api.get('/api/appointments', { params: { doctorId: doctor._id, date: formData.date } });
        const times = res.data
          .filter(appt => appt.doctorId === doctor._id && appt.date.slice(0, 10) === formData.date && appt.status === 'scheduled')
          .map(appt => appt.time);
        // setBookedTimes(times); // No longer needed
        // Build available times (exclude booked and within 30 min)
        const allTimes = getTimeOptions();
        const available = allTimes.filter(t =>
          !times.some(bt => Math.abs(timeToMinutes(bt) - timeToMinutes(t)) < 30)
        );
        setAvailableTimes(available);
        // If selected time is now unavailable, reset it
        if (formData.time && !available.includes(formData.time)) {
          setFormData(prev => ({ ...prev, time: '' }));
        }
      } catch {
        setAvailableTimes(getTimeOptions());
      }
    };
    fetchBookedTimes();
    // eslint-disable-next-line
  }, [formData.date, doctor?._id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return null; // This will be handled by the useEffect redirect
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Date validation: prevent weekends and holidays
  const handleDateChange = (date) => {
    setError(null);
    setFormData(prev => ({
      ...prev,
      date: date ? format(date, 'yyyy-MM-dd') : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const appointmentData = {
        doctorId: doctor._id,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        insurance: formData.insurance,
        date: formData.date,
        time: formData.time,
        reason: formData.reason,
        notes: formData.notes
      };

      const response = await api.post('/api/appointments', appointmentData);

      if (response.data) {
        navigate('/appointments', { 
          state: { 
            message: 'Appointment booked successfully!' 
          }
        });
      }
    } catch (err) {
      console.error('Error booking appointment:', err);
      if (err.response?.status === 409) {
        setError('This time slot is already booked for this doctor. Please choose another time.');
      } else {
        setError(
          err.response?.data?.message || 
          'Failed to book appointment. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Doctor Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
              <p className="text-gray-600">{doctor.specialty}</p>
            </div>
            <div className="flex items-center text-gray-600">
              <FaShieldAlt className="mr-2" />
              <span>Accepts German Health Insurance</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Book Appointment</h2>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="insurance" className="block text-sm font-medium text-gray-700">
                Health Insurance
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaShieldAlt className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="insurance"
                  name="insurance"
                  required
                  value={formData.insurance}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="">Select your health insurance</option>
                  {HEALTH_INSURANCES.map((insurance) => (
                    <option key={insurance.id} value={insurance.id}>
                      {insurance.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                </div>
                <DatePicker
                  selected={formData.date ? parseISO(formData.date) : null}
                  onChange={date => {
                    setError(null);
                    setFormData(prev => ({
                      ...prev,
                      date: date ? format(date, 'yyyy-MM-dd') : ''
                    }));
                  }}
                  minDate={new Date()}
                  filterDate={date => !isWeekend(date) && !isGermanHoliday(date)}
                  dateFormat="yyyy-MM-dd"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                Time
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaClock className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="time"
                  name="time"
                  required
                  value={formData.time}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="">Select a time</option>
                  {availableTimes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                Reason for Visit
              </label>
              <div className="mt-1">
                <textarea
                  id="reason"
                  name="reason"
                  rows={3}
                  required
                  value={formData.reason}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Please describe your reason for visit"
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Additional Notes (Optional)
              </label>
              <div className="mt-1">
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Any additional information you'd like to share"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment; 