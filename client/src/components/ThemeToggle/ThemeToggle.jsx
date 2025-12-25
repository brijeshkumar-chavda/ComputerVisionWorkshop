import React from "react";
import "./ThemeToggle.css";

export const ThemeToggle = ({ darkMode, toggleTheme }) => (
  <button
    className="theme-toggle"
    onClick={toggleTheme}
    aria-label="Toggle Dark Mode"
  >
    {darkMode ? "☀️" : "🌙"}
  </button>
);
