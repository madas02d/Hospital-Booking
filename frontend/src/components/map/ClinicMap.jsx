import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

// You'll need to add your Mapbox access token to your environment variables
// or replace this with your actual token
mapboxgl.accessToken = 'pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGV4YW1wbGUifQ.example';

const ClinicMap = ({ clinics = [], onClinicSelect }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-70.9);
  const [lat, setLat] = useState(42.35);
  const [zoom, setZoom] = useState(9);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom: zoom
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geocoder
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      placeholder: 'Search for clinics or addresses',
      countries: 'us,ca,gb,de,fr,au',
      types: 'address,poi'
    });

    map.current.addControl(geocoder, 'top-left');

    // Add geolocate control
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });
    map.current.addControl(geolocate, 'top-left');

    // Handle map events
    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });

    // Get user location on mount
    geolocate.trigger();

  }, [lng, lat, zoom]);

  // Add clinic markers when clinics data changes
  useEffect(() => {
    if (!map.current || !clinics.length) return;

    // Remove existing markers
    const markers = document.querySelectorAll('.clinic-marker');
    markers.forEach(marker => marker.remove());

    // Add new markers
    clinics.forEach(clinic => {
      const el = document.createElement('div');
      el.className = 'clinic-marker';
      el.style.width = '25px';
      el.style.height = '25px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#3B82F6';
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-semibold text-lg">${clinic.name}</h3>
            <p class="text-gray-600">${clinic.specialty}</p>
            <p class="text-sm text-gray-500">${clinic.address}</p>
            <button 
              class="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              onclick="window.selectClinic('${clinic.id}')"
            >
              Select Clinic
            </button>
          </div>
        `);

      // Add marker to map
      new mapboxgl.Marker(el)
        .setLngLat([clinic.longitude, clinic.latitude])
        .setPopup(popup)
        .addTo(map.current);

      // Add click handler
      el.addEventListener('click', () => {
        if (onClinicSelect) {
          onClinicSelect(clinic);
        }
      });
    });

    // Fit map to show all clinics
    if (clinics.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      clinics.forEach(clinic => {
        bounds.extend([clinic.longitude, clinic.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }

  }, [clinics, onClinicSelect]);

  // Make selectClinic function globally available for popup buttons
  useEffect(() => {
    window.selectClinic = (clinicId) => {
      const clinic = clinics.find(c => c.id === clinicId);
      if (clinic && onClinicSelect) {
        onClinicSelect(clinic);
      }
    };

    return () => {
      delete window.selectClinic;
    };
  }, [clinics, onClinicSelect]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      {/* Map controls info */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-2 rounded text-xs text-gray-600">
        <div>Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}</div>
      </div>
    </div>
  );
};

export default ClinicMap;
