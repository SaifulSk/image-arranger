import React, { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import "./ImageArranger.css";

function ImageArranger() {
  const [images, setImages] = useState([]);
  const [pdf, setPdf] = useState(null);
  const [copies, setCopies] = useState({});
  const [croppedImages, setCroppedImages] = useState({});
  const cropperRefs = useRef({});

  const handleImageUpload = (event) => {
    const uploadedImages = Array.from(event.target.files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImages([...images, ...uploadedImages]);
  };

  const handleCopiesChange = (index, value) => {
    setCopies({ ...copies, [index]: Number(value) });
  };

  const handleCropChange = (index) => {
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

    setPdf(pdf);
  };

  const downloadPdf = () => {
    if (pdf) {
      pdf.save("image-arranger.pdf");
    }
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
        <button onClick={downloadPdf} className="button">
          Download PDF
        </button>
      )}

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
            <label htmlFor={`copies-${index}`} className="label">
              Copies:
            </label>
            <select
              id={`copies-${index}`}
              onChange={(e) => handleCopiesChange(index, e.target.value)}
              className="dropdown"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n * 5} value={n * 5}>
                  {n * 5}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageArranger;
