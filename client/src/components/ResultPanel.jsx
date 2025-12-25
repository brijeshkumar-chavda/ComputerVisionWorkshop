import React from "react";

export const ResultPanel = ({ result, loading }) => (
  <div className="right-panel">
    <div className={`result-box ${result ? "has-result" : ""}`}>
      <h3>🤖 AI Analysis</h3>
      {loading && <p className="loading">Generating insight...</p>}
      {!result && !loading && (
        <p className="placeholder-text">Results will appear here...</p>
      )}
      {result && (
        <div className="result-content">
          <p>{result}</p>
        </div>
      )}
    </div>
  </div>
);
