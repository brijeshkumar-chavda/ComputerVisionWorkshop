import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { API_URL } from "../../../config/api";
import "./RealtimeView.css";

export const RealtimeView = ({ setResult }) => {
  const webcamRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const intervalRef = useRef(null);

  const captureAndAnalyze = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], "webcam-frame.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("image", file);

      try {
        const apiRes = await fetch(`${API_URL}/analyze-live`, {
          method: "POST",
          body: formData,
        });
        const data = await apiRes.json();
        setResult((prev) => data.result);
      } catch (err) {
        console.error(err);
      }
    }
  }, [webcamRef, setResult]);

  const startRealtime = () => {
    setIsCapturing(true);
    setResult("Starting vision stream...");

    // Trigger immediately first time (so user doesn't wait 5s)
    setTimeout(() => captureAndAnalyze(), 100);

    intervalRef.current = setInterval(captureAndAnalyze, 5000);
  };

  const stopRealtime = () => {
    setIsCapturing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopRealtime();
  }, []);

  return (
    <>
      <div className="preview-box">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: "user",
            aspectRatio: 1, // Request square aspect ratio from camera if possible
          }}
          className="webcam-video"
        />
      </div>
      <div className="controls">
        {!isCapturing ? (
          <button onClick={startRealtime} className="btn-start">
            Start AI Vision
          </button>
        ) : (
          <button onClick={stopRealtime} className="btn-stop">
            Stop
          </button>
        )}
      </div>
      {isCapturing && <p className="loading">AI is watching...</p>}
    </>
  );
};
