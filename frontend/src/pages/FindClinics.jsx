import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { FaMapMarkerAlt, FaDirections, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Set your Mapbox access token here
// Get your free token from: https://account.mapbox.com/access-tokens/
mapboxgl.accessToken = 'pk.eyJ1IjoiZGU0ODg5MDQiLCJhIjoiY21lbDNud20wMDdhbjJqczViNHl2d24zMiJ9.RX5l_zsIqNoh4uNK-C6jOg';

const FindClinics = () => {
  const navigate = useNavigate();
  
  // Refs
  const mapContainer = useRef(null);
  const map = useRef(null);
  const geocoder = useRef(null);
  
  // State
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [center, setCenter] = useState({ lng: -74.006, lat: 40.7128 }); // Default to NYC
  
  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Create map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [center.lng, center.lat],
      zoom: 12
    });
    
    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add geolocate control
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    });
    map.current.addControl(geolocateControl, 'top-left');
    
    // Add geocoder
    geocoder.current = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      placeholder: 'Search for clinics, hospitals...',
      types: 'poi',
      poi_category: 'health'
    });
    
    map.current.addControl(geocoder.current);
    
    // Get user location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setCenter({ lat: latitude, lng: longitude });
          
          // Update map center
          if (map.current) {
            map.current.setCenter([longitude, latitude]);
            map.current.setZoom(14);
          }
          
          // Search for clinics near user location
          searchClinicsNearby(latitude, longitude);
        },
        () => {
          // Use default location and search
          searchClinicsNearby(center.lat, center.lng);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      // Fallback: search at default location
      searchClinicsNearby(center.lat, center.lng);
    }
    
    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);
  
  // Fallback clinic data for testing
  const fallbackClinics = [
    {
      id: 'fallback-1',
      name: 'City General Hospital',
      address: '123 Main Street, Downtown',
      coordinates: [-74.006, 40.7128],
      type: 'General Hospital'
    },
    {
      id: 'fallback-2',
      name: 'Community Health Clinic',
      address: '456 Oak Avenue, Midtown',
      coordinates: [-74.008, 40.7140],
      type: 'Community Clinic'
    },
    {
      id: 'fallback-3',
      name: 'Medical Center Plaza',
      address: '789 Pine Street, Uptown',
      coordinates: [-74.004, 40.7100],
      type: 'Medical Center'
    }
  ];

  // Distance helper (Haversine)
  function distanceInKm(a, b) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon));
    return R * c;
  }

  // Search for clinics nearby
  const searchClinicsNearby = useCallback(async (lat, lng) => {
    try {
      setLoading(true);
      
      // Use Mapbox Geocoding API to find health facilities
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/health%20clinic%20hospital.json?proximity=${lng},${lat}&types=poi&poi_category=health&limit=20&access_token=${mapboxgl.accessToken}`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const clinicData = data.features.map(feature => ({
          id: feature.id,
          name: feature.text,
          address: feature.place_name,
          coordinates: feature.center,
          type: feature.properties?.category || 'Health Facility'
        }));
        
        setClinics(clinicData);
        
        // Add markers to map
        if (map.current) {
          // Clear existing markers first
          const existingMarkers = document.querySelectorAll('.clinic-marker');
          existingMarkers.forEach(markerNode => markerNode.remove());
          
          clinicData.forEach(clinic => {
            new mapboxgl.Marker({ 
              color: '#3B82F6',
              className: 'clinic-marker'
            })
              .setLngLat(clinic.coordinates)
              .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                  .setHTML(`
                    <div class="p-2">
                      <h3 class="font-semibold">${clinic.name}</h3>
                      <p class="text-sm text-gray-600">${clinic.address}</p>
                      <p class="text-xs text-blue-600">${clinic.type}</p>
                    </div>
                  `)
              )
              .addTo(map.current);
          });
        }
      } else {
        // Use fallback data if no clinics found
        setClinics(fallbackClinics);
        
        // Add fallback markers to map
        if (map.current) {
          fallbackClinics.forEach(clinic => {
            new mapboxgl.Marker({ 
              color: '#10B981',
              className: 'clinic-marker'
            })
              .setLngLat(clinic.coordinates)
              .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                  .setHTML(`
                    <div class="p-2">
                      <h3 class="font-semibold">${clinic.name}</h3>
                      <p class="text-sm text-gray-600">${clinic.address}</p>
                      <p class="text-xs text-green-600">${clinic.type} (Sample Data)</p>
                    </div>
                  `)
              )
              .addTo(map.current);
          });
        }
      }
    } catch {
      // Use fallback clinic data due to API error
      setClinics(fallbackClinics);
      
      // Add fallback markers to map
      if (map.current) {
        fallbackClinics.forEach(clinic => {
          new mapboxgl.Marker({ 
            color: '#10B981',
            className: 'clinic-marker'
          })
            .setLngLat(clinic.coordinates)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <div class="p-2">
                    <h3 class="font-semibold">${clinic.name}</h3>
                    <p class="text-sm text-gray-600">${clinic.address}</p>
                    <p class="text-xs text-green-600">${clinic.type} (Sample Data)</p>
                  </div>
                `)
            )
            .addTo(map.current);
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      
      // Use Mapbox Geocoding API
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?types=poi&poi_category=health&access_token=${mapboxgl.accessToken}`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const newCenter = { lng: feature.center[0], lat: feature.center[1] };
        
        setCenter(newCenter);
        
        if (map.current) {
          map.current.setCenter(feature.center);
          map.current.setZoom(15);
        }
        
        // Search for clinics in this area
        searchClinicsNearby(newCenter.lat, newCenter.lng);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [searchQuery, searchClinicsNearby]);
  
  // Book appointment
  const handleBookAppointment = (clinic) => {
    navigate('/book-appointment', { 
      state: { 
        clinicName: clinic.name,
        clinicAddress: clinic.address,
        clinicCoordinates: clinic.coordinates
      }
    });
  };

  const handleBookNearest = () => {
    if (!userLocation || clinics.length === 0) return;
    const userPoint = { lat: userLocation.lat, lng: userLocation.lng };
    let nearest = null;
    let minDist = Number.POSITIVE_INFINITY;
    clinics.forEach(c => {
      const clinicPoint = { lat: c.coordinates[1], lng: c.coordinates[0] };
      const d = distanceInKm(userPoint, clinicPoint);
      if (d < minDist) {
        minDist = d;
        nearest = c;
      }
    });
    if (nearest) {
      handleBookAppointment(nearest);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Find Clinics Near You
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover healthcare facilities in your area with precise location data 
            and book appointments at the nearest clinic.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Search for clinics, hospitals, or medical centers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          {/* Find Clinics Near Me Button */}
          <div className="text-center space-x-2">
            <button
              onClick={() => {
                if (userLocation) {
                  searchClinicsNearby(userLocation.lat, userLocation.lng);
                  if (map.current) {
                    map.current.setCenter([userLocation.lng, userLocation.lat]);
                    map.current.setZoom(14);
                  }
                } else {
                  // Try to get location again
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const { latitude, longitude } = position.coords;
                        setUserLocation({ lat: latitude, lng: longitude });
                        setCenter({ lat: latitude, lng: longitude });
                        searchClinicsNearby(latitude, longitude);
                        if (map.current) {
                          map.current.setCenter([longitude, latitude]);
                          map.current.setZoom(14);
                        }
                      },
                      () => {
                        alert('Unable to get your location. Please try searching for a specific area.');
                      }
                    );
                  }
                }
              }}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Find Clinics Near Me'}
            </button>
            <button
              onClick={handleBookNearest}
              disabled={loading || !userLocation || clinics.length === 0}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Book Nearest Clinic
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div 
                ref={mapContainer}
                className="w-full h-96"
                style={{ minHeight: '400px' }}
              />
              
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <div className="text-gray-500">Loading map...</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Clinics List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Nearby Clinics
              </h2>
              {loading && (
                <div className="flex items-center text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Searching...
                </div>
              )}
            </div>
            
            {clinics.length === 0 && !loading ? (
              <div className="text-center py-8 text-gray-500">
                <FaMapMarkerAlt className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No clinics found in this area</p>
                <p className="text-sm">Try searching for a different location or click &quot;Find Clinics Near Me&quot;</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clinics.map((clinic) => (
                  <div key={clinic.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {clinic.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {clinic.address}
                        </p>
                        <span className={`inline-block text-xs px-2 py-1 rounded ${
                          clinic.type.includes('Sample') 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {clinic.type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBookAppointment(clinic)}
                        className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Book Appointment
                      </button>
                      <button
                        onClick={() => {
                          if (map.current) {
                            map.current.setCenter(clinic.coordinates);
                            map.current.setZoom(16);
                          }
                        }}
                        className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        title="Show on map"
                      >
                        <FaMapMarkerAlt />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FaMapMarkerAlt className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Find Nearby
            </h3>
            <p className="text-gray-600">
              Discover healthcare facilities in your area with precise location data
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FaCalendarAlt className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Book Appointments
            </h3>
            <p className="text-gray-600">
              Schedule visits directly from the clinic listings
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FaDirections className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Get Directions
            </h3>
            <p className="text-gray-600">
              Navigate to clinics with integrated mapping and directions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindClinics; 