import React, { useState } from "react";
import { API_URL } from "../config/api";

export const VideoView = ({ setLoading, setResult }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult("");
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

  return (
    <>
      <input type="file" accept="video/*" onChange={handleFileChange} />
      <div className="preview-box">
        {preview ? (
          <video src={preview} controls />
        ) : (
          <p>Select a video (>10mb recommended)</p>
        )}
      </div>
      {file && <button onClick={analyzeVideo}>Analyze Video</button>}
    </>
  );
};
