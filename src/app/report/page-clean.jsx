"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../contexts/AuthContext";

export default function Report() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
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
    initMap();
  }, []);

  const initMap = async () => {
    if (!window.google) {
      setTimeout(initMap, 100);
      return;
    }

    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    const map = new Map(mapRef.current, {
      center: { lat: 28.4595, lng: 77.0266 },
      zoom: 12,
      mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
    });

    mapInstanceRef.current = map;

    const marker = new AdvancedMarkerElement({
      map,
      position: { lat: 28.4595, lng: 77.0266 },
      gmpDraggable: true,
    });

    markerRef.current = marker;

    map.addListener("click", (e) => {
      const lngLat = [e.latLng.lng(), e.latLng.lat()];
      setCoordinates(lngLat);
      marker.position = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    });

    marker.addListener("dragend", () => {
      const lngLat = [marker.position.lng, marker.position.lat];
      setCoordinates(lngLat);
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

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
        .split("; ")
        .find((row) => row.startsWith("auth-token="))
        ?.split("=")[1];

      const formData = new FormData();
      formData.append("longitude", String(coordinates[0]));
      formData.append("latitude", String(coordinates[1]));
      formData.append("description", description);
      formData.append("isSOS", isSOS);
      for (const file of images) formData.append("images", file);

      const response = await axios.post("/api/reports", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess(
        `Report submitted successfully! ${isSOS ? "SOS alert activated." : ""}`
      );
      setDescription("");
      setImages([]);
      setIsSOS(false);
      setUserCaptchaInput("");
      generateCaptcha();

      // Reset map marker
      if (markerRef.current) {
        markerRef.current.position = { lat: 28.4595, lng: 77.0266 };
        setCoordinates(null);
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError(
          "Rate limit exceeded. Please wait before submitting another report."
        );
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
              ref={mapRef}
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sos"
                checked={isSOS}
                onChange={(e) => setIsSOS(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="sos" className="text-sm font-medium text-red-600">
                🚨 This is an SOS/Emergency Alert
              </label>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Emergency Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Describe the emergency situation in detail..."
                required
              />
            </div>

            {/* Image Upload */}
            <div>
              <label
                htmlFor="images"
                className="block text-sm font-medium text-gray-700"
              >
                Upload Images (Optional)
              </label>
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {images.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {images.length} image(s) selected
                </p>
              )}
            </div>

            {/* CAPTCHA */}
            <div>
              <label
                htmlFor="captcha"
                className="block text-sm font-medium text-gray-700"
              >
                Security Check: {captcha}
              </label>
              <input
                type="text"
                id="captcha"
                value={userCaptchaInput}
                onChange={(e) => setUserCaptchaInput(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter the answer"
                required
              />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">{success}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !coordinates}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                submitting || !coordinates
                  ? "bg-gray-400 cursor-not-allowed"
                  : isSOS
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {submitting
                ? "Submitting..."
                : isSOS
                ? "🚨 Send SOS Alert"
                : "Submit Report"}
            </button>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
