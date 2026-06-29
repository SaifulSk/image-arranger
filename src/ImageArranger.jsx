import React, { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import "./ImageArranger.css";
import { useSearchParams } from "react-router-dom";
import Passport from "./Passport";
import Project from "./Project";
import SirPhoto from "./SirPhoto";

function ImageArranger() {
  const [searchParamsInit] = useSearchParams();
  const [searchParams, setSearchParams] = useState(
    searchParamsInit?.get("type")
  );
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    console.log(searchParams);
  }, [searchParams]);

  return (
    <>
      <div className="theme-toggle">
        <button 
          onClick={toggleTheme} 
          className="button" 
          style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '14px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', boxShadow: 'var(--glass-shadow)' }}
        >
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>
      {searchParams ? (
        <div className="container">
          <div className="nav-buttons">
            <button
              className={`nav-button ${
                searchParams === "passport" ? "active" : ""
              }`}
              onClick={() => setSearchParams("passport")}
            >
              Landscape
            </button>
            <button
              className={`nav-button ${
                searchParams === "sirphoto" ? "active" : ""
              }`}
              onClick={() => setSearchParams("sirphoto")}
            >
              Portrait
            </button>
            <button
              className={`nav-button ${
                searchParams === "project" ? "active" : ""
              }`}
              onClick={() => setSearchParams("project")}
            >
              Project
            </button>
          </div>
          <div className="content-area">
            {searchParams === "passport" ? (
              <Passport />
            ) : searchParams === "project" ? (
              <Project />
            ) : searchParams === "sirphoto" ? (
              <SirPhoto />
            ) : null}
          </div>
        </div>
      ) : (
        <div className="container">
          <h1 className="heading">Image Arranger</h1>
          <div className="controls-row">
            <input
              type="file"
              id="initial-upload"
              multiple
              accept="image/*"
              onChange={() => {}}
              className="fileInput"
            />
            <label htmlFor="initial-upload" className="upload-label">
              <span style={{marginRight: '8px'}}>📸</span> Upload Photos
            </label>
          </div>
          <button className="button">Generate PDF</button>
        </div>
      )}
    </>
  );
}

export default ImageArranger;
