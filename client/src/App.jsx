import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
  const [activeTab, setActiveTab] = useState("image"); // image, video, realtime
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // Real-time specific state
  const webcamRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const intervalRef = useRef(null);

  // Theme State
  const [darkMode, setDarkMode] = useState(false);

  // Toggle Theme
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode");
  };

  const resetState = () => {
    setFile(null);
    setImageUrl("");
    setPreview(null);
    setResult("");
    setLoading(false);
    stopRealtime();
  };

  const handleTabChange = (tab) => {
    resetState();
    setActiveTab(tab);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setImageUrl(""); // Clear URL if file is selected
      setPreview(URL.createObjectURL(selected));
      setResult("");
    }
  };

  const analyzeImage = async (imageFile, url = null) => {
    setLoading(true);

    try {
      let body;
      let headers = {};

      if (url) {
        body = JSON.stringify({ imageUrl: url });
        headers = { "Content-Type": "application/json" };
      } else {
        const formData = new FormData();
        formData.append("image", imageFile);
        body = formData;
      }

      const res = await fetch(`${API_URL}/analyze-image`, {
        method: "POST",
        headers: headers,
        body: body,
      });
      const data = await res.json();
      setResult(data.result || data.error);
    } catch (err) {
      setResult("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeVideo = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("video", file);

    try {
      const res = await fetch(`${API_URL}/analyze-video`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data.result || data.error);
    } catch (err) {
      setResult("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Realtime Logic ---
  const captureAndAnalyze = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      // Convert Base64 to Blob
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], "webcam-frame.jpg", { type: "image/jpeg" });

      // Analyze (Silent load)
      const formData = new FormData();
      formData.append("image", file);

      try {
        const apiRes = await fetch(`${API_URL}/analyze-image`, {
          method: "POST",
          body: formData,
        });
        const data = await apiRes.json();
        setResult((prev) => data.result); // Update result live
      } catch (err) {
        console.error(err);
      }
    }
  }, [webcamRef]);

  const startRealtime = () => {
    setIsCapturing(true);
    setResult("Starting vision stream...");
    // Capture every 5 seconds to avoid rate limits
    intervalRef.current = setInterval(captureAndAnalyze, 5000);
  };

  const stopRealtime = () => {
    setIsCapturing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  return (
    <div className="app-container">
      <button className="theme-toggle" onClick={toggleTheme}>
        {darkMode ? "☀️" : "🌙"}
      </button>

      <h1>AI Vision Assistant</h1>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "image" ? "active" : ""}`}
          onClick={() => handleTabChange("image")}
        >
          📷 Image Analysis
        </button>
        <button
          className={`tab-btn ${activeTab === "video" ? "active" : ""}`}
          onClick={() => handleTabChange("video")}
        >
          🎥 Video Analysis
        </button>
        <button
          className={`tab-btn ${activeTab === "realtime" ? "active" : ""}`}
          onClick={() => handleTabChange("realtime")}
        >
          🔴 Real-time Cam
        </button>
      </div>

      <div className="content-area">
        {/* IMAGE TAB */}
        {activeTab === "image" && (
          <>
            <div className="input-group">
              <input type="file" accept="image/*" onChange={handleFileChange} />
              <span className="or-divider">- OR -</span>
              <input
                type="text"
                placeholder="Paste image URL here..."
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setPreview(e.target.value);
                  setFile(null); // Clear file if URL is used
                }}
              />
            </div>

            <div className="preview-box">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  onError={(e) => (e.target.src = "")}
                />
              ) : (
                <p>Select an image or paste a URL</p>
              )}
            </div>

            {(file || imageUrl) && (
              <button
                onClick={() => analyzeImage(file, imageUrl)}
                disabled={loading}
              >
                {loading ? "Analyzing..." : "Analyze Image"}
              </button>
            )}
          </>
        )}

        {/* VIDEO TAB */}
        {activeTab === "video" && (
          <>
            <input type="file" accept="video/*" onChange={handleFileChange} />
            <div className="preview-box">
              {preview ? (
                <video src={preview} controls />
              ) : (
                <p>Select a video (>10mb recommended)</p>
              )}
            </div>
            {file && (
              <button onClick={analyzeVideo} disabled={loading}>
                {loading
                  ? "Processing Video (This takes time)..."
                  : "Analyze Video"}
              </button>
            )}
          </>
        )}

        {/* REALTIME TAB */}
        {activeTab === "realtime" && (
          <>
            <div className="preview-box">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <div className="controls">
              {!isCapturing ? (
                <button
                  onClick={startRealtime}
                  style={{ background: "#22c55e" }}
                >
                  Start AI Vision
                </button>
              ) : (
                <button
                  onClick={stopRealtime}
                  style={{ background: "#ef4444" }}
                >
                  Stop
                </button>
              )}
            </div>
            {isCapturing && <p className="loading">AI is watching...</p>}
          </>
        )}

        {/* RESULTS AREA */}
        {result && (
          <div className="result-box">
            <h3>🤖 AI Analysis:</h3>
            <p>{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
