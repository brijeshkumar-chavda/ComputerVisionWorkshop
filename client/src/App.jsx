import { useState, useEffect } from "react";
import "./App.css";
import { ThemeToggle } from "./components/ThemeToggle/ThemeToggle";
import { TabNavigation } from "./components/TabNavigation/TabNavigation";
import { ResultPanel } from "./components/ResultPanel/ResultPanel";
import { ImageView } from "./components/ImageView/ImageView";
import { VideoView } from "./components/VideoView/VideoView";
import { RealtimeView } from "./components/RealtimeView/RealtimeView";

function App() {
  const [activeTab, setActiveTab] = useState("image");
  const [darkMode, setDarkMode] = useState(true);

  // Shared State
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setResult(""); // Clear result when switching tabs
    setLoading(false);
  };

  return (
    <div className="app-container">
      <ThemeToggle darkMode={darkMode} toggleTheme={toggleTheme} />

      <h1>AI Vision Assistant</h1>

      <div className="main-layout">
        <div className="left-panel">
          <TabNavigation
            activeTab={activeTab}
            handleTabChange={handleTabChange}
          />

          <div className="content-area">
            {activeTab === "image" && (
              <ImageView setLoading={setLoading} setResult={setResult} />
            )}

            {activeTab === "video" && (
              <VideoView setLoading={setLoading} setResult={setResult} />
            )}

            {activeTab === "realtime" && <RealtimeView setResult={setResult} />}
          </div>
        </div>

        <ResultPanel result={result} loading={loading} />
      </div>
    </div>
  );
}

export default App;
