"use client";

import { useEffect, useRef } from "react";

export default function GoogleMapSelector({
  onLocationSelect,
  onAddressChange,
  center = { lat: 28.43268, lng: 77.0459 },
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    initMap();
  }, []);

  async function initMap() {
    if (!window.google) {
      console.error("Google Maps not loaded");
      return;
    }

    const { Map, InfoWindow } = await google.maps.importLibrary("maps");
    const { Autocomplete } = await google.maps.importLibrary("places");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    const mapOptions = {
      center: center,
      zoom: 16,
      mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "f8b9e6163e48e501",
    };

    const map = new Map(mapRef.current, mapOptions);
    mapInstanceRef.current = map;

    // Create draggable marker
    const marker = new AdvancedMarkerElement({
      map,
      position: center,
      gmpDraggable: true,
    });
    markerRef.current = marker;

    // Initialize geocoder
    const geocoder = new google.maps.Geocoder();

    // Add click listener to map
    map.addListener("click", (event) => {
      const position = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };

      marker.position = position;
      onLocationSelect([position.lng, position.lat]); // [longitude, latitude] for consistency

      // Reverse geocode to get address
      geocoder.geocode({ location: position }, (results, status) => {
        if (status === "OK" && results[0]) {
          onAddressChange(results[0].formatted_address);
        }
      });
    });

    // Add marker drag listener
    marker.addListener("dragend", () => {
      const position = marker.position;
      const coords = {
        lat: position.lat,
        lng: position.lng,
      };

      onLocationSelect([coords.lng, coords.lat]);

      // Reverse geocode
      geocoder.geocode({ location: coords }, (results, status) => {
        if (status === "OK" && results[0]) {
          onAddressChange(results[0].formatted_address);
        }
      });
    });

    // Setup autocomplete for address input
    const addressInput = document.getElementById("address-search");
    if (addressInput) {
      const autocomplete = new Autocomplete(addressInput, {
        fields: [
          "place_id",
          "address_components",
          "formatted_address",
          "geometry",
          "name",
        ],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (!place.geometry) {
          console.error("No details available for input: '" + place.name + "'");
          return;
        }

        const position = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        marker.position = place.geometry.location;
        map.setCenter(place.geometry.location);

        onLocationSelect([position.lng, position.lat]);
        onAddressChange(place.formatted_address);
      });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="address-search"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Search for a location
        </label>
        <input
          id="address-search"
          type="text"
          placeholder="Enter an address or landmark"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div
        ref={mapRef}
        className="w-full h-80 rounded-lg border border-gray-300"
        style={{ minHeight: "320px" }}
      />

      <p className="text-sm text-gray-600">
        Click on the map or drag the marker to set the exact location of the
        incident.
      </p>
    </div>
  );
}
