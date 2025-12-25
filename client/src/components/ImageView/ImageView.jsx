import React, { useState } from "react";
import { API_URL } from "../../../config/api";
import "./ImageView.css";

export const ImageView = ({ setLoading, setResult }) => {
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

  const analyzeImage = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_URL}/analyze-image`, {
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
      <div className="input-group">
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      <div className="preview-box">
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            onError={(e) => (e.target.src = "")}
          />
        ) : (
          <p>Select an image to analyze</p>
        )}
      </div>

      {file && <button onClick={analyzeImage}>Analyze Image</button>}
    </>
  );
};
