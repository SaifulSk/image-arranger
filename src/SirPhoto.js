import React, { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import "./ImageArranger.css";
import { useSearchParams } from "react-router-dom";

function SirPhoto() {
  const [images, setImages] = useState([]);
  const [pdf, setPdf] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [copies, setCopies] = useState({});
  const [croppedImages, setCroppedImages] = useState({});
  const [imageSize, setImageSize] = useState("3x4");
  const cropperRefs = useRef({});
  const [searchParams] = useSearchParams();

  const handleImageUpload = (event) => {
    setPdf(null);
    setPdfUrl(null);
    const uploadedImages = Array.from(event.target.files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImages([...images, ...uploadedImages]);
  };

  const handleCopiesChange = (index, value) => {
    setPdf(null);
    setPdfUrl(null);
    setCopies({ ...copies, [index]: Number(value) });
  };

  const handleSizeChange = (e) => {
    setImageSize(e.target.value);
    setPdf(null);
    setPdfUrl(null);
    setCroppedImages({}); // Invalidate cropped images as aspect ratio changed
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
    
    const newCopies = {};
    const newCropped = {};
    let newIdx = 0;
    images.forEach((_, oldIdx) => {
      if (oldIdx !== indexToRemove) {
         if (copies[oldIdx] !== undefined) newCopies[newIdx] = copies[oldIdx];
         if (croppedImages[oldIdx] !== undefined) newCropped[newIdx] = croppedImages[oldIdx];
         newIdx++;
      }
    });
    setCopies(newCopies);
    setCroppedImages(newCropped);
    setPdf(null);
    setPdfUrl(null);
  };

  const handleCropChange = (index) => {
    setPdf(null);
    setPdfUrl(null);
    const cropperInstance = cropperRefs.current[index]?.cropper;
    if (cropperInstance) {
      const canvas = cropperInstance.getCroppedCanvas({
        width: 300 * 2,
        height: 400 * 2,
      });

      if (canvas) {
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedUrl = URL.createObjectURL(blob);
            setCroppedImages((prevState) => ({
              ...prevState,
              [index]: croppedUrl, // Ensure unique key for each image's cropped version
            }));
          }
        });
      }
    }
  };

  const generatePdf = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = imageSize === "3x4" ? 39 : 45;
    const imgHeight = imageSize === "3x4" ? 29 : 35;
    const borderPadding = 0.25; // Padding for border
    let x = 3;
    let y = 3;
    let c = 0;

    images.forEach((image, index) => {
      const copiesCount = copies[index] || 1;
      for (let i = 0; i < copiesCount; i++) {
        c++;
        const imgSrc = croppedImages[index] || image.url;
        // Draw the border
        pdf.setDrawColor(0, 0, 0); // Black border
        pdf.rect(
          x,
          y,
          imgHeight + borderPadding * 2,
          imgWidth + borderPadding * 2
        );
        // Add the image inside the border
        pdf.addImage(
          imgSrc,
          "JPEG",
          x + borderPadding,
          y + borderPadding,
          imgHeight,
          imgWidth
        );
        x += imgHeight + borderPadding * 2 + 3;
        if (x + imgHeight + borderPadding * 2 > pageWidth) {
          x = 3;
          y += imgWidth + borderPadding * 2 + 2;
          if (y + imgWidth + borderPadding * 2 > pageHeight) {
            pdf.addPage();
            x = 3;
            y = 3;
          }
        }
      }
    });
    if (images?.length) {
      setPdf(pdf);

      // Convert the jsPDF object to a Blob
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob); // Create a Blob URL
      setPdfUrl(url); // Save the Blob URL for preview
    } else {
      // toast.error("Please select image");
    }
  };

  const downloadPdf = () => {
    window.open(pdfUrl, "_blank");
    // if (pdf) {
    //   pdf.save("image-arranger.pdf");
    // }
  };

  return (
    <div className="container">
      <h1 className="heading">Portrait Image Arranger</h1>
      
      <div className="sticky-bottom-bar" style={{ width: "100%" }}>
        <div className="controls-row">
          <input
            type="file"
            id="sirphoto-upload"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="fileInput"
          />
          <label htmlFor="sirphoto-upload" className="upload-label">
            <span style={{marginRight: '8px'}}>📸</span> Upload Photos
          </label>
        </div>

        <div className="controls-row">
        <div className="size-selector">
          <label className="label">Image Size:</label>
          <select value={imageSize} onChange={handleSizeChange} className="dropdown">
            <option value="3x4">3x4 cm</option>
            <option value="3.5x4.5">3.5x4.5 cm</option>
          </select>
        </div>

        <div className="desktop-actions action-buttons">
          <button onClick={generatePdf} className="button" disabled={images.length === 0}>
            Generate PDF
          </button>
          {pdf && (
            <button onClick={downloadPdf} className="button btn-preview">
              Preview PDF
            </button>
          )}
        </div>
      </div>
      </div>
      <div className="imagePreviewContainer">
        {images.map((image, index) => (
          <div key={index} className="imageContainer" style={{ position: "relative" }}>
            <button
              onClick={() => handleRemoveImage(index)}
              className="btn-remove"
              title="Remove image"
            >
              &times;
            </button>
            <Cropper
              src={image.url}
              style={{ height: 300, width: "100%" }}
              initialAspectRatio={imageSize === "3x4" ? 29 / 39 : 35 / 45}
              aspectRatio={imageSize === "3x4" ? 29 / 39 : 35 / 45}
              guides={true} // Hide guides
              background={false} // Hide background outside the crop area
              viewMode={1} // Ensure only the image is visible
              crop={() => handleCropChange(index)}
              ref={(ref) => (cropperRefs.current[index] = ref)}
            />
            <div className="copies-div">
              <label htmlFor={`copies-${index}`} className="label">
                Copies:
              </label>
              <input
                type="tel"
                id={`copies-${index}`}
                max={50}
                maxLength={2}
                // defaultValue={3}
                onChange={(e) => handleCopiesChange(index, e.target.value)}
                // placeholder="Enter no of copies"
                className="copies-input"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mobile-actions action-buttons">
        <button onClick={generatePdf} className="button" disabled={images.length === 0}>
          Generate PDF
        </button>
        {pdf && (
          <button onClick={downloadPdf} className="button btn-preview">
            Preview PDF
          </button>
        )}
      </div>
    </div>
  );
}

export default SirPhoto;
