"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import ProtectedRoute from "../../components/ProtectedRoute";
import GoogleMapsEmergencySelector from "../../components/GoogleMapsEmergencySelector";
import { useAuth } from "../../contexts/AuthContext";

export default function ReportEmergency() {
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

  useEffect(() => {
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
    if (files.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }
    setImages(files);
  };

  const getDescriptionPlaceholder = () => {
    if (isSOS) {
      return `🆘 SOS EMERGENCY - Describe your situation:
• What type of emergency (medical, safety threat, accident)
• Your exact location and situation
• How many people need help
• Any immediate dangers

Example: "Medical emergency at City Mall food court. Person collapsed, unconscious, not breathing. CPR in progress. Need ambulance immediately."`;
    }

    return `📝 Describe the emergency in detail:
• Type of disaster (fire, flood, earthquake, accident, etc.)
• Exact location with landmarks
• How many people affected or at risk
• Current situation (spreading, contained, getting worse)
• What kind of help is needed urgently

Example: "Building fire at 123 Main Street near Central Park. Heavy smoke on 2nd floor. 10+ people evacuated safely, but fire is spreading. Fire department needed urgently."`;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!coordinates) {
      setError("Please select the emergency location on the map.");
      return;
    }

    if (!description.trim()) {
      setError("Please provide a detailed description of the emergency.");
      return;
    }

    if (description.trim().length < 20) {
      setError(
        "Please provide more details about the emergency (minimum 20 characters)."
      );
      return;
    }

    if (!userCaptchaInput || userCaptchaInput !== captchaAnswer) {
      setError("Please solve the security question correctly.");
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
      formData.append("description", description.trim());
      formData.append("address", address);
      formData.append("isSOS", isSOS);

      // Add images
      for (const file of images) {
        formData.append("images", file);
      }

      const response = await axios.post("/api/reports", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess(
        isSOS
          ? "🆘 SOS Alert sent successfully! Emergency responders have been notified."
          : "✅ Emergency report submitted successfully! Authorities will be notified shortly."
      );

      // Reset form
      setDescription("");
      setAddress("");
      setImages([]);
      setIsSOS(false);
      setUserCaptchaInput("");
      setCoordinates(null);
      generateCaptcha();

      // Clear the address search input
      const addressInput = document.getElementById("address-search");
      if (addressInput) {
        addressInput.value = "";
      }
    } catch (err) {
      console.error("Submit error:", err);
      if (err.response?.status === 429) {
        setError(
          "Rate limit exceeded. Please wait before submitting another report."
        );
      } else if (err.response?.status === 401) {
        setError("Please log in to submit a report.");
      } else {
        setError(
          "Failed to submit report. Please check your connection and try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-7xl px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚨 Report Emergency
          </h1>
          <p className="text-lg text-gray-600">
            Use this form to report emergencies, disasters, or request immediate
            help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map Section */}
          <div className="space-y-6">
            <GoogleMapsEmergencySelector
              onLocationSelect={handleLocationSelect}
              onAddressChange={handleAddressChange}
              center={{ lat: 28.4595, lng: 77.0266 }} // Delhi, India
            />
          </div>

          {/* Form Section */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Emergency Type Toggle */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="sos"
                    checked={isSOS}
                    onChange={(e) => setIsSOS(e.target.checked)}
                    className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="sos"
                    className="flex items-center text-red-700 font-medium"
                  >
                    🆘{" "}
                    <span className="ml-2">
                      This is an SOS/Life-threatening Emergency
                    </span>
                  </label>
                </div>
                <p className="text-sm text-red-600 mt-2">
                  Check this box if someone's life is in immediate danger and
                  needs urgent rescue/medical attention.
                </p>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {isSOS
                    ? "🆘 Emergency Description *"
                    : "📝 Emergency Description *"}
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                    isSOS
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder={getDescriptionPlaceholder()}
                  required
                />
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-gray-500">
                    Minimum 20 characters required
                  </span>
                  <span
                    className={`${
                      description.length < 20
                        ? "text-red-500"
                        : "text-green-600"
                    }`}
                  >
                    {description.length}/500
                  </span>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label
                  htmlFor="images"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  📷 Upload Images (Optional, max 5)
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
                  <div className="mt-2">
                    <p className="text-sm text-green-600">
                      ✅ {images.length} image{images.length > 1 ? "s" : ""}{" "}
                      selected
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      {images.map((file, index) => (
                        <div key={index}>• {file.name}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Security CAPTCHA */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label
                  htmlFor="captcha"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  🔒 Security Check: Solve this math problem
                </label>
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-mono bg-white px-3 py-2 rounded border">
                    {captcha}
                  </span>
                  <input
                    type="text"
                    id="captcha"
                    value={userCaptchaInput}
                    onChange={(e) => setUserCaptchaInput(e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="?"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    🔄 New Problem
                  </button>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                  <span className="block sm:inline">❌ {error}</span>
                </div>
              )}

              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                  <span className="block sm:inline">{success}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !coordinates || description.length < 20}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                  submitting || !coordinates || description.length < 20
                    ? "bg-gray-400 cursor-not-allowed text-gray-200"
                    : isSOS
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl animate-pulse"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting Report...
                  </span>
                ) : isSOS ? (
                  "🆘 SEND SOS ALERT - URGENT HELP NEEDED"
                ) : (
                  "📤 Submit Emergency Report"
                )}
              </button>

              {/* Form Validation Helper */}
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                <h4 className="font-medium mb-2">📋 Before submitting:</h4>
                <ul className="space-y-1">
                  <li
                    className={coordinates ? "text-green-600" : "text-gray-600"}
                  >
                    {coordinates ? "✅" : "☐"} Location selected on map
                  </li>
                  <li
                    className={
                      description.length >= 20
                        ? "text-green-600"
                        : "text-gray-600"
                    }
                  >
                    {description.length >= 20 ? "✅" : "☐"} Detailed description
                    provided (min 20 chars)
                  </li>
                  <li
                    className={
                      userCaptchaInput === captchaAnswer
                        ? "text-green-600"
                        : "text-gray-600"
                    }
                  >
                    {userCaptchaInput === captchaAnswer ? "✅" : "☐"} Security
                    question solved
                  </li>
                </ul>
              </div>
            </form>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
