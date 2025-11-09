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

  useEffect(() => {
    console.log(searchParams);
  }, [searchParams]);
  return (
    <>
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
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={() => {}}
            className="fileInput"
          />

          <button className="button">Generate PDF</button>
        </div>
      )}
    </>
  );
}

export default ImageArranger;
