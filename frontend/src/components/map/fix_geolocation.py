#!/usr/bin/env python3

# Read the file
with open('FreeMapEmbed.jsx', 'r') as f:
    content = f.read()

# Add manual location input state
content = content.replace(
    'const [selectedFilter, setSelectedFilter] = useState(\'all\');',
    '''const [selectedFilter, setSelectedFilter] = useState('all');
  const [manualLocation, setManualLocation] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);'''
)

# Fix the geolocation error handling
old_geolocation = '''        (error) => {
          console.log('Geolocation error:', error);
          setError('Unable to get your location. Please allow location access or search manually.');
          const defaultLocation = { lat: 52.5200, lng: 13.4050 };
          setCurrentLocation(defaultLocation);
          generateFreeMapUrl(defaultLocation, 'medical facilities');
          findNearbyFacilities(defaultLocation.lat, defaultLocation.lng);
        },'''

new_geolocation = '''        (error) => {
          console.log('Geolocation error:', error);
          setError('Location access denied or unavailable. Using default location (Berlin). You can also enter a city name manually.');
          const defaultLocation = { lat: 52.5200, lng: 13.4050 };
          setCurrentLocation(defaultLocation);
          generateFreeMapUrl(defaultLocation, 'medical facilities');
          findNearbyFacilities(defaultLocation.lat, defaultLocation.lng);
          setShowManualInput(true);
        },'''

content = content.replace(old_geolocation, new_geolocation)

# Add manual location handling function
manual_location_function = '''
  const handleManualLocation = () => {
    if (manualLocation.trim()) {
      // Try to geocode the location (simplified approach)
      const cityCoordinates = getCityCoordinates(manualLocation.trim());
      if (cityCoordinates) {
        setCurrentLocation(cityCoordinates);
        generateFreeMapUrl(cityCoordinates, 'medical facilities');
        findNearbyFacilities(cityCoordinates.lat, cityCoordinates.lng);
        setError(null);
        setShowManualInput(false);
      } else {
        setError('City not found. Please try a major city name like "Berlin", "New York", "London", etc.');
      }
    }
  };

  const getCityCoordinates = (cityName) => {
    const cities = {
      'berlin': { lat: 52.5200, lng: 13.4050 },
      'munich': { lat: 48.1351, lng: 11.5820 },
      'hamburg': { lat: 53.5511, lng: 9.9937 },
      'cologne': { lat: 50.9375, lng: 6.9603 },
      'frankfurt': { lat: 50.1109, lng: 8.6821 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'paris': { lat: 48.8566, lng: 2.3522 },
      'amsterdam': { lat: 52.3676, lng: 4.9041 },
      'new york': { lat: 40.7128, lng: -74.0060 },
      'los angeles': { lat: 34.0522, lng: -118.2437 },
      'chicago': { lat: 41.8781, lng: -87.6298 },
      'miami': { lat: 25.7617, lng: -80.1918 },
      'san francisco': { lat: 37.7749, lng: -122.4194 },
      'houston': { lat: 29.7604, lng: -95.3698 },
      'atlanta': { lat: 33.7490, lng: -84.3880 },
      'philadelphia': { lat: 39.9526, lng: -75.1652 },
      'toronto': { lat: 43.6532, lng: -79.3832 },
      'vancouver': { lat: 49.2827, lng: -123.1207 },
      'sydney': { lat: -33.8688, lng: 151.2093 },
      'melbourne': { lat: -37.8136, lng: 144.9631 },
      'tokyo': { lat: 35.6762, lng: 139.6503 },
      'singapore': { lat: 1.3521, lng: 103.8198 },
      'dubai': { lat: 25.2048, lng: 55.2708 },
      'mumbai': { lat: 19.0760, lng: 72.8777 },
      'delhi': { lat: 28.7041, lng: 77.1025 }
    };
    
    const normalizedCity = cityName.toLowerCase().trim();
    return cities[normalizedCity] || null;
  };'''

# Insert the manual location function before the handleLocationRequest function
content = content.replace(
    'const handleLocationRequest = () => {',
    manual_location_function + '\n\n  const handleLocationRequest = () => {'
)

# Add manual location input UI
manual_input_ui = '''        {/* Manual Location Input */}
        {showManualInput && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              Enter a city name to search for medical facilities:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter city name (e.g., Berlin, New York, London)"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualLocation()}
                className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleManualLocation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Search
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Supported cities: Berlin, Munich, London, Paris, New York, Los Angeles, and more...
            </p>
          </div>
        )}'''

# Insert the manual input UI after the search bar
content = content.replace(
    '</div>\n\n        {/* Filter Buttons */}',
    '</div>\n' + manual_input_ui + '\n\n        {/* Filter Buttons */}'
)

# Write the fixed file
with open('FreeMapEmbed.jsx', 'w') as f:
    f.write(content)

print('Geolocation issues fixed successfully!')
