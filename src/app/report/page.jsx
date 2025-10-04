"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../contexts/AuthContext";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function Report() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [coordinates, setCoordinates] = useState(null);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [isSOS, setIsSOS] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [userCaptchaInput, setUserCaptchaInput] = useState("");
  const { user } = useAuth();

  // Generate simple CAPTCHA
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = num1 + num2;
    setCaptcha(`${num1} + ${num2} = ?`);
    setCaptchaAnswer(answer.toString());
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!mapboxgl.accessToken) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [0, 0],
      zoom: 2,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl());

    mapRef.current.on("click", (e) => {
      const lngLat = [e.lngLat.lng, e.lngLat.lat];
      setCoordinates(lngLat);
      new mapboxgl.Marker().setLngLat(lngLat).addTo(mapRef.current);
    });

    return () => {
      mapRef.current && mapRef.current.remove();
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!coordinates) {
      setError("Please select a location on the map.");
      return;
    }
    
    if (!description.trim()) {
      setError("Please provide a description of the emergency.");
      return;
    }
    
    if (!userCaptchaInput || userCaptchaInput !== captchaAnswer) {
      setError("Please solve the CAPTCHA correctly.");
      return;
    }
    
    setSubmitting(true);
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      const formData = new FormData();
      formData.append("longitude", String(coordinates[0]));
      formData.append("latitude", String(coordinates[1]));
      formData.append("description", description);
      formData.append("isSOS", isSOS);
      for (const file of images) formData.append("images", file);

      const response = await axios.post("/api/reports", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        },
      });
      
      setSuccess(`Report submitted successfully! ${isSOS ? 'SOS alert activated.' : ''}`);
      setDescription("");
      setImages([]);
      setIsSOS(false);
      setUserCaptchaInput("");
      generateCaptcha();
      
      // Clear map marker
      if (mapRef.current) {
        mapRef.current.getStyle().layers.forEach(layer => {
          if (layer.id.includes('marker')) {
            mapRef.current.removeLayer(layer.id);
          }
        });
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError("Rate limit exceeded. Please wait before submitting another report.");
      } else {
        setError("Failed to submit report. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-7xl px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold mb-6">Report an Emergency</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div
              ref={mapContainerRef}
              className="h-80 w-full rounded border"
              aria-label="Map to select location"
            />
            <p className="mt-2 text-sm text-gray-600">
              Click on the map to set the location of the incident.
            </p>
            {coordinates && (
              <p className="mt-2 text-sm">
                Selected: {coordinates[1].toFixed(5)},{" "}
                {coordinates[0].toFixed(5)}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* SOS Toggle */}
            <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <input
                type="checkbox"
                id="isSOS"
                checked={isSOS}
                onChange={(e) => setIsSOS(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="isSOS" className="text-sm font-medium text-red-800">
                🚨 Women's Safety SOS Alert
              </label>
              {isSOS && (
                <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                  This will be marked as a high-priority SOS alert
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the emergency in detail..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Include details like type of emergency, severity, number of people affected, etc.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Images (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImages(Array.from(e.target.files || []))}
                className="block w-full text-sm border border-gray-300 rounded px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload photos to help responders understand the situation better
              </p>
            </div>

            {/* CAPTCHA */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium mb-2">
                Security Check *
              </label>
              <div className="flex items-center space-x-3">
                <span className="text-lg font-mono bg-white px-3 py-2 border rounded">
                  {captcha}
                </span>
                <input
                  type="text"
                  value={userCaptchaInput}
                  onChange={(e) => setUserCaptchaInput(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="?"
                  required
                />
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Refresh
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full rounded-lg px-6 py-3 text-white font-semibold transition-all duration-200 ${
                isSOS 
                  ? 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting 
                ? "Submitting..." 
                : isSOS 
                  ? "🚨 Submit SOS Alert" 
                  : "Submit Report"
              }
            </button>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
