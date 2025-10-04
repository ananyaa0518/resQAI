import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom colored markers
const createColoredIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-color: ${color};
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    ">${getEmoji(color)}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

const getEmoji = (color) => {
  if (color === '#FF0000') return '🚨';
  if (color === '#FF6B00') return '🔥';
  if (color === '#0066FF') return '🌊';
  if (color === '#8B4513') return '🏚️';
  if (color === '#FFD700') return '🚗';
  return '⚠️';
};

export default function DisasterMap() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('http://localhost:8000/reports');
        const data = await response.json();
        setReports(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setLoading(false);
      }
    };

    fetchReports();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, []);

  const getMarkerColor = (type) => {
    switch(type) {
      case 'SOS': return '#FF0000';      // Red
      case 'Fire': return '#FF6B00';     // Orange
      case 'Flood': return '#0066FF';    // Blue
      case 'Earthquake': return '#8B4513'; // Brown
      case 'Accident': return '#FFD700';  // Yellow
      default: return '#808080';         // Gray
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading map...</div>;
  }

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <MapContainer
        center={[17.385, 78.4867]}  // Hyderabad
        zoom={11}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Map Tiles - Free OpenStreetMap */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Disaster Report Markers */}
        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createColoredIcon(getMarkerColor(report.disaster_type))}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ 
                  color: getMarkerColor(report.disaster_type),
                  marginTop: 0,
                  marginBottom: '10px'
                }}>
                  {report.disaster_type}
                </h3>
                <p style={{ margin: '5px 0' }}>
                  <strong>Report:</strong> {report.text}
                </p>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                  <strong>Status:</strong> {report.status}
                </p>
                <p style={{ margin: '5px 0', fontSize: '11px', color: '#999' }}>
                  {new Date(report.created_at).toLocaleString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1000
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Disaster Types</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#FF0000' }} />
            <span>🚨 SOS Alert</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#FF6B00' }} />
            <span>🔥 Fire</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#0066FF' }} />
            <span>🌊 Flood</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#8B4513' }} />
            <span>🏚️ Earthquake</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#FFD700' }} />
            <span>🚗 Accident</span>
          </div>
        </div>
      </div>

      {/* Report Count */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        backgroundColor: 'white',
        padding: '10px 20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1000
      }}>
        <strong>{reports.length}</strong> Active Reports
      </div>
    </div>
  );
}