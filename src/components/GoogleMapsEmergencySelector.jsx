"use client";

import { useEffect, useRef, useState } from "react";

export default function GoogleMapsEmergencySelector({
  onLocationSelect,
  onAddressChange,
  center = { lat: 28.4595, lng: 77.0266 }, // Delhi, India default
  initialZoom = 12,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (window.google && window.google.maps) {
      initMap();
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps);
          initMap();
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }
  }, []);

  const initMap = async () => {
    try {
      const { Map } = await google.maps.importLibrary("maps");
      const { AdvancedMarkerElement } = await google.maps.importLibrary(
        "marker"
      );
      const { Autocomplete } = await google.maps.importLibrary("places");

      // Initialize map
      const map = new Map(mapRef.current, {
        center: center,
        zoom: initialZoom,
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;

      // Create initial marker
      const marker = new AdvancedMarkerElement({
        map,
        position: center,
        gmpDraggable: true,
        title: "Emergency Location",
      });

      markerRef.current = marker;

      // Initialize geocoder
      const geocoder = new google.maps.Geocoder();

      // Handle map clicks
      map.addListener("click", (event) => {
        const position = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };

        updateMarkerPosition(position, geocoder);
      });

      // Handle marker drag
      marker.addListener("dragend", () => {
        const position = {
          lat: marker.position.lat,
          lng: marker.position.lng,
        };

        updateMarkerPosition(position, geocoder);
      });

      // Setup address autocomplete
      const addressInput = document.getElementById("address-search");
      if (addressInput) {
        const autocomplete = new Autocomplete(addressInput, {
          fields: ["place_id", "formatted_address", "geometry", "name"],
          componentRestrictions: { country: "in" }, // Restrict to India
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();

          if (!place.geometry) {
            console.error(
              "No details available for input: '" + place.name + "'"
            );
            return;
          }

          const position = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };

          // Update map and marker
          map.setCenter(position);
          map.setZoom(16);
          marker.position = place.geometry.location;

          updateLocationState(position, place.formatted_address);
        });

        autocompleteRef.current = autocomplete;
      }

      // Try to get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            map.setCenter(userLocation);
            marker.position = userLocation;
            updateMarkerPosition(userLocation, geocoder);
          },
          (error) => {
            console.log("Geolocation error:", error);
          }
        );
      }

      setIsLoaded(true);
    } catch (error) {
      console.error("Error initializing Google Maps:", error);
    }
  };

  const updateMarkerPosition = (position, geocoder) => {
    // Update marker position
    if (markerRef.current) {
      markerRef.current.position = position;
    }

    // Reverse geocode to get address
    geocoder.geocode({ location: position }, (results, status) => {
      if (status === "OK" && results[0]) {
        updateLocationState(position, results[0].formatted_address);
      } else {
        updateLocationState(
          position,
          `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
        );
      }
    });
  };

  const updateLocationState = (position, addressText) => {
    setSelectedLocation(position);
    setAddress(addressText);

    // Notify parent components
    onLocationSelect([position.lng, position.lat]); // [longitude, latitude] format
    onAddressChange(addressText);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(userLocation);
            mapInstanceRef.current.setZoom(16);
          }

          if (markerRef.current) {
            markerRef.current.position = userLocation;
          }

          const geocoder = new google.maps.Geocoder();
          updateMarkerPosition(userLocation, geocoder);
        },
        (error) => {
          alert(
            "Unable to get your location. Please select manually on the map."
          );
          console.error("Geolocation error:", error);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Address Search */}
      <div>
        <label
          htmlFor="address-search"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          🔍 Search for Emergency Location
        </label>
        <div className="flex space-x-2">
          <input
            id="address-search"
            type="text"
            placeholder="Enter address, landmark, or area name..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={getCurrentLocation}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
          >
            📍 Use My Location
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-80 rounded-lg border border-gray-300 shadow-sm"
          style={{ minHeight: "320px" }}
        />

        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading Google Maps...</p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
        <p className="font-medium mb-1">📍 How to select location:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Search for an address in the search box above</li>
          <li>Click "Use My Location" to auto-detect your position</li>
          <li>Click anywhere on the map to place the emergency marker</li>
          <li>Drag the red marker to fine-tune the exact location</li>
        </ul>
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <h4 className="font-medium text-green-800 mb-1">
            ✅ Selected Emergency Location:
          </h4>
          <p className="text-sm text-green-700 mb-1">
            <strong>Address:</strong> {address}
          </p>
          <p className="text-sm text-green-700">
            <strong>Coordinates:</strong> {selectedLocation.lat.toFixed(6)},{" "}
            {selectedLocation.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
}
