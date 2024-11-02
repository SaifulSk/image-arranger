import React, { useState } from "react";
import { jsPDF } from "jspdf";
import "./ImageArranger.css"; // Import the CSS file

function ImageArranger() {
  const [images, setImages] = useState([]);
  const [pdf, setPdf] = useState(null);

  const handleImageUpload = (event) => {
    setImages([...images, ...event.target.files]);
  };

  const getImageOrientation = (img) => {
    return new Promise((resolve) => {
      img.onload = () => {
        if (img.width < img.height) {
          resolve("portrait");
        } else {
          resolve("landscape");
        }
      };
    });
  };

  const generatePdf = async () => {
    const pdf = new jsPDF("p", "mm", "a4", "", 5);
    const imageWidth = 104;
    const imageHeight = 58.5;
    let x = 0;
    let y = 0;
    let row = 0;
    let col = 0;
    let sqImages = [];
    for (const image of images) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(image);
      const orientation = await getImageOrientation(img);

      const aspectRatio = img.width / img.height;
      const isAlmostSquare = aspectRatio > 0.9 && aspectRatio < 1.1;

      if (isAlmostSquare) {
        sqImages.push(image);
      } else {
        if (orientation === "portrait") {
          pdf.addImage(
            img,
            "JPEG",
            x + imageWidth,
            y + imageHeight - imageWidth,
            imageHeight,
            imageWidth,
            null,
            null,
            90
          );
        } else {
          pdf.addImage(img, "JPEG", x, y, imageWidth, imageHeight);
        }
        col++;
        x += imageWidth + 1;
        if (col === 2) {
          x = 0;
          y += imageHeight + 1;
          row++;
          col = 0;
        }
      }

      if (row === 5) {
        pdf.addPage();
        x = 0;
        y = 0;
        row = 0;
      }
    }
    if (col === 1) {
      x = 0;
      y += imageHeight + 1;
      col = 0;
    }
    const sqWidth = 69;
    for (const image of sqImages) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(image);

      pdf.addImage(img, "JPEG", x, y, sqWidth, imageHeight);
      col++;
      x += sqWidth + 1;
      if (col === 3) {
        x = 0;
        y += imageHeight + 1;
        row++;
        col = 0;
      }
      console.log({ y });
      if (row === 5) {
        pdf.addPage();
        x = 0;
        y = 0;
        row = 0;
      }
    }

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
          <img
            key={index}
            src={URL.createObjectURL(image)}
            alt={`Image ${index + 1}`}
            className="imagePreview"
          />
        ))}
      </div>
    </div>
  );
}

export default ImageArranger;
