"use client";

import { useEffect, useRef, useState } from "react";

export default function GoogleMapsDashboard({ reports = [] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (window.google && window.google.maps) {
      initMap();
    } else {
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps);
          initMap();
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && mapInstanceRef.current) {
      updateMarkers();
    }
  }, [reports, isLoaded]);

  const initMap = async () => {
    try {
      const { Map } = await google.maps.importLibrary("maps");

      const map = new Map(mapRef.current, {
        center: { lat: 28.4595, lng: 77.0266 }, // Delhi, India
        zoom: 10,
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;
      setIsLoaded(true);
    } catch (error) {
      console.error("Error initializing Google Maps:", error);
    }
  };

  const updateMarkers = async () => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      if (marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { InfoWindow } = await google.maps.importLibrary("maps");

    reports.forEach((report) => {
      // Get coordinates - handle both formats
      let lat, lng;
      if (report.location?.coordinates) {
        lng = report.location.coordinates[0];
        lat = report.location.coordinates[1];
      } else if (report.latitude && report.longitude) {
        lat = report.latitude;
        lng = report.longitude;
      } else {
        return; // Skip if no valid coordinates
      }

      // Create custom marker element
      const markerElement = document.createElement("div");
      markerElement.className = "custom-marker";

      // Style based on report type and status
      let markerClass = "marker-default";
      let emoji = "🚨";

      if (report.isSOS) {
        markerClass = "marker-sos";
        emoji = "🆘";
      } else {
        switch (report.disasterType?.toLowerCase()) {
          case "fire":
            markerClass = "marker-fire";
            emoji = "🔥";
            break;
          case "flood":
            markerClass = "marker-flood";
            emoji = "🌊";
            break;
          case "earthquake":
            markerClass = "marker-earthquake";
            emoji = "🏢";
            break;
          default:
            markerClass = "marker-other";
            emoji = "⚠️";
        }
      }

      // Apply status styling
      if (report.status === "Verified") {
        markerClass += " verified";
      } else if (report.status === "Rejected") {
        markerClass += " rejected";
      }

      markerElement.innerHTML = `
        <div class="${markerClass}">
          <span class="marker-emoji">${emoji}</span>
        </div>
      `;

      // Create marker
      const marker = new AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat, lng },
        content: markerElement,
        title: `${report.disasterType} - ${report.status}`,
      });

      // Create info window
      const infoWindow = new InfoWindow({
        headerDisabled: false,
      });

      const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      const getStatusColor = (status) => {
        switch (status) {
          case "Verified":
            return "#10B981";
          case "Rejected":
            return "#EF4444";
          default:
            return "#F59E0B";
        }
      };

      const infoContent = `
        <div style="max-width: 300px; padding: 8px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 20px; margin-right: 8px;">${emoji}</span>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600;">
              ${
                report.isSOS
                  ? "🆘 SOS ALERT"
                  : report.disasterType || "Emergency"
              }
            </h3>
          </div>
          
          <div style="margin-bottom: 8px;">
            <span style="
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 500;
              color: white;
              background-color: ${getStatusColor(report.status)};
            ">
              ${report.status || "Pending"}
            </span>
            ${
              report.confidence
                ? `
              <span style="
                display: inline-block;
                margin-left: 8px;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                background-color: #E5E7EB;
                color: #374151;
              ">
                ${Math.round(report.confidence * 100)}% confidence
              </span>
            `
                : ""
            }
          </div>

          <p style="margin: 8px 0; font-size: 14px; line-height: 1.4;">
            ${report.description || "No description available"}
          </p>

          <div style="font-size: 12px; color: #6B7280; margin-top: 8px;">
            <p style="margin: 2px 0;">
              <strong>📍 Location:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}
            </p>
            <p style="margin: 2px 0;">
              <strong>🕒 Reported:</strong> ${formatDate(report.createdAt)}
            </p>
            ${
              report.reportedBy?.name
                ? `
              <p style="margin: 2px 0;">
                <strong>👤 Reporter:</strong> ${report.reportedBy.name}
              </p>
            `
                : ""
            }
          </div>
        </div>
      `;

      // Add click listener to show info window
      marker.addListener("click", () => {
        infoWindow.setContent(infoContent);
        infoWindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Auto-fit map to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      reports.forEach((report) => {
        let lat, lng;
        if (report.location?.coordinates) {
          lng = report.location.coordinates[0];
          lat = report.location.coordinates[1];
        } else if (report.latitude && report.longitude) {
          lat = report.latitude;
          lng = report.longitude;
        }
        if (lat && lng) {
          bounds.extend({ lat, lng });
        }
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  return (
    <>
      <style jsx global>{`
        .custom-marker {
          cursor: pointer;
        }

        .marker-default,
        .marker-fire,
        .marker-flood,
        .marker-earthquake,
        .marker-other,
        .marker-sos {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          font-size: 16px;
          transition: transform 0.2s;
        }

        .marker-default:hover,
        .marker-fire:hover,
        .marker-flood:hover,
        .marker-earthquake:hover,
        .marker-other:hover,
        .marker-sos:hover {
          transform: scale(1.1);
        }

        .marker-fire {
          background-color: #dc2626;
        }
        .marker-flood {
          background-color: #2563eb;
        }
        .marker-earthquake {
          background-color: #7c2d12;
        }
        .marker-other {
          background-color: #f59e0b;
        }
        .marker-sos {
          background-color: #dc2626;
          animation: pulse 2s infinite;
        }
        .marker-default {
          background-color: #6b7280;
        }

        .marker-sos.verified {
          background-color: #059669;
        }
        .marker-default.verified,
        .marker-fire.verified,
        .marker-flood.verified,
        .marker-earthquake.verified,
        .marker-other.verified {
          background-color: #059669;
        }

        .marker-default.rejected,
        .marker-fire.rejected,
        .marker-flood.rejected,
        .marker-earthquake.rejected,
        .marker-other.rejected,
        .marker-sos.rejected {
          background-color: #6b7280;
          opacity: 0.6;
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
        }

        .marker-emoji {
          color: white;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        }
      `}</style>

      <div className="relative">
        <div ref={mapRef} className="w-full h-full min-h-[500px] rounded-lg" />

        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading Emergency Dashboard...</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs animate-pulse">
                🆘
              </div>
              <span>SOS Alert</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs">
                🔥
              </div>
              <span>Fire Emergency</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                🌊
              </div>
              <span>Flood Emergency</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center text-white text-xs">
                ⚠️
              </div>
              <span>Other Emergency</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">
                ✓
              </div>
              <span>Verified Report</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
