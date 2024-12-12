import React, { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import "./ImageArranger.css";
import { useSearchParams } from "react-router-dom";
import Passport from "./Passport";

function ImageArranger() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    console.log(searchParams.get("type"));
  }, [searchParams]);
  return (
    <>
      {searchParams?.get("type") == "passport" ? (
        <Passport />
      ) : searchParams?.get("type") == "project" ? (
        <></>
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
