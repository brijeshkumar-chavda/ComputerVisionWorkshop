import React from "react";
import "./TabNavigation.css";

export const TabNavigation = ({ activeTab, handleTabChange }) => (
  <div className="tabs">
    <button
      className={`tab-btn ${activeTab === "image" ? "active" : ""}`}
      onClick={() => handleTabChange("image")}
    >
      📷 Image
    </button>
    <button
      className={`tab-btn ${activeTab === "video" ? "active" : ""}`}
      onClick={() => handleTabChange("video")}
    >
      🎥 Video
    </button>
    <button
      className={`tab-btn ${activeTab === "realtime" ? "active" : ""}`}
      onClick={() => handleTabChange("realtime")}
    >
      🔴 Live
    </button>
  </div>
);
