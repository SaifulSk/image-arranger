import React, { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import "./ImageArranger.css";
import { useSearchParams } from "react-router-dom";

function Passport() {
  const [images, setImages] = useState([]);
  const [pdf, setPdf] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [copies, setCopies] = useState({});
  const [croppedImages, setCroppedImages] = useState({});
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
    const imgWidth = 39;
    const imgHeight = 29;
    const borderPadding = 0.25; // Padding for border
    let x = 3;
    let y = 3;
    let c = 0;

    images.forEach((image, index) => {
      const copiesCount = copies[index] || 1;
      for (let i = 0; i < copiesCount; i++) {
        c++;
        const imgSrc = croppedImages[index] || image.url;
        if (c > 40) {
          if (c == 46) {
            c = 0;
          }
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
            // x + imgWidth + borderPadding,
            // y + imgHeight - imgWidth + borderPadding,
            // imgHeight,
            // imgWidth,
            // null,
            // null,
            // 90
          );
          x += imgHeight + borderPadding * 2 + 1.5;
          if (x + imgHeight + borderPadding * 2 > pageWidth) {
            x = 3;
            y += imgWidth + borderPadding * 2 + 1.5;
            if (y + imgWidth + borderPadding * 2 > pageHeight) {
              pdf.addPage();
              x = 3;
              y = 3;
            }
          }
        } else {
          // Draw the border
          pdf.setDrawColor(0, 0, 0); // Black border
          pdf.rect(
            x,
            y,
            imgWidth + borderPadding * 2,
            imgHeight + borderPadding * 2
          );
          // Add the image inside the border
          pdf.addImage(
            imgSrc,
            "JPEG",
            // x + borderPadding,
            // y + borderPadding,
            // imgWidth,
            // imgHeight
            x + imgWidth + borderPadding,
            y + imgHeight - imgWidth + borderPadding,
            imgHeight,
            imgWidth,
            null,
            null,
            90
          );
          x += imgWidth + borderPadding * 2 + 1.5;
          if (x + imgWidth + borderPadding * 2 > pageWidth) {
            x = 3;
            y += imgHeight + borderPadding * 2 + 1.5;
            if (y + imgHeight + borderPadding * 2 > pageHeight) {
              pdf.addPage();
              x = 3;
              y = 3;
            }
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
      <h1 className="heading">Image Arranger</h1>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageUpload}
        className="fileInput"
      />

      <button onClick={generatePdf} className="button">
        Generate PDF
      </button>
      {pdf && (
        <button onClick={downloadPdf} className="button btn-preview">
          Preview PDF
        </button>
      )}

      {/* {pdfUrl && (
        <iframe
          src={pdfUrl}
          width="100%"
          height="600px"
          title="Google PDF Viewer"
        ></iframe>
      )} */}

      <div className="imagePreviewContainer">
        {images.map((image, index) => (
          <div key={index} className="imageContainer">
            <Cropper
              src={image.url}
              style={{ height: 500, width: "100%" }}
              initialAspectRatio={3 / 4}
              aspectRatio={3 / 4}
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
                onChange={(e) => handleCopiesChange(index, e.target.value)}
                // placeholder="Enter no of copies"
                className="copies-input"
              />
            </div>
            {/* <select
              id={`copies-${index}`}
              onChange={(e) => handleCopiesChange(index, e.target.value)}
              className="dropdown"
            >
              {[1, 5, 10, 15, 20, 25, 30, 35, 40, 46].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select> */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Passport;
