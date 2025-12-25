import React from "react";
import "./ResultPanel.css";

export const ResultPanel = ({ result, loading }) => {
  const isStructured = typeof result === "object" && result !== null;

  return (
    <div className="right-panel">
      <div className={`result-box ${result ? "has-result" : ""}`}>
        <h3>🤖 AI Analysis</h3>
        {loading && <p className="loading">Generating insight...</p>}
        {!result && !loading && (
          <p className="placeholder-text">Results will appear here...</p>
        )}

        {result && (
          <div className="result-content">
            {isStructured ? (
              <div className="structured-output">
                <div className="field-box">
                  <label>General Description</label>
                  <p className="value-text">{result.general_description}</p>
                </div>
                <div className="field-box">
                  <label>Number of People</label>
                  <p className="value-text">{result.number_of_people}</p>
                </div>
                <div className="field-box">
                  <label>Objects Detected</label>
                  <p className="value-text">{result.objects}</p>
                </div>
              </div>
            ) : (
              <p>{result}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
