import React, { useState } from "react";
import { API_URL } from "../config/api";

export const ImageView = ({ setLoading, setResult }) => {
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setImageUrl("");
      setPreview(URL.createObjectURL(selected));
      setResult("");
    }
  };

  const analyzeImage = async () => {
    setLoading(true);
    try {
      let body;
      let headers = {};

      if (imageUrl) {
        body = JSON.stringify({ imageUrl });
        headers = { "Content-Type": "application/json" };
      } else {
        const formData = new FormData();
        formData.append("image", file);
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

  return (
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
            setFile(null);
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
        <button onClick={analyzeImage}>Analyze Image</button>
      )}
    </>
  );
};
