import React, { useState } from "react";
import { jsPDF } from "jspdf";
import "./ImageArranger.css"; // Import the CSS file

function Project() {
  const [images, setImages] = useState([]);
  const [pdf, setPdf] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageUpload = (event) => {
    setImages([...images, ...event.target.files]);
    setPdf(null);
    setPdfUrl(null);
  };

  const loadImages = () => {
    return Promise.all(
      images.map((image) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            let width = img.width;
            let height = img.height;
            let imgElement = img;

            const aspectRatio = width / height;
            const isAlmostSquare = aspectRatio >= 0.9 && aspectRatio <= 1.1;

            if (!isAlmostSquare && aspectRatio < 0.9) {
              // Rotate portrait image to landscape
              const canvas = document.createElement("canvas");
              canvas.width = height; // swapped
              canvas.height = width; // swapped
              const ctx = canvas.getContext("2d");
              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate(Math.PI / 2); // 90 degrees clockwise
              ctx.drawImage(img, -width / 2, -height / 2, width, height);

              // Use the rotated image data
              imgElement = canvas.toDataURL("image/jpeg", 0.95);
              width = canvas.width;
              height = canvas.height;
            }

            resolve({
              imageFile: image,
              imgElement: imgElement,
              width: width,
              height: height,
              isSquare: isAlmostSquare,
            });
          };
          img.src = URL.createObjectURL(image);
        });
      })
    );
  };

  const generatePdf = async () => {
    setIsGenerating(true);
    const pdfDoc = new jsPDF("p", "mm", "a4", "", 5);
    const loadedImages = await loadImages();

    // Sort: non-square first, square last. No height sort needed for grid.
    loadedImages.sort((a, b) => {
      if (a.isSquare !== b.isSquare) {
        return a.isSquare ? 1 : -1;
      }
      return 0;
    });

    const PAGE_WIDTH = 210;
    const PAGE_HEIGHT = 297;
    const MARGIN = 3; // Reduced by 2mm
    const GAP = 1;    // 1mm gap between images
    
    // 2 columns, 4 rows
    const COLS = 2;
    const ROWS = 4;
    const BLOCKS_PER_PAGE = COLS * ROWS;
    const BLOCK_WIDTH = (PAGE_WIDTH - 2 * MARGIN - (COLS - 1) * GAP) / COLS;
    const BLOCK_HEIGHT = (PAGE_HEIGHT - 2 * MARGIN - (ROWS - 1) * GAP) / ROWS;

    let currentBlock = 0;

    for (let i = 0; i < loadedImages.length; i++) {
      const item = loadedImages[i];
      
      if (i > 0 && currentBlock === 0) {
        pdfDoc.addPage();
      }

      const col = currentBlock % COLS;
      const row = Math.floor(currentBlock / COLS);

      const blockX = MARGIN + col * (BLOCK_WIDTH + GAP);
      const blockY = MARGIN + row * (BLOCK_HEIGHT + GAP);

      let drawWidth = BLOCK_WIDTH;
      let drawHeight = BLOCK_HEIGHT;
      let drawX = blockX;
      let drawY = blockY;

      if (item.isSquare) {
        drawWidth = 90;
        // Center it horizontally in the block
        drawX = blockX + (BLOCK_WIDTH - drawWidth) / 2;
      }

      pdfDoc.addImage(
        item.imgElement,
        "JPEG",
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );

      currentBlock++;
      if (currentBlock >= BLOCKS_PER_PAGE) {
        currentBlock = 0;
      }
    }

    setPdf(pdfDoc);
    const blob = pdfDoc.output("blob");
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
    setIsGenerating(false);
  };

  const downloadPdf = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  return (
    <div className="container">
      <h1 className="heading">Project Photos Arranger</h1>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageUpload}
        className="fileInput"
      />

      <button
        onClick={generatePdf}
        className="button"
        disabled={isGenerating || images.length === 0}
      >
        {isGenerating ? "Generating..." : "Generate PDF"}
      </button>
      {pdfUrl && (
        <button onClick={downloadPdf} className="button btn-preview">
          Preview PDF
        </button>
      )}
      <div className="imagePreviewContainerProject">
        {images.map((image, index) => (
          <img
            key={index}
            src={URL.createObjectURL(image)}
            alt={`Preview ${index + 1}`}
            className="imagePreviewProject"
          />
        ))}
      </div>
    </div>
  );
}

export default Project;
