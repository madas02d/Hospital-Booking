import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { format, isWeekend, parseISO } from 'date-fns';
import { FaCalendarAlt, FaClock, FaShieldAlt, FaMapMarkerAlt, FaPhone, FaGlobe, FaStar, FaUserMd, FaHospital } from 'react-icons/fa';
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

  // Accept either a selected doctor or a clinic passed from FindClinics
  const passedDoctor = location.state?.doctor;
  const passedClinic = location.state?.clinicName ? {
    name: location.state?.clinicName,
    address: location.state?.clinicAddress,
    coordinates: location.state?.clinicCoordinates,
    type: location.state?.clinicType,
    specialties: location.state?.clinicSpecialties,
    phone: location.state?.clinicPhone,
    website: location.state?.clinicWebsite
  } : null;

  // Normalize to a booking target
  const bookingTarget = passedDoctor || (passedClinic ? {
    _id: passedClinic.coordinates ? `${passedClinic.coordinates[0]},${passedClinic.coordinates[1]}` : passedClinic.name,
    name: passedClinic.name,
    specialty: passedClinic.specialties ? passedClinic.specialties.join(', ') : 'Clinic Visit',
    address: passedClinic.address,
    type: passedClinic.type,
    specialties: passedClinic.specialties,
    phone: passedClinic.phone,
    website: passedClinic.website
  } : null);

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
  const [availableTimes, setAvailableTimes] = useState(getTimeOptions());

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else if (!bookingTarget) {
      navigate('/find-clinics');
    } else {
      setIsLoading(false);
    }
  }, [currentUser, bookingTarget, navigate]);

  // Fetch booked times for the selected doctor and date
  useEffect(() => {
    const fetchBookedTimes = async () => {
      if (!formData.date || !bookingTarget?._id) {
        setAvailableTimes(getTimeOptions());
        return;
      }
      try {
        const res = await api.get('/appointments', { params: { doctorId: bookingTarget._id, date: formData.date } });
        const times = res.data
          .filter(appt => appt.doctorId === bookingTarget._id && appt.date.slice(0, 10) === formData.date && appt.status === 'scheduled')
          .map(appt => appt.time);
        const allTimes = getTimeOptions();
        const available = allTimes.filter(t =>
          !times.some(bt => Math.abs(timeToMinutes(bt) - timeToMinutes(t)) < 30)
        );
        setAvailableTimes(available);
        if (formData.time && !available.includes(formData.time)) {
          setFormData(prev => ({ ...prev, time: '' }));
        }
      } catch {
        setAvailableTimes(getTimeOptions());
      }
    };
    fetchBookedTimes();
    // eslint-disable-next-line
  }, [formData.date, bookingTarget?._id]);

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

  if (!bookingTarget) {
    return null; // handled by redirect
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
        doctorId: bookingTarget._id,
        doctorName: bookingTarget.name,
        specialty: bookingTarget.specialty,
        insurance: formData.insurance,
        date: formData.date,
        time: formData.time,
        reason: formData.reason,
        notes: formData.notes,
        clinicAddress: bookingTarget.address,
        clinicType: bookingTarget.type,
        clinicPhone: bookingTarget.phone,
        clinicWebsite: bookingTarget.website
      };

      const response = await api.post('/appointments', appointmentData);

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

  const getClinicIcon = (type) => {
    if (type?.toLowerCase().includes('hospital')) {
      return <FaHospital className="h-6 w-6 text-red-600" />;
    } else if (type?.toLowerCase().includes('practice') || type?.toLowerCase().includes('praxis')) {
      return <FaUserMd className="h-6 w-6 text-blue-600" />;
    } else {
      return <FaHospital className="h-6 w-6 text-green-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Appointment</h1>
          <p className="text-lg text-gray-600">Schedule your visit with confidence</p>
        </div>

        {/* Clinic Information Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-start gap-4 mb-4">
            {getClinicIcon(bookingTarget.type)}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{bookingTarget.name}</h2>
              <p className="text-lg text-blue-600 mb-2">{bookingTarget.specialty}</p>
              {bookingTarget.type && (
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full mb-3">
                  {bookingTarget.type}
                </span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {bookingTarget.address && (
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Address</p>
                    <p className="text-sm text-gray-600">{bookingTarget.address}</p>
                  </div>
                </div>
              )}
              
              {bookingTarget.phone && (
                <div className="flex items-center gap-3">
                  <FaPhone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <a href={`tel:${bookingTarget.phone}`} className="text-sm text-blue-600 hover:text-blue-800">
                      {bookingTarget.phone}
                    </a>
                  </div>
                </div>
              )}
              
              {bookingTarget.website && (
                <div className="flex items-center gap-3">
                  <FaGlobe className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Website</p>
                    <a href={bookingTarget.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
                      Visit Website
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FaShieldAlt className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Insurance</p>
                  <p className="text-sm text-green-600">Accepts German Health Insurance</p>
                </div>
              </div>
              
              {bookingTarget.specialties && bookingTarget.specialties.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Available Specialties</p>
                  <div className="flex flex-wrap gap-2">
                    {bookingTarget.specialties.slice(0, 4).map((specialty, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {specialty}
                      </span>
                    ))}
                    {bookingTarget.specialties.length > 4 && (
                      <span className="text-xs text-gray-500">+{bookingTarget.specialties.length - 4} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointment Details</h2>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="insurance" className="block text-sm font-medium text-gray-700 mb-2">
                Health Insurance
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaShieldAlt className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="insurance"
                  name="insurance"
                  required
                  value={formData.insurance}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Date
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                  </div>
                  <DatePicker
                    selected={formData.date ? parseISO(formData.date) : null}
                    onChange={handleDateChange}
                    minDate={new Date()}
                    filterDate={date => !isWeekend(date) && !isGermanHoliday(date)}
                    dateFormat="yyyy-MM-dd"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3"
                    placeholderText="Select a date"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Weekends and holidays are not available</p>
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaClock className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="time"
                    name="time"
                    required
                    value={formData.time}
                    onChange={handleChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3"
                  >
                    <option value="">Select a time</option>
                    {availableTimes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">Available times: 07:00 - 18:00</p>
              </div>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Visit
              </label>
              <textarea
                id="reason"
                name="reason"
                rows={4}
                required
                value={formData.reason}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-3"
                placeholder="Please describe your reason for visit, symptoms, or concerns..."
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-3"
                placeholder="Any additional information you'd like to share with the doctor..."
              />
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
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
