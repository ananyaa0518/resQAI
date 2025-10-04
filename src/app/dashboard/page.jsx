"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function Dashboard() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      try {
        const L = await import('leaflet');
        
        // Fix for default markers in Leaflet
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Check if container is already initialized
        if (mapContainerRef.current._leaflet_id) {
          return;
        }

        // Create map with proper container - centered on India
        mapRef.current = L.map(mapContainerRef.current, {
          center: [20.5937, 78.9629], // Center of India
          zoom: 5,
          zoomControl: true
        });
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(mapRef.current);

        // Force map to resize and create demo markers
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
            // Create demo markers after map is ready
            createDemoMarkers();
          }
        }, 100);

      } catch (error) {
        console.error('Error loading map:', error);
      }
    };

    loadLeaflet();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Function to create demo markers
  const createDemoMarkers = async () => {
    if (!mapRef.current) {
      console.log("Map not ready for demo markers");
      return;
    }
    
    try {
      const L = await import('leaflet');
      const map = mapRef.current;
      
      console.log("Creating demo markers...");
      console.log("Map object:", map);
      console.log("Map container:", mapContainerRef.current);
      
      // Demo reports data
      const demoReports = [
        {
          id: 'demo-1',
          text: "Flood in downtown area - water level rising rapidly",
          latitude: 28.6139, // Delhi, India
          longitude: 77.2090,
          disaster_type: "FLOOD",
          status: "Verified",
          created_at: new Date().toISOString()
        },
        {
          id: 'demo-2',
          text: "Fire reported in residential building",
          latitude: 19.0760, // Mumbai, India
          longitude: 72.8777,
          disaster_type: "FIRE",
          status: "Pending",
          created_at: new Date().toISOString()
        },
        {
          id: 'demo-3',
          text: "SOS - Women's safety emergency",
          latitude: 12.9716, // Bangalore, India
          longitude: 77.5946,
          disaster_type: "SOS",
          status: "Verified",
          created_at: new Date().toISOString()
        },
        {
          id: 'demo-4',
          text: "Earthquake tremors felt in the area",
          latitude: 22.5726, // Kolkata, India
          longitude: 88.3639,
          disaster_type: "EARTHQUAKE",
          status: "Rejected",
          created_at: new Date().toISOString()
        },
        {
          id: 'demo-5',
          text: "Car accident on highway - multiple vehicles involved",
          latitude: 13.0827, // Chennai, India
          longitude: 80.2707,
          disaster_type: "ACCIDENT",
          status: "Pending",
          created_at: new Date().toISOString()
        }
      ];

      // Add demo markers with custom colors
      for (const demoReport of demoReports) {
        const lng = demoReport.longitude;
        const lat = demoReport.latitude;
        console.log(`Creating demo marker for ${demoReport.disaster_type} at [${lat}, ${lng}]`);
        
        // Determine color based on status and type
        let iconColor = 'blue';
        let iconSize = [20, 20];
        
        if (demoReport.disaster_type === "SOS") {
          iconColor = 'red';
          iconSize = [25, 25];
        } else if (demoReport.status === "Verified") {
          iconColor = 'green';
        } else if (demoReport.status === "Rejected") {
          iconColor = 'gray';
        } else {
          iconColor = 'orange';
        }
        
        console.log(`Creating ${iconColor} marker for ${demoReport.disaster_type}`);
        
        // Create colored circle marker
        const marker = L.circleMarker([lat, lng], {
          radius: iconSize[0],
          fillColor: iconColor,
          color: 'white',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
          demoMarker: true
        })
          .bindPopup(`
            <div style="min-width:250px; padding:8px">
              <h3 style="margin:0 0 8px 0;font-weight:600;color:#1f2937">
                ${demoReport.disaster_type === "SOS" ? "🚨 SOS ALERT" : "Emergency Report"}
              </h3>
              <p style="margin:0 0 6px 0;font-size:14px">${demoReport.text}</p>
              <div style="margin:6px 0;font-size:12px">
                <p style="margin:2px 0"><strong>Type:</strong> ${demoReport.disaster_type}</p>
                <p style="margin:2px 0"><strong>Status:</strong> <span style="color:${demoReport.status === 'Verified' ? 'green' : demoReport.status === 'Rejected' ? 'red' : 'orange'}">${demoReport.status}</span></p>
                <p style="margin:2px 0"><strong>Time:</strong> ${new Date(demoReport.created_at).toLocaleString()}</p>
                <p style="margin:2px 0"><strong>Demo:</strong> This is a demo marker</p>
              </div>
            </div>
          `)
          .addTo(map);
        
        console.log(`Added ${iconColor} demo marker for ${demoReport.disaster_type}`);
      }
      
      
      console.log("Demo markers created and added to map");
    } catch (error) {
      console.error('Error creating demo markers:', error);
    }
  };

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        setError("");
        
        const res = await axios.get("http://localhost:8000/reports");
        console.log("Reports response:", res.data);
        console.log("Number of reports:", res.data?.length || 0);
        setReports(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      } catch (e) {
        console.error("Error fetching reports:", e);
        setError(`Failed to load reports: ${e.message}`);
        setLoading(false);
      }
    }
    fetchReports();
    const id = setInterval(fetchReports, 15000);
    return () => clearInterval(id);
  }, []);


  // Handle real reports separately
  useEffect(() => {
    if (!mapRef.current) return;
    
    const loadRealReports = async () => {
      try {
        const L = await import('leaflet');
        const map = mapRef.current;
        
        console.log("Creating markers for real reports:", reports);
        
        // Remove only real report markers (not demo ones)
        map.eachLayer((layer) => {
          if (layer instanceof L.Marker && layer.options && layer.options.realReport) {
            console.log("Removing old real report marker");
            map.removeLayer(layer);
          }
        });
        
        for (const r of reports) {
          const lng = r.longitude;
          const lat = r.latitude;
          console.log("Processing real report:", r, "lng:", lng, "lat:", lat);
          if (typeof lng !== "number" || typeof lat !== "number") {
            console.log("Skipping report - invalid coordinates");
            continue;
          }
          
          // Create custom icon based on status
          let iconColor = 'blue';
          let iconSize = [20, 20];
          
          if (r.disaster_type === "SOS") {
            iconColor = 'red';
            iconSize = [25, 25];
          } else if (r.status === "Verified") {
            iconColor = 'green';
          } else if (r.status === "Rejected") {
            iconColor = 'gray';
          } else {
            iconColor = 'orange';
          }
          
          console.log(`Real Report ${r.id}: disaster_type=${r.disaster_type}, status=${r.status}, color=${iconColor}`);
          
          // Create a colored circle element
          const markerHTML = `
            <div style="
              background-color: ${iconColor};
              width: ${iconSize[0]}px;
              height: ${iconSize[1]}px;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: block;
              position: relative;
              ${r.disaster_type === "SOS" ? 'animation: pulse 2s infinite;' : ''}
            "></div>
          `;
          
          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: markerHTML,
            iconSize: iconSize,
            iconAnchor: [iconSize[0]/2, iconSize[1]/2],
            popupAnchor: [0, -iconSize[1]/2]
          });
          
          const description = r.text || "No description";
          const status = r.status || "Pending";
          const disasterType = r.disaster_type || "Other";
          const isSOS = r.disaster_type === "SOS" ? "🚨 SOS ALERT" : "";
          const timestamp = r.created_at
            ? new Date(r.created_at).toLocaleString()
            : "";
          
          const marker = L.marker([lat, lng], { 
            icon: customIcon,
            realReport: true // Mark as real report for cleanup
          })
            .bindPopup(`
              <div style="min-width:250px; padding:8px">
                <h3 style="margin:0 0 8px 0;font-weight:600;color:#1f2937">
                  ${isSOS || "Emergency Report"}
                </h3>
                <p style="margin:0 0 6px 0;font-size:14px">${description}</p>
                <div style="margin:6px 0;font-size:12px">
                  <p style="margin:2px 0"><strong>Type:</strong> ${disasterType}</p>
                  <p style="margin:2px 0"><strong>Status:</strong> <span style="color:${status === 'Verified' ? 'green' : status === 'Rejected' ? 'red' : 'orange'}">${status}</span></p>
                  <p style="margin:2px 0"><strong>Time:</strong> ${timestamp}</p>
                </div>
              </div>
            `)
            .addTo(map);
        }
        
        console.log("Real report markers updated");
      } catch (error) {
        console.error('Error loading real report markers:', error);
      }
    };
    
    loadRealReports();
  }, [reports]);

  return (
    <ProtectedRoute>
      <main className="h-[calc(100vh-64px)] relative">
        {/* 64px ~ navbar height */}
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-[9999] border-2 border-gray-300">
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
        
        {loading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg px-6 py-4 z-10">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Loading reports...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-red-50 border border-red-200 px-4 py-2 shadow z-10">
            <p className="text-sm text-red-600">{error}</p>
            <p className="text-xs text-red-500 mt-1">Make sure your Python backend is running on localhost:8000</p>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
