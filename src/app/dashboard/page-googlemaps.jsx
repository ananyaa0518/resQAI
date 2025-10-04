"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import ProtectedRoute from "../../components/ProtectedRoute";
import GoogleMapsDashboard from "../../components/GoogleMapsDashboard";

export default function EmergencyDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    sos: 0,
  });

  useEffect(() => {
    fetchReports();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get("/api/reports");
      const reportsData = response.data;

      setReports(reportsData);

      // Calculate stats
      const stats = {
        total: reportsData.length,
        verified: reportsData.filter((r) => r.status === "Verified").length,
        pending: reportsData.filter((r) => r.status === "Pending").length,
        sos: reportsData.filter((r) => r.isSOS).length,
      };
      setStats(stats);

      setError("");
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load emergency reports");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <main className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Emergency Dashboard...</p>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🚨 Emergency Response Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time monitoring of emergency reports and incidents
              </p>
            </div>

            {/* Stats */}
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-4">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                📊 Total: {stats.total}
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                ✅ Verified: {stats.verified}
              </div>
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                ⏳ Pending: {stats.pending}
              </div>
              {stats.sos > 0 && (
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                  🆘 SOS: {stats.sos}
                </div>
              )}
            </div>
          </div>

          {/* Auto-refresh indicator */}
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Live updates every 30 seconds
            <button
              onClick={fetchReports}
              className="ml-4 text-blue-600 hover:text-blue-800"
            >
              🔄 Refresh Now
            </button>
          </div>

          {error && (
            <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <GoogleMapsDashboard reports={reports} />

          {/* Emergency Alerts Overlay */}
          {stats.sos > 0 && (
            <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse z-10">
              <div className="flex items-center">
                <span className="text-lg mr-2">🆘</span>
                <div>
                  <div className="font-bold">ACTIVE SOS ALERTS</div>
                  <div className="text-sm">
                    {stats.sos} emergency call{stats.sos > 1 ? "s" : ""} need
                    immediate attention
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="absolute bottom-4 left-4 space-y-2">
            <button
              onClick={() => (window.location.href = "/report")}
              className="block bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-all"
            >
              📝 Report Emergency
            </button>
            <button
              onClick={() => (window.location.href = "/admin")}
              className="block bg-gray-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-all"
            >
              ⚙️ Admin Panel
            </button>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
