"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function Dashboard() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    initMap();
    fetchReports();
    const interval = setInterval(fetchReports, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers();
    }
  }, [reports]);

  const initMap = async () => {
    if (!window.google) {
      setTimeout(initMap, 100);
      return;
    }

    const { Map } = await google.maps.importLibrary("maps");

    const map = new Map(mapRef.current, {
      center: { lat: 28.4595, lng: 77.0266 },
      zoom: 10,
      mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
    });

    mapInstanceRef.current = map;
  };

  const fetchReports = async () => {
    try {
      const response = await axios.get("/api/reports");
      setReports(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports");
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
      let lat, lng;
      if (report.location?.coordinates) {
        lng = report.location.coordinates[0];
        lat = report.location.coordinates[1];
      } else if (report.latitude && report.longitude) {
        lat = report.latitude;
        lng = report.longitude;
      } else {
        return;
      }

      const markerElement = document.createElement("div");
      let bgColor = "#6B7280";

      if (report.isSOS) {
        bgColor = "#DC2626";
        markerElement.className = "animate-pulse";
      } else if (report.status === "Verified") {
        bgColor = "#059669";
      } else if (report.status === "Rejected") {
        bgColor = "#6B7280";
      } else {
        bgColor = "#F59E0B";
      }

      markerElement.innerHTML = `
        <div style="
          width: 24px;
          height: 24px;
          background-color: ${bgColor};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: bold;
        ">
          ${report.isSOS ? "🆘" : "⚠️"}
        </div>
      `;

      const marker = new AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat, lng },
        content: markerElement,
      });

      const infoWindow = new InfoWindow();

      marker.addListener("click", () => {
        const content = `
          <div style="max-width: 250px; padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-weight: 600;">
              ${report.isSOS ? "🆘 SOS ALERT" : "Emergency Report"}
            </h3>
            <p style="margin: 0 0 6px 0; font-size: 14px;">${
              report.description || "No description"
            }</p>
            <div style="font-size: 12px; color: #666;">
              <p style="margin: 2px 0;"><strong>Status:</strong> ${
                report.status || "Pending"
              }</p>
              <p style="margin: 2px 0;"><strong>Type:</strong> ${
                report.disasterType || "Other"
              }</p>
              <p style="margin: 2px 0;"><strong>Time:</strong> ${new Date(
                report.createdAt
              ).toLocaleString()}</p>
            </div>
          </div>
        `;
        infoWindow.setContent(content);
        infoWindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
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
    <ProtectedRoute>
      <main className="h-[calc(100vh-64px)] relative">
        <div ref={mapRef} className="w-full h-full" />

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-semibold text-gray-900 mb-3">Report Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
              <span>SOS Alert</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span>Verified</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span>Rejected</span>
            </div>
          </div>
          {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}
        </div>
      </main>
    </ProtectedRoute>
  );
}
