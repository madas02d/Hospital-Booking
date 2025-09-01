import React, { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { useAuth } from '../contexts/AuthContext';
import { FaPhone, FaMapMarkerAlt, FaClock, FaStar, FaDirections, FaCalendarAlt, FaShieldAlt, FaHeartbeat } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

// Set your Mapbox access token here
// Get your free token from: https://account.mapbox.com/access-tokens/
mapboxgl.accessToken = 'pk.eyJ1IjoiZGU0ODg5MDQiLCJhIjoiY21lbDNud20wMDdhbjJqczViNHl2d24zMiJ9.RX5l_zsIqNoh4uNK-C6jOg';

const FindClinics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Refs
  const mapContainer = useRef(null);
  const map = useRef(null);
  const geocoder = useRef(null);
  
  // State
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [clinics, setClinics] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [center, setCenter] = useState({ lng: 13.4050, lat: 52.5200 }); // Default to Berlin, Germany
  const [searchRadius, setSearchRadius] = useState(15); // Default to 15km
  
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
    
    // Wait for map to load before getting user location
    map.current.on('load', () => {
      console.log('Map loaded, getting user location...');
      setMapLoading(false);
      
      // Get user location on mount
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log('User location obtained:', latitude, longitude);
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
          (error) => {
            console.log('Geolocation error:', error);
            // Use default location and search
            console.log('Using default location for clinic search');
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
        console.log('Geolocation not available, using default location');
        searchClinicsNearby(center.lat, center.lng);
      }
    });
    
    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []); // Empty dependency array since we only want this to run once
  
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

  // Search for clinics nearby
  const searchClinicsNearby = useCallback(async (lat, lng) => {
    try {
      setLoading(true);
      console.log('🔍 Starting clinic search near:', lat, lng);
      console.log('📍 Search radius:', searchRadius, 'km');
      console.log('📍 Map ready status:', map.current ? map.current.isStyleLoaded() : 'No map');
      
      // Try multiple search strategies for better results
      const searchStrategies = [
        // Strategy 1: General medical terms (most likely to work)
        {
          url: `https://api.mapbox.com/geocoding/v5/mapbox.places/krankenhaus%20hospital%20clinic%20praxis.json?proximity=${lng},${lat}&limit=30&access_token=${mapboxgl.accessToken}`,
          name: 'General Medical Terms'
        },
        // Strategy 2: German-specific terms
        {
          url: `https://api.mapbox.com/geocoding/v5/mapbox.places/arzt%20apotheke%20praxis%20klinik.json?proximity=${lng},${lat}&limit=30&access_token=${mapboxgl.accessToken}`,
          name: 'German Medical Terms'
        },
        // Strategy 3: Specific Berlin hospitals and practices
        {
          url: `https://api.mapbox.com/geocoding/v5/mapbox.places/Charité%20Vivantes%20DRK%20Berlin%20krankenhaus%20praxis%20arzt.json?proximity=${lng},${lat}&limit=20&access_token=${mapboxgl.accessToken}`,
          name: 'Berlin Hospitals & Practices'
        }
      ];
      
      let foundClinics = [];
      
      // Try each strategy until we find results
      for (let i = 0; i < searchStrategies.length; i++) {
        const strategy = searchStrategies[i];
        console.log(`🔎 Trying Strategy ${i + 1}: ${strategy.name}`);
        
        try {
          const response = await fetch(strategy.url);
          const data = await response.json();
          
          console.log(`📊 Results from ${strategy.name}:`, data.features ? data.features.length : 0);
          
          if (data.features && data.features.length > 0) {
            // Filter for medical facilities within radius
            const medicalPlaces = data.features.filter(feature => {
              // Calculate distance to user location
              const distance = calculateDistance(lat, lng, feature.center[1], feature.center[0]);
              
              // Only include places within the search radius
              if (distance > searchRadius) {
                return false;
              }
              
              const text = feature.text.toLowerCase();
              const placeName = feature.place_name.toLowerCase();
              
              // Medical-related keywords in multiple languages
              const medicalKeywords = [
                // German medical terms
                'krankenhaus', 'arzt', 'apotheke', 'klinik', 'praxis', 'notaufnahme', 
                'hausarzt', 'facharzt', 'medizin', 'gesundheit', 'therapie', 'behandlung',
                'zahnarzt', 'augenarzt', 'kinderarzt', 'frauenarzt', 'orthopäde', 'kardiologe',
                // English medical terms
                'hospital', 'clinic', 'pharmacy', 'doctor', 'medical', 'health',
                'urgent', 'care', 'center', 'practice', 'office', 'facility',
                // Common medical abbreviations
                'dr.', 'prof.', 'md', 'gp', 'er', 'icu'
              ];
              
              const isMedical = medicalKeywords.some(keyword => 
                text.includes(keyword) || placeName.includes(keyword)
              );
              
              if (isMedical) {
                console.log(`✅ Medical place found: ${feature.text} (${distance.toFixed(1)}km)`);
              }
              
              return isMedical;
            });
            
            console.log(`🏥 Medical places from ${strategy.name}:`, medicalPlaces.length);
            
            if (medicalPlaces.length > 0) {
              // Transform to clinic format
              const clinics = medicalPlaces.map(feature => ({
                id: feature.id,
                name: feature.text,
                address: feature.place_name,
                coordinates: feature.center,
                type: getClinicType(feature.text, feature.place_name),
                distance: calculateDistance(lat, lng, feature.center[1], feature.center[0])
              }));
              
              foundClinics.push(...clinics);
              console.log(`✅ Strategy ${strategy.name} successful, found ${clinics.length} clinics`);
              break; // Stop trying other strategies if we found results
            }
          }
        } catch (error) {
          console.error(`❌ Strategy ${strategy.name} failed:`, error);
        }
      }
      
      // Process found clinics
      if (foundClinics.length > 0) {
        // Remove duplicates and sort by distance
        const uniqueClinics = foundClinics
          .filter((clinic, index, self) => 
            index === self.findIndex(c => c.id === clinic.id)
          )
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 30); // Show top 30 closest clinics
        
        console.log('🎯 Final unique clinics:', uniqueClinics.length);
        setClinics(uniqueClinics);
        
        // Add markers to map
        if (map.current && map.current.isStyleLoaded()) {
          addClinicsToMap(uniqueClinics, lat, lng);
        }
      } else {
        console.log('⚠️ No clinics found with any strategy, using fallback data');
        setClinics(fallbackClinics);
        if (map.current && map.current.isStyleLoaded()) {
          addFallbackClinicsToMap();
        }
      }
    } catch (error) {
      console.error('❌ Error searching clinics:', error);
      console.log('🔄 Using fallback clinic data due to API error');
      setClinics(fallbackClinics);
      if (map.current && map.current.isStyleLoaded()) {
        addFallbackClinicsToMap();
      }
    } finally {
      setLoading(false);
      console.log('🏁 Clinic search completed');
    }
  }, [searchRadius]);
  
  // Helper function to add clinics to map
  const addClinicsToMap = (clinics, userLat, userLng) => {
    console.log('🗺️ Adding clinics to map...');
    
    // Clear existing markers first
    const existingMarkers = document.querySelectorAll('.clinic-marker');
    existingMarkers.forEach(marker => marker.remove());
    
    // Add radius circle to show search area
    if (map.current.getSource('search-radius')) {
      map.current.removeLayer('search-radius-fill');
      map.current.removeLayer('search-radius-border');
      map.current.removeSource('search-radius');
    }
    
    // Create a circle source for the search radius
    const radiusSource = {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [generateCircleCoordinates(userLat, userLng, searchRadius, 64)]
        }
      }
    };
    
    map.current.addSource('search-radius', radiusSource);
    
    // Add radius fill layer
    map.current.addLayer({
      id: 'search-radius-fill',
      type: 'fill',
      source: 'search-radius',
      paint: {
        'fill-color': '#3B82F6',
        'fill-opacity': 0.1
      }
    });
    
    // Add radius border layer
    map.current.addLayer({
      id: 'search-radius-border',
      type: 'line',
      source: 'search-radius',
      paint: {
        'line-color': '#3B82F6',
        'line-width': 2,
        'line-opacity': 0.6
      }
    });
    
    // Add clinic markers
    clinics.forEach((clinic) => {
      let markerColor = '#3B82F6'; // Default blue
      
      if (clinic.type.toLowerCase().includes('hospital') || clinic.type.toLowerCase().includes('krankenhaus')) {
        markerColor = '#EF4444'; // Red for hospitals
      } else if (clinic.type.toLowerCase().includes('pharmacy') || clinic.type.toLowerCase().includes('apotheke')) {
        markerColor = '#10B981'; // Green for pharmacies
      } else if (clinic.type.toLowerCase().includes('clinic') || clinic.type.toLowerCase().includes('klinik')) {
        markerColor = '#8B5CF6'; // Purple for clinics
      }
      
      const marker = new mapboxgl.Marker({ 
        color: markerColor,
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
                <p class="text-xs text-gray-500">Distance: ${clinic.distance.toFixed(1)} km</p>
              </div>
            `)
        )
        .addTo(map.current);
    });
    
    console.log(`📍 Added ${clinics.length} markers to map`);
    
    // Fit map to show all clinics within radius
    if (clinics.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      clinics.forEach(clinic => {
        bounds.extend(clinic.coordinates);
      });
      map.current.fitBounds(bounds, { padding: 50 });
      console.log('🗺️ Map fitted to show all clinics within radius');
    }
  };
  
  // Helper function to add fallback clinics to map
  const addFallbackClinicsToMap = () => {
    console.log('🗺️ Adding fallback clinics to map...');
    
    const existingMarkers = document.querySelectorAll('.clinic-marker');
    existingMarkers.forEach(marker => marker.remove());
    
    fallbackClinics.forEach(clinic => {
      const marker = new mapboxgl.Marker({ 
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
  };
  
  // Calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  // Helper function to generate coordinates for a circle
  const generateCircleCoordinates = (centerLat, centerLng, radiusKm, numPoints = 64) => {
    const R = 6371; // Earth's radius in km
    const coords = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const dx = radiusKm / R * Math.cos(angle);
      const dy = radiusKm / R * Math.sin(angle);
      coords.push([centerLng + dx, centerLat + dy]);
    }
    return [coords];
  };
  
  // Helper function to determine clinic type
  const getClinicType = (text, placeName) => {
    const lowerText = text.toLowerCase();
    const lowerPlaceName = placeName.toLowerCase();
    
    // German terms
    if (lowerText.includes('krankenhaus') || lowerPlaceName.includes('krankenhaus')) {
      return 'Krankenhaus (Hospital)';
    } else if (lowerText.includes('arzt') || lowerPlaceName.includes('arzt')) {
      if (lowerText.includes('hausarzt') || lowerPlaceName.includes('hausarzt')) {
        return 'Hausarzt (General Practitioner)';
      } else if (lowerText.includes('facharzt') || lowerPlaceName.includes('facharzt')) {
        return 'Facharzt (Specialist)';
      } else {
        return 'Arztpraxis (Doctor\'s Office)';
      }
    } else if (lowerText.includes('apotheke') || lowerPlaceName.includes('apotheke')) {
      return 'Apotheke (Pharmacy)';
    } else if (lowerText.includes('klinik') || lowerPlaceName.includes('klinik')) {
      return 'Klinik (Clinic)';
    } else if (lowerText.includes('praxis') || lowerPlaceName.includes('praxis')) {
      return 'Arztpraxis (Medical Practice)';
    } else if (lowerText.includes('notaufnahme') || lowerPlaceName.includes('notaufnahme')) {
      return 'Notaufnahme (Emergency Room)';
    }
    
    // English terms
    if (lowerText.includes('hospital') || lowerPlaceName.includes('hospital')) {
      return 'Hospital';
    } else if (lowerText.includes('clinic') || lowerPlaceName.includes('clinic')) {
      return 'Medical Clinic';
    } else if (lowerText.includes('pharmacy') || lowerPlaceName.includes('pharmacy')) {
      return 'Pharmacy';
    } else if (lowerText.includes('doctor') || lowerPlaceName.includes('doctor')) {
      return 'Doctor\'s Office';
    } else if (lowerText.includes('urgent') || lowerPlaceName.includes('urgent')) {
      return 'Urgent Care';
    } else if (lowerText.includes('medical center') || lowerPlaceName.includes('medical center')) {
      return 'Medical Center';
    } else if (lowerText.includes('health center') || lowerPlaceName.includes('health center')) {
      return 'Health Center';
    } else if (lowerText.includes('walk-in') || lowerPlaceName.includes('walk-in')) {
      return 'Walk-in Clinic';
    } else {
      return 'Medical Facility';
    }
  };
  
  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      console.log('Manual search for:', searchQuery, 'within', searchRadius, 'km');
      
      // Use Mapbox Geocoding API with proximity to current center
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?proximity=${center.lng},${center.lat}&types=poi&limit=25&access_token=${mapboxgl.accessToken}`
      );
      
      const data = await response.json();
      console.log('Manual search response:', data);
      
      if (data.features && data.features.length > 0) {
        // Filter for medical-related places within radius
        const medicalPlaces = data.features.filter(feature => {
          const text = feature.text.toLowerCase();
          const placeName = feature.place_name.toLowerCase();
          
          // Calculate distance to current center
          const distance = calculateDistance(center.lat, center.lng, feature.center[1], feature.center[0]);
          
          // Only include places within the search radius
          if (distance > searchRadius) {
            console.log(`❌ Place too far: ${feature.text} (${distance.toFixed(1)}km)`);
            return false;
          }
          
          // Medical-related keywords
          const medicalKeywords = [
            'hospital', 'clinic', 'pharmacy', 'doctor', 'medical', 'health',
            'urgent', 'care', 'center', 'practice', 'office', 'facility'
          ];
          
          return medicalKeywords.some(keyword => 
            text.includes(keyword) || placeName.includes(keyword)
          );
        });
        
        if (medicalPlaces.length > 0) {
          const clinicData = medicalPlaces.map(feature => ({
            id: feature.id,
            name: feature.text,
            address: feature.place_name,
            coordinates: feature.center,
            type: getClinicType(feature.text, feature.place_name),
            searchQuery: searchQuery,
            distance: calculateDistance(center.lat, center.lng, feature.center[1], feature.center[0])
          }));
          
          console.log('Found medical places within radius:', clinicData.length);
          setClinics(clinicData);
          
          // Update map center to first result
          const firstResult = clinicData[0];
          setCenter({ lng: firstResult.coordinates[0], lat: firstResult.coordinates[1] });
          
          if (map.current) {
            map.current.setCenter(firstResult.coordinates);
            map.current.setZoom(15);
            
            // Clear existing markers and add new ones
            const existingMarkers = document.querySelectorAll('.clinic-marker');
            existingMarkers.forEach(marker => marker.remove());
            
            // Add radius circle for manual search
            if (map.current.getSource('search-radius')) {
              map.current.removeLayer('search-radius-fill');
              map.current.removeLayer('search-radius-border');
              map.current.removeSource('search-radius');
            }
            
            // Create a circle source for the search radius
            const radiusSource = {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [generateCircleCoordinates(center.lat, center.lng, searchRadius, 64)]
                }
              }
            };
            
            map.current.addSource('search-radius', radiusSource);
            
            // Add radius fill layer
            map.current.addLayer({
              id: 'search-radius-fill',
              type: 'fill',
              source: 'search-radius',
              paint: {
                'fill-color': '#3B82F6',
                'fill-opacity': 0.1
              }
            });
            
            // Add radius border layer
            map.current.addLayer({
              id: 'search-radius-border',
              type: 'line',
              source: 'search-radius',
              paint: {
                'line-color': '#3B82F6',
                'line-width': 2,
                'line-opacity': 0.6
              }
            });
            
            clinicData.forEach(clinic => {
              // Use different colors for different facility types
              let markerColor = '#3B82F6'; // Default blue
              
              if (clinic.type.toLowerCase().includes('hospital')) {
                markerColor = '#EF4444'; // Red for hospitals
              } else if (clinic.type.toLowerCase().includes('pharmacy')) {
                markerColor = '#10B981'; // Green for pharmacies
              } else if (clinic.type.toLowerCase().includes('clinic')) {
                markerColor = '#8B5CF6'; // Purple for clinics
              }
              
              const marker = new mapboxgl.Marker({ 
                color: markerColor,
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
                        <p class="text-xs text-gray-500">Distance: ${clinic.distance.toFixed(1)} km</p>
                      </div>
                    `)
                )
                .addTo(map.current);
            });
          }
        } else {
          console.log('No medical places found within radius');
          setClinics([]);
          alert(`No medical facilities found within ${searchRadius}km. Try increasing the search radius or different search terms.`);
        }
      } else {
        setClinics([]);
        alert('No results found. Please try different search terms.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setClinics([]);
      alert('Search error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, center.lat, center.lng, searchRadius, getClinicType, calculateDistance]);
  
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
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Find Clinics Near You
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover healthcare facilities, clinics, and hospitals within a <span className="font-semibold text-blue-600">15km radius</span> of your location. 
            Get directions, contact information, and book appointments directly.
          </p>
          
          {/* Search Radius Indicator */}
          <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium">Search Radius: {searchRadius}km</span>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          {/* Radius Selector */}
          <div className="mb-4 text-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Radius
            </label>
            <div className="flex justify-center gap-2">
              {[1, 5, 10, 15].map((radius) => (
                <button
                  key={radius}
                  onClick={() => {
                    setSearchRadius(radius);
                    console.log(`🎯 Radius changed to ${radius}km`);
                    // If user has location, search again with new radius
                    if (userLocation) {
                      searchClinicsNearby(userLocation.lat, userLocation.lng);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    searchRadius === radius
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {radius}km
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Choose how far to search for clinics
            </p>
          </div>
          
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
          <div className="text-center">
            <button
              onClick={() => {
                if (userLocation) {
                  console.log('Searching clinics near user location:', userLocation);
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
                      (error) => {
                        console.log('Geolocation error on button click:', error);
                        alert('Unable to get your location. Please try searching for a specific area.');
                      }
                    );
                  }
                }
              }}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed mr-4"
            >
              {loading ? 'Searching...' : 'Find Clinics Near Me'}
            </button>
            
            {/* Debug button for testing */}
            <button
              onClick={() => {
                console.log('🧪 Debug: Testing clinic search with default coordinates');
                console.log('📍 Current center:', center);
                console.log('🗺️ Map status:', map.current ? 'Ready' : 'Not ready');
                console.log('🔍 Map style loaded:', map.current ? map.current.isStyleLoaded() : 'N/A');
                searchClinicsNearby(center.lat, center.lng);
              }}
              className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
            >
              🧪 Test Search
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
              
              {(loading || mapLoading) && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <div className="text-gray-500">
                      {mapLoading ? 'Loading map...' : 'Searching for clinics...'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Clinics List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Nearby Clinics
                </h2>
                <p className="text-sm text-gray-500">
                  Showing clinics within {searchRadius}km radius • {clinics.length} found
                </p>
              </div>
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
                <p className="text-sm">Try searching for a different location or click "Find Clinics Near Me"</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clinics.map((clinic) => (
                  <div key={clinic.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {clinic.name}
                          </h3>
                          {clinic.distance && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {clinic.distance.toFixed(1)} km
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {clinic.address}
                        </p>
                        <span className={`inline-block text-xs px-2 py-1 rounded ${
                          clinic.type.toLowerCase().includes('hospital') 
                            ? 'bg-red-100 text-red-800' 
                            : clinic.type.toLowerCase().includes('pharmacy')
                            ? 'bg-green-100 text-green-800'
                            : clinic.type.toLowerCase().includes('clinic')
                            ? 'bg-purple-100 text-purple-800'
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