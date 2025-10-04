"use client";

import { useEffect, useRef } from "react";

export default function AdvancedGoogleMap({
  onLocationSelect,
  onAddressChange,
}) {
  const mapRef = useRef(null);

  useEffect(() => {
    // Your Google Maps code goes here
    initMap();
  }, []);

  async function initMap() {
    if (!window.google) {
      console.error("Google Maps not loaded");
      return;
    }

    const { Map, InfoWindow } = await google.maps.importLibrary("maps");
    const { Autocomplete } = await google.maps.importLibrary("places");
    const { AdvancedMarkerElement, PinElement } =
      await google.maps.importLibrary("marker");

    const mapOptions = {
      center: { lat: 28.43268, lng: 77.0459 }, // Initial center coordinates (Gurgaon)
      zoom: 16,
      mapStyle:
        "https://maps.googleapis.com/maps/api/js/examples/styles/minimal_hosting.json",
      mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "f8b9e6163e48e501",
    };

    const map = new Map(mapRef.current, mapOptions);

    const landmarksSelect = document.getElementById("landmarks");
    const combinedAddressInput = document.getElementById("combined-address");
    let formattedAddress = "";

    const geocoder = new google.maps.Geocoder();

    let marker = new AdvancedMarkerElement({
      map,
      position: mapOptions.center,
      gmpDraggable: true,
    });

    let infoWindow;
    const descriptorMarkers = [];

    const addressInput = document.getElementById("address-autocomplete");
    const aptSuiteInput = document.getElementById("apt-suite");
    const cityInput = document.getElementById("city");
    const stateProvinceInput = document.getElementById("state-province");
    const zipPostalCodeInput = document.getElementById("zip-postal-code");
    const countryInput = document.getElementById("country");

    // Set up autocomplete if input exists
    if (addressInput) {
      const autocomplete = new google.maps.places.Autocomplete(addressInput, {
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

        marker.position = place.geometry.location;
        map.setCenter(place.geometry.location);

        fillInAddress(place);
        formattedAddress = place.formatted_address;
        addressDescriptorPlaceIdLookup(place.place_id);

        // Notify parent component
        const coords = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        onLocationSelect([coords.lng, coords.lat]);
        onAddressChange(place.formatted_address);

        infoWindow = new InfoWindow({
          content: place.name,
          headerDisabled: true,
        });

        infoWindow.open(map, marker);
      });
    }

    function fillInAddress(place) {
      // Clear previous values
      if (aptSuiteInput) aptSuiteInput.value = "";
      if (cityInput) cityInput.value = "";
      if (stateProvinceInput) stateProvinceInput.value = "";
      if (zipPostalCodeInput) zipPostalCodeInput.value = "";
      if (countryInput) countryInput.value = "";

      // Get each component of the address from the place details
      for (const component of place.address_components) {
        const componentType = component.types[0];

        switch (componentType) {
          case "street_number": {
            if (addressInput) addressInput.value = `${component.long_name} `;
            break;
          }
          case "route": {
            if (addressInput) addressInput.value += component.short_name;
            break;
          }
          case "premise": {
            if (aptSuiteInput) aptSuiteInput.value = component.short_name;
            break;
          }
          case "subpremise": {
            if (aptSuiteInput) aptSuiteInput.value = component.short_name;
            break;
          }
          case "locality":
            if (cityInput) cityInput.value = component.long_name;
            break;
          case "administrative_area_level_1": {
            if (stateProvinceInput)
              stateProvinceInput.value = component.short_name;
            break;
          }
          case "postal_code": {
            if (zipPostalCodeInput)
              zipPostalCodeInput.value = component.long_name;
            break;
          }
          case "country":
            if (countryInput) countryInput.value = component.long_name;
            break;
        }
      }
    }

    function addressDescriptorPlaceIdLookup(placeId) {
      geocoder.geocode(
        {
          placeId: placeId,
          extraComputations: ["ADDRESS_DESCRIPTORS"],
          fulfillOnZeroResults: true,
        },
        function (results, status) {
          if (status == "OK") {
            let addressDescriptor = results[0].address_descriptor;
            if (addressDescriptor && landmarksSelect) {
              const descriptors = results[0].address_descriptor.landmarks;
              landmarksSelect.innerHTML =
                '<option value="" disabled selected>Choose your Landmark</option>';

              // Clear existing descriptor markers
              descriptorMarkers.forEach((marker) => marker.setMap(null));
              descriptorMarkers.length = 0;

              descriptors.forEach((descriptor, index) => {
                const option = document.createElement("option");
                option.value = descriptor.display_name;
                option.text =
                  descriptor.spatial_relationship +
                  " " +
                  descriptor.display_name;
                landmarksSelect.appendChild(option);

                const descriptorMarkerContent = document.createElement("div");
                if (index === 0) {
                  descriptorMarkerContent.className =
                    "descriptor-marker highlighted";
                } else {
                  descriptorMarkerContent.className = "descriptor-marker";
                }
                descriptorMarkerContent.textContent = ++index;

                // Get landmark location
                geocoder.geocode(
                  { placeId: descriptor.place_id },
                  (results, status) => {
                    if (status === "OK") {
                      const landmarkInfoWindow = new InfoWindow({
                        content: descriptor.display_name,
                        headerDisabled: true,
                      });

                      const _marker = new AdvancedMarkerElement({
                        map: map,
                        position: results[0].geometry.location,
                        content: descriptorMarkerContent,
                      });
                      descriptorMarkers.push(_marker);

                      _marker.content.addEventListener("mouseover", () => {
                        landmarkInfoWindow.open(map, _marker);
                      });
                      _marker.content.addEventListener("mouseout", () => {
                        landmarkInfoWindow.close();
                      });
                    } else {
                      console.error("Error geocoding landmark:", status);
                    }
                  }
                );
              });

              // Autoselect the first option
              if (landmarksSelect.options.length > 1) {
                landmarksSelect.selectedIndex = 1;
                updateCombinedAddress();
              }
            }
          }
        }
      );
    }

    function updateCombinedAddress() {
      if (!landmarksSelect || !combinedAddressInput) return;

      const address = formattedAddress;
      const landmark =
        landmarksSelect.options[landmarksSelect.selectedIndex].text;
      combinedAddressInput.value = `${address}\n${landmark}`;

      // Notify parent component
      onAddressChange(combinedAddressInput.value);
    }

    // Add landmark selection listener
    if (landmarksSelect) {
      landmarksSelect.addEventListener("change", () => {
        updateCombinedAddress();

        const selectedIndex = landmarksSelect.selectedIndex - 1;
        descriptorMarkers.forEach((marker, index) => {
          if (selectedIndex === parseInt(marker.content.textContent) - 1) {
            marker.content.classList.add("highlighted");
          } else {
            marker.content.classList.remove("highlighted");
          }
        });
      });
    }

    // Add marker dragend listener
    marker.addListener("dragend", () => {
      const newPosition = marker.position;
      const coords = {
        lat: newPosition.lat,
        lng: newPosition.lng,
      };

      onLocationSelect([coords.lng, coords.lat]);

      geocoder.geocode(
        {
          location: newPosition,
          extraComputations: ["ADDRESS_DESCRIPTORS"],
          fulfillOnZeroResults: true,
        },
        (results, status) => {
          if (status === "OK") {
            if (results[0]) {
              const place = results[0];
              fillInAddress(place);
              formattedAddress = place.formatted_address;
              updateCombinedAddress();
              addressDescriptorPlaceIdLookup(place.place_id);
              map.setCenter(newPosition);

              onAddressChange(place.formatted_address);
            }
          }
        }
      );
    });
  }

  return (
    <div className="space-y-4">
      {/* Address Search Input */}
      <div>
        <label
          htmlFor="address-autocomplete"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Search Address
        </label>
        <input
          id="address-autocomplete"
          type="text"
          placeholder="Enter an address"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Address Details */}
      <div className="grid grid-cols-2 gap-4">
        <input
          id="apt-suite"
          type="text"
          placeholder="Apt/Suite"
          className="px-3 py-2 border border-gray-300 rounded-md"
        />
        <input
          id="city"
          type="text"
          placeholder="City"
          className="px-3 py-2 border border-gray-300 rounded-md"
        />
        <input
          id="state-province"
          type="text"
          placeholder="State/Province"
          className="px-3 py-2 border border-gray-300 rounded-md"
        />
        <input
          id="zip-postal-code"
          type="text"
          placeholder="ZIP/Postal Code"
          className="px-3 py-2 border border-gray-300 rounded-md"
        />
        <input
          id="country"
          type="text"
          placeholder="Country"
          className="px-3 py-2 border border-gray-300 rounded-md col-span-2"
        />
      </div>

      {/* Landmarks Selection */}
      <div>
        <label
          htmlFor="landmarks"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Nearby Landmarks
        </label>
        <select
          id="landmarks"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="" disabled selected>
            Choose your Landmark
          </option>
        </select>
      </div>

      {/* Combined Address Display */}
      <div>
        <label
          htmlFor="combined-address"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Complete Address
        </label>
        <textarea
          id="combined-address"
          rows="3"
          readOnly
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
        />
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-80 rounded-lg border border-gray-300"
        style={{ minHeight: "320px" }}
      />

      <style jsx>{`
        .descriptor-marker {
          background-color: #4285f4;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .descriptor-marker.highlighted {
          background-color: #ea4335;
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
}
