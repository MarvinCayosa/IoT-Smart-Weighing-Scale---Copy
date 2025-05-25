"use client"

import { useState } from "react"
import { Loader, X, CheckCircle2, Wifi } from "lucide-react"
import { useAuth } from "../context/AuthContext"

// ESP32 Configuration
const ESP32_IP = "192.168.139.68"
const CREDENTIALS_ENDPOINT = `http://${ESP32_IP}/set-credentials`

export default function ConnectionModal({ isOpen, onClose, onConnect }) {
  const { user } = useAuth()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState("")

  const sendCredentialsToESP32 = async () => {
    if (!user?.email) {
      setError("User email not available");
      return;
    }

    try {
      setSending(true);
      setError(null);
      setSuccess(false);
      setConfirmationMessage("");

      // Get the user's Firebase password from the user object
      const userPassword = user.password || user.userInfo?.password;
      
      if (!userPassword) {
        setError("User password not available");
        return;
      }

      // Create form data to match ESP32's expected format
      const formData = new URLSearchParams();
      formData.append('email', user.email);
      formData.append('password', userPassword);

      console.log("Attempting to send credentials to ESP32...");
      console.log("Email:", user.email);
      console.log("Endpoint:", CREDENTIALS_ENDPOINT);
      console.log("Form data:", formData.toString());

      // Send the POST request to /set-credentials
      console.log("Sending POST request to ESP32...");
      const response = await fetch(CREDENTIALS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData
      });

      console.log("Response status:", response.status);
      console.log("Response status text:", response.statusText);
      
      const responseText = await response.text();
      console.log("ESP32 Response:", responseText);

      // Check the response status and message
      if (response.ok) {
        if (responseText.includes("✅")) {
          setSuccess(true);
          setConfirmationMessage("Device synced successfully!");
          onConnect(true, ESP32_IP);
          
          // Close the modal after a short delay
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          throw new Error("Authentication failed on ESP32");
        }
      } else if (response.status === 401) {
        throw new Error("Authentication failed. Please check your credentials.");
      } else if (response.status === 400) {
        throw new Error("Missing email or password");
      } else {
        throw new Error(`Server responded with ${response.status}: ${responseText}`);
      }
    } catch (err) {
      console.error("Detailed error:", err);
      // If we get a network error after sending the request,
      // it might mean the ESP32 received the data and restarted
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        // If we were in the process of sending, consider it a success
        // as the ESP32 likely received the credentials and restarted
        setSuccess(true);
        setConfirmationMessage("Device synced successfully!");
        onConnect(true);
        // Close the modal after a short delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(err.message || "Failed to send credentials to ESP32");
      }
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A0F09] border border-[#1A1F19] rounded-[30px] w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Connect to ScaleUP</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          {!user?.email && (
            <div className="bg-red-500 bg-opacity-10 text-red-400 p-4 rounded-lg mb-4">
              <p className="text-sm">
                Please sign in to your account before connecting to the ESP32.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-500 bg-opacity-10 text-red-400 p-4 rounded-lg mb-4">
              <p className="text-sm whitespace-pre-line">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500 bg-opacity-10 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-green-400 font-medium">Device Connected Successfully!</p>
                  <p className="text-green-400 text-sm opacity-80">Your ScaleUP is now synced with your account.</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Click the button below to connect your ScaleUP device to your account.
              The device will restart after receiving the credentials.
            </p>

            <button
              onClick={sendCredentialsToESP32}
              disabled={sending || !user?.email}
              className="w-full bg-[#D3A2FF] hover:bg-[#C090EE] text-black font-medium py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wifi size={18} />
                  Connect Device
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
