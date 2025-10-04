"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import ProtectedRoute from "../../components/ProtectedRoute";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function Dashboard() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!mapboxgl.accessToken) return;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [0, 20],
      zoom: 1.5,
    });
    map.addControl(new mapboxgl.NavigationControl());
    mapRef.current = map;

    return () => map.remove();
  }, []);

  useEffect(() => {
    async function fetchReports() {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth-token='))
          ?.split('=')[1];

        const res = await axios.get("/api/reports", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        setReports(
          Array.isArray(res.data) ? res.data : res.data?.reports || []
        );
      } catch (e) {
        setError("Failed to load reports.");
      }
    }
    fetchReports();
    const id = setInterval(fetchReports, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const markers = [];
    
    for (const r of reports) {
      const lng = r.longitude ?? r.location?.coordinates?.[0];
      const lat = r.latitude ?? r.location?.coordinates?.[1];
      if (typeof lng !== "number" || typeof lat !== "number") continue;
      
      const el = document.createElement("div");
      
      // Different colors based on report type and status
      if (r.isSOS) {
        el.className = "bg-red-600 rounded-full w-4 h-4 border-2 border-white shadow-lg";
        el.style.animation = "pulse 2s infinite";
      } else if (r.status === "Verified") {
        el.className = "bg-green-600 rounded-full w-3 h-3 border-2 border-white";
      } else if (r.status === "Rejected") {
        el.className = "bg-gray-400 rounded-full w-3 h-3 border-2 border-white";
      } else {
        el.className = "bg-yellow-500 rounded-full w-3 h-3 border-2 border-white";
      }
      
      const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]);
      
      const description = r.description || "No description";
      const status = r.status || "Pending";
      const disasterType = r.disasterType || "Other";
      const confidence = r.confidence || 0;
      const isSOS = r.isSOS ? "🚨 SOS ALERT" : "";
      const timestamp = r.createdAt
        ? new Date(r.createdAt).toLocaleString()
        : "";
      
      marker
        .setPopup(
          new mapboxgl.Popup({ offset: 12 }).setHTML(
            `<div style="min-width:250px; padding:8px">
               <h3 style="margin:0 0 8px 0;font-weight:600;color:#1f2937">
                 ${isSOS || "Emergency Report"}
               </h3>
               <p style="margin:0 0 6px 0;font-size:14px">${description}</p>
               <div style="margin:6px 0;font-size:12px">
                 <p style="margin:2px 0"><strong>Type:</strong> ${disasterType} (${Math.round(confidence * 100)}% confidence)</p>
                 <p style="margin:2px 0"><strong>Status:</strong> <span style="color:${status === 'Verified' ? 'green' : status === 'Rejected' ? 'red' : 'orange'}">${status}</span></p>
                 <p style="margin:2px 0"><strong>Time:</strong> ${timestamp}</p>
                 ${r.reportedBy?.name ? `<p style="margin:2px 0"><strong>Reported by:</strong> ${r.reportedBy.name}</p>` : ''}
               </div>
             </div>`
          )
        )
        .addTo(map);
      markers.push(marker);
    }
    return () => markers.forEach((m) => m.remove());
  }, [reports]);

  return (
    <ProtectedRoute>
      <main className="h-[calc(100vh-64px)] relative">
        {/* 64px ~ navbar height */}
        <div ref={mapContainerRef} className="w-full h-full" />
        
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
        </div>
        
        {error && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-white px-4 py-2 shadow border">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
