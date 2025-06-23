import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import ClinicMap from '../components/map/ClinicMap';
import { useAuth } from '../contexts/AuthContext';
import { FaPhone, FaMapMarkerAlt, FaClock, FaStar, FaDirections, FaCalendarAlt, FaShieldAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

// Move libraries outside component to prevent recreation
const GOOGLE_MAPS_LIBRARIES = ['places'];

// Debug: Check if environment variables are loaded
console.log('Google Maps API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing');

const SPECIALTIES = [
  { value: '', label: 'All Medical Facilities' },
  { value: 'general practitioner', label: 'General Practice' },
  { value: 'dentist', label: 'Dental Clinic' },
  { value: 'pediatrician', label: 'Pediatric Care' },
  { value: 'cardiologist', label: 'Cardiology' },
  { value: 'dermatologist', label: 'Dermatology' },
  { value: 'orthopedic', label: 'Orthopedics' },
  { value: 'ophthalmologist', label: 'Eye Care' },
  { value: 'gynecologist', label: 'Gynecology' }
];

const HEALTH_INSURANCES = [
  { id: 'tk', name: 'Techniker Krankenkasse (TK)', accepted: true },
  { id: 'aok', name: 'AOK', accepted: true },
  { id: 'barmer', name: 'Barmer', accepted: true },
  { id: 'dak', name: 'DAK-Gesundheit', accepted: true },
  { id: 'ikk', name: 'IKK classic', accepted: true },
  { id: 'hkk', name: 'HKK', accepted: true },
  { id: 'heag', name: 'HEAG', accepted: true },
  { id: 'bkk', name: 'BKK', accepted: true }
];

export default function FindClinics() {
  const { currentUser } = useAuth();
  const [mapRef, setMapRef] = useState(null);
  const [center, setCenter] = useState({ lat: 52.5200, lng: 13.4050 }); // Default center
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [searchRadius, setSearchRadius] = useState(5000);
  const [nearbyLocations, setNearbyLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [clinicDetails, setClinicDetails] = useState({});
  const navigate = useNavigate();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Generate nearby locations based on user's position
  const generateNearbyLocations = (userLat, userLng) => {
    const locations = [];
    const radius = 0.05; // Approximately 5km radius
    const points = 8; // Number of points around the user

    for (let i = 0; i < points; i++) {
      const angle = (i * 2 * Math.PI) / points;
      const lat = userLat + radius * Math.cos(angle);
      const lng = userLng + radius * Math.sin(angle);
      
      // Use reverse geocoding to get location names
      if (mapRef) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat, lng } },
          (results, status) => {
            if (status === 'OK' && results[0]) {
              const locationName = results[0].address_components.find(
                component => component.types.includes('sublocality') || 
                           component.types.includes('locality')
              )?.long_name || `Location ${i + 1}`;

              locations.push({
                name: locationName,
                lat,
                lng
              });

              // Update locations state when we have all points
              if (locations.length === points) {
                setNearbyLocations(locations);
                // Set the first location as selected by default
                setSelectedLocation(locations[0]);
              }
            }
          }
        );
      }
    }
  };

  // Get user's location when component mounts or when user logs in
  useEffect(() => {
    const getUserLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setCenter(location);
            generateNearbyLocations(location.lat, location.lng);
          },
          (error) => {
            console.error("Error getting location:", error);
            // Keep default center if geolocation fails
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      }
    };

    // If user is logged in, get their location
    if (currentUser) {
      getUserLocation();
    }
  }, [currentUser, mapRef]);

  // Debug: Log when the map is loaded
  useEffect(() => {
    console.log('Map loaded:', isLoaded);
    console.log('Current center:', center);
  }, [isLoaded, center]);

  const onMapLoad = useCallback((map) => {
    setMapRef(map);
  }, []);

  const onClinicSelect = useCallback((clinic) => {
    setSelectedClinic(clinic);
    // Fetch detailed information for the selected clinic
    if (mapRef) {
      const service = new window.google.maps.places.PlacesService(mapRef);
      service.getDetails(
        {
          placeId: clinic.place_id,
          fields: [
            'formatted_phone_number',
            'website',
            'opening_hours',
            'reviews',
            'formatted_address',
            'url',
            'international_phone_number'
          ]
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            console.log('Clinic details:', place); // Debug log
            setClinicDetails(prev => ({
              ...prev,
              [clinic.place_id]: place
            }));
          } else {
            console.error('Error fetching clinic details:', status);
          }
        }
      );
    }
  }, [mapRef]);

  const handleBookAppointment = (clinic) => {
    // Create a doctor object from the clinic data
    const doctor = {
      _id: clinic.place_id,
      name: clinic.name,
      specialty: selectedSpecialty || 'General Practice',
      acceptedInsurances: HEALTH_INSURANCES.filter(insurance => insurance.accepted),
      location: clinic.vicinity,
      rating: clinic.rating,
      reviews: clinic.user_ratings_total
    };

    // Navigate to booking page with doctor data
    navigate('/book', { state: { doctor } });
  };

  const searchClinics = useCallback(async () => {
    if (!mapRef || !center) return;

    setLoading(true);
    const service = new window.google.maps.places.PlacesService(mapRef);
    
    // Create a bounds object for the search
    const bounds = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(center.lat - 0.1, center.lng - 0.1),
      new window.google.maps.LatLng(center.lat + 0.1, center.lng + 0.1)
    );

    const request = {
      location: center,
      radius: searchRadius,
      type: 'doctor', // Changed from array to single type
      keyword: selectedSpecialty || undefined, // Only include keyword if specialty is selected
      bounds: bounds
    };

    try {
      service.nearbySearch(request, (results, status) => {
        console.log('Places API Status:', status); // Debug log
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          console.log('Found clinics:', results.length); // Debug log
          setClinics(results);
        } else {
          console.error('Places API error:', status);
          let errorMessage = 'Error finding nearby clinics';
          
          // More specific error messages
          switch (status) {
            case window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS:
              errorMessage = 'No clinics found in this area';
              break;
            case window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
              errorMessage = 'Search limit exceeded. Please try again later';
              break;
            case window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED:
              errorMessage = 'Request denied. Please check your API key';
              break;
            case window.google.maps.places.PlacesServiceStatus.INVALID_REQUEST:
              errorMessage = 'Invalid request. Please try different search parameters';
              break;
            default:
              errorMessage = `Error: ${status}`;
          }
          
          setError(errorMessage);
          setClinics([]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Error in nearbySearch:', error);
      setError('An unexpected error occurred while searching for clinics');
      setClinics([]);
      setLoading(false);
    }
  }, [mapRef, center, searchRadius, selectedSpecialty]);

  // Search for clinics when map is ready
  useEffect(() => {
    if (isLoaded && center && mapRef) {
      console.log('Searching for clinics...'); // Debug log
      searchClinics();
    }
  }, [isLoaded, center, mapRef, searchClinics]);

  const handleGetDirections = (clinic) => {
    if (clinic && clinic.geometry) {
      const { lat, lng } = clinic.geometry.location;
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        '_blank'
      );
    }
  };

  if (!isLoaded) {
    return <div className="flex justify-center items-center h-screen">Loading maps...</div>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Find Clinics Near You</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nearby Areas
            </label>
            <select
              value={selectedLocation ? selectedLocation.name : ''}
              onChange={(e) => {
                const location = nearbyLocations.find(loc => loc.name === e.target.value);
                setSelectedLocation(location);
                if (location) {
                  setCenter({ lat: location.lat, lng: location.lng });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Area</option>
              {nearbyLocations.map((location) => (
                <option key={location.name} value={location.name}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialty
            </label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {SPECIALTIES.map((specialty) => (
                <option key={specialty.value} value={specialty.value}>
                  {specialty.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Radius
            </label>
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1000}>1 km</option>
              <option value={2000}>2 km</option>
              <option value={5000}>5 km</option>
              <option value={10000}>10 km</option>
              <option value={20000}>20 km</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Clinic List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Nearby Clinics</h2>
            {loading && <p className="text-gray-600">Searching for clinics...</p>}
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
            {clinics.map((clinic) => (
              <div
                key={clinic.place_id}
                className={`p-4 border-b cursor-pointer transition-all duration-200 ${
                  selectedClinic?.place_id === clinic.place_id
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onClinicSelect(clinic)}
              >
                <h3 className="font-semibold text-gray-900">{clinic.name}</h3>
                <div className="mt-2 space-y-2">
                  <p className="text-gray-600 text-sm flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-red-500" />
                    {clinic.vicinity}
                  </p>
                  {clinic.rating && (
                    <div className="flex items-center">
                      <FaStar className="text-yellow-500 mr-1" />
                      <span className="text-sm text-gray-600">
                        {clinic.rating} ({clinic.user_ratings_total} reviews)
                      </span>
                    </div>
                  )}
                  {clinic.opening_hours && (
                    <p className={`text-sm flex items-center ${
                      clinic.opening_hours.open_now ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <FaClock className="mr-2" />
                      {clinic.opening_hours.open_now ? 'Open Now' : 'Closed'}
                    </p>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <FaShieldAlt className="mr-2 text-blue-500" />
                    <span>Accepts German Health Insurance</span>
                  </div>
                  {clinicDetails[clinic.place_id]?.formatted_phone_number && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <FaPhone className="mr-2 text-blue-500" />
                      {clinicDetails[clinic.place_id].formatted_phone_number}
                    </p>
                  )}
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGetDirections(clinic);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <FaDirections className="mr-1" />
                      Get Directions
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookAppointment(clinic);
                      }}
                      className="text-sm text-green-600 hover:text-green-800 flex items-center"
                    >
                      <FaCalendarAlt className="mr-1" />
                      Book Appointment
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && clinics.length === 0 && (
              <div className="p-4 text-center text-gray-600">
                No clinics found in this area
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <div className="h-[600px] rounded-lg overflow-hidden shadow-lg">
            {center && (
              <ClinicMap
                center={center}
                clinics={clinics}
                mapRef={mapRef}
                selectedClinic={selectedClinic}
                onClinicSelect={onClinicSelect}
                onMapLoad={onMapLoad}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 