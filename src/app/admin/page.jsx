"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function AdminPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    try {
<<<<<<< HEAD
      const res = await axios.get("http://localhost:8000/reports");
      setReports(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    } catch (e) {
      console.error("Error fetching reports:", e);
=======
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth-token="))
        ?.split("=")[1];

      const response = await axios.get(`/api/reports?status=${filter}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setReports(response.data.reports || []);
    } catch (err) {
>>>>>>> 55914ef09a59c5831ee69ba3c9c260db004ace18
      setError("Failed to load reports");
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
<<<<<<< HEAD
      await axios.patch(`http://localhost:8000/reports/${reportId}/status`, {
        status: newStatus
      });
      
      // Update local state
      setReports(prev => prev.map(report => 
        report.id === reportId ? { ...report, status: newStatus } : report
      ));
      
      console.log(`Report ${reportId} status updated to ${newStatus}`);
    } catch (e) {
      console.error("Error updating report status:", e);
      setError("Failed to update report status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Verified": return "text-green-600 bg-green-100";
      case "Rejected": return "text-red-600 bg-red-100";
      case "Pending": return "text-orange-600 bg-orange-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getDisasterTypeColor = (type) => {
    switch (type) {
      case "SOS": return "text-red-600 bg-red-100";
      case "FLOOD": return "text-blue-600 bg-blue-100";
      case "FIRE": return "text-orange-600 bg-orange-100";
      case "EARTHQUAKE": return "text-yellow-600 bg-yellow-100";
      case "ACCIDENT": return "text-purple-600 bg-purple-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
=======
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth-token="))
        ?.split("=")[1];

      await axios.post(
        `/api/reports/${reportId}/verify`,
        {
          status,
          notes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh reports
      fetchReports();
    } catch (err) {
      setError("Failed to verify report");
    }
  };

  if (user?.role !== "admin") {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600">Admin access required</p>
          </div>
>>>>>>> 55914ef09a59c5831ee69ba3c9c260db004ace18
        </div>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage emergency reports and verify incidents
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Total Reports: {reports.length}
              </span>
              <span className="text-sm text-orange-600">
                Pending: {reports.filter(r => r.status === "Pending").length}
              </span>
            </div>
=======
    <ProtectedRoute requiredRole="admin">
      <main className="mx-auto max-w-7xl px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Verify and manage emergency reports</p>
        </div>
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {["Pending", "Verified", "Rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === status
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {status} ({reports.filter((r) => r.status === status).length})
                </button>
              ))}
            </nav>
>>>>>>> 55914ef09a59c5831ee69ba3c9c260db004ace18
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Reports List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Emergency Reports</h2>
          </div>
<<<<<<< HEAD
          
          {reports.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-500">No emergency reports have been submitted yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {reports.map((report) => (
                <div key={report.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDisasterTypeColor(report.disaster_type)}`}>
                          {report.disaster_type}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                        {report.disaster_type === "SOS" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-red-600 bg-red-100">
                            🚨 URGENT
                          </span>
=======
        ) : (
          <div className="grid gap-6">
            {reports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No {filter.toLowerCase()} reports found
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report._id}
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {report.isSOS ? "🚨 SOS Alert" : "Emergency Report"}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            report.status === "Verified"
                              ? "bg-green-100 text-green-800"
                              : report.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {report.status}
                        </span>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {report.disasterType} (
                          {Math.round(report.confidence * 100)}%)
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{report.description}</p>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>
                          <strong>Location:</strong>{" "}
                          {report.location?.coordinates?.[1]?.toFixed(4)},{" "}
                          {report.location?.coordinates?.[0]?.toFixed(4)}
                        </p>
                        <p>
                          <strong>Reported by:</strong>{" "}
                          {report.reportedBy?.name} (
                          {report.reportedBy?.phoneNumber})
                        </p>
                        <p>
                          <strong>Time:</strong>{" "}
                          {new Date(report.createdAt).toLocaleString()}
                        </p>
                        {report.verificationNotes && (
                          <p>
                            <strong>Verification Notes:</strong>{" "}
                            {report.verificationNotes}
                          </p>
>>>>>>> 55914ef09a59c5831ee69ba3c9c260db004ace18
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-900 mb-2">{report.text}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>📍 {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span>
                        <span>🕒 {new Date(report.created_at).toLocaleString()}</span>
                        <span>🆔 ID: {report.id}</span>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex space-x-2">
                      {report.status === "Pending" && (
                        <>
                          <button
                            onClick={() => updateReportStatus(report.id, "Verified")}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            ✅ Verify
                          </button>
                          <button
                            onClick={() => updateReportStatus(report.id, "Rejected")}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}
                      {report.status === "Verified" && (
                        <span className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-800 bg-green-100">
                          ✅ Verified
                        </span>
                      )}
                      {report.status === "Rejected" && (
                        <span className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-800 bg-red-100">
                          ❌ Rejected
                        </span>
                      )}
                    </div>
                  </div>
<<<<<<< HEAD
=======

                  {report.status === "Pending" && (
                    <div className="flex space-x-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => verifyReport(report._id, "Verified")}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                      >
                        ✓ Verify
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt("Rejection reason (optional):");
                          verifyReport(report._id, "Rejected", notes);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}
>>>>>>> 55914ef09a59c5831ee69ba3c9c260db004ace18
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}