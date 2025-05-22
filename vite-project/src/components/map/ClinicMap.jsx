import React, { useCallback, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import BookingForm from '../booking/BookingForm';

const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

const defaultCenter = {
  lat: 52.5200,
  lng: 13.4050
};

function ClinicMap({ center, clinics = [], mapRef, selectedClinic, onClinicSelect, onMapLoad }) {
  const [mapError, setMapError] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const onLoad = useCallback((map) => {
    try {
      if (onMapLoad) {
        onMapLoad(map);
      }
      if (mapRef) {
        mapRef.current = map;
      }
    } catch (error) {
      console.error('Error loading map:', error);
      setMapError('Failed to load map');
    }
  }, [mapRef, onMapLoad]);

  const onError = useCallback((error) => {
    console.error('Map error:', error);
    setMapError('An error occurred with the map');
  }, []);

  const handleBookingClick = () => {
    setShowBookingForm(true);
  };

  const handleCloseBooking = () => {
    setShowBookingForm(false);
  };

  if (mapError) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-gray-100">
        <div className="text-red-600">{mapError}</div>
      </div>
    );
  }

  return (
    <GoogleMap
      center={center || defaultCenter}
      zoom={13}
      mapContainerStyle={mapContainerStyle}
      onLoad={onLoad}
      onError={onError}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      }}
    >
      {/* User's current location */}
      <Marker
        position={center || defaultCenter}
        icon={{
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#4F46E5",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#FFFFFF"
        }}
      />

      {/* Clinic markers */}
      {clinics.map((clinic) => (
        <Marker
          key={clinic.place_id}
          position={clinic.geometry.location}
          onClick={() => onClinicSelect(clinic)}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: selectedClinic?.place_id === clinic.place_id ? "#2563EB" : "#10B981",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#FFFFFF"
          }}
        />
      ))}

      {/* Info window for selected clinic */}
      {selectedClinic && (
        <InfoWindow
          position={selectedClinic.geometry.location}
          onCloseClick={() => {
            onClinicSelect(null);
            setShowBookingForm(false);
          }}
        >
          <div className="p-2 max-w-xs">
            <h3 className="font-semibold text-lg">{selectedClinic.name}</h3>
            <p className="text-gray-600 mt-1">{selectedClinic.vicinity}</p>
            
            {selectedClinic.rating && (
              <div className="flex items-center mt-2">
                <div className="text-yellow-600">
                  {'★'.repeat(Math.round(selectedClinic.rating))}
                  {'☆'.repeat(5 - Math.round(selectedClinic.rating))}
                </div>
                <span className="text-sm text-gray-600 ml-2">
                  ({selectedClinic.user_ratings_total} reviews)
                </span>
              </div>
            )}
            
            {selectedClinic.opening_hours && (
              <div className={`text-sm mt-2 ${
                selectedClinic.opening_hours.open_now ? 'text-green-600' : 'text-red-600'
              }`}>
                {selectedClinic.opening_hours.open_now ? 'Open Now' : 'Closed'}
              </div>
            )}
            
            <div className="mt-3 space-y-2">
              {showBookingForm ? (
                <BookingForm
                  clinic={selectedClinic}
                  onClose={handleCloseBooking}
                />
              ) : (
                <>
                  <button
                    onClick={handleBookingClick}
                    className="block w-full text-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Book Appointment
                  </button>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedClinic.geometry.location.lat()},${selectedClinic.geometry.location.lng()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Get Directions
                  </a>
                </>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

export default ClinicMap; 