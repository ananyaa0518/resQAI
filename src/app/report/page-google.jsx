"use client";

import { useState } from "react";
import axios from "axios";
import ProtectedRoute from "../../components/ProtectedRoute";
import GoogleMapSelector from "../../components/GoogleMapSelector";
import { useAuth } from "../../contexts/AuthContext";

export default function Report() {
  const [coordinates, setCoordinates] = useState(null);
  const [address, setAddress] = useState("");
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

  useState(() => {
    generateCaptcha();
  }, []);

  const handleLocationSelect = (coords) => {
    setCoordinates(coords);
  };

  const handleAddressChange = (newAddress) => {
    setAddress(newAddress);
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
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      const formData = new FormData();
      formData.append("longitude", String(coordinates[0]));
      formData.append("latitude", String(coordinates[1]));
      formData.append("description", description);
      formData.append("address", address);
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
      setAddress("");
      setImages([]);
      setIsSOS(false);
      setUserCaptchaInput("");
      setCoordinates(null);
      generateCaptcha();
      
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
          {/* Map Section */}
          <div>
            <GoogleMapSelector
              onLocationSelect={handleLocationSelect}
              onAddressChange={handleAddressChange}
              center={{ lat: 28.43268, lng: 77.0459 }} // Default to Gurgaon
            />
            
            {coordinates && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium">Selected Location:</p>
                <p className="text-sm text-gray-600">
                  Coordinates: {coordinates[1].toFixed(5)}, {coordinates[0].toFixed(5)}
                </p>
                {address && (
                  <p className="text-sm text-gray-600 mt-1">
                    Address: {address}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the emergency situation in detail..."
                required
              />
            </div>

            {/* Image Upload */}
            <div>
              <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images (Optional)
              </label>
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {images.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {images.length} image(s) selected
                </p>
              )}
            </div>

            {/* CAPTCHA */}
            <div>
              <label htmlFor="captcha" className="block text-sm font-medium text-gray-700 mb-2">
                Security Check: {captcha}
              </label>
              <input
                type="text"
                id="captcha"
                value={userCaptchaInput}
                onChange={(e) => setUserCaptchaInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the answer"
                required
              />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !coordinates}
              className={`w-full py-3 px-4 rounded-md font-medium ${
                submitting || !coordinates
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isSOS
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {submitting 
                ? 'Submitting...' 
                : isSOS 
                ? '🚨 Send SOS Alert' 
                : 'Submit Report'
              }
            </button>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}