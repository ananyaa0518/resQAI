"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Pending");
  const { user } = useAuth();

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
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
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const verifyReport = async (reportId, status, notes = "") => {
    try {
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
        </div>
      </ProtectedRoute>
    );
  }

  return (
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
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
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
                        )}
                      </div>
                    </div>
                  </div>

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
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
