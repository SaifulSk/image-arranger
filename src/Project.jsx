import React, { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import "./ImageArranger.css"; // Import the CSS file

function Project() {
  const [images, setImages] = useState([]);
  const [pdf, setPdf] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [croppedImages, setCroppedImages] = useState({});
  const [activeCropIndices, setActiveCropIndices] = useState({});
  const cropperRefs = useRef({});

  const handleImageUpload = (event) => {
    const uploadedImages = Array.from(event.target.files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImages([...images, ...uploadedImages]);
    setPdf(null);
    setPdfUrl(null);
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
    
    const newCropped = {};
    const newActive = {};
    let newIdx = 0;
    images.forEach((_, oldIdx) => {
      if (oldIdx !== indexToRemove) {
         if (croppedImages[oldIdx] !== undefined) newCropped[newIdx] = croppedImages[oldIdx];
         if (activeCropIndices[oldIdx] !== undefined) newActive[newIdx] = activeCropIndices[oldIdx];
         newIdx++;
      }
    });
    setCroppedImages(newCropped);
    setActiveCropIndices(newActive);
    setPdf(null);
    setPdfUrl(null);
  };

  const toggleCropMode = (index) => {
    if (activeCropIndices[index]) {
      // We are closing the cropper. Get the final crop image.
      const cropperInstance = cropperRefs.current[index]?.cropper;
      if (cropperInstance) {
        const canvas = cropperInstance.getCroppedCanvas();
        if (canvas) {
          canvas.toBlob((blob) => {
            if (blob) {
              const croppedUrl = URL.createObjectURL(blob);
              setCroppedImages((prevState) => {
                // Free previous blob URL memory to prevent memory leak
                if (prevState[index]) URL.revokeObjectURL(prevState[index]);
                return { ...prevState, [index]: croppedUrl };
              });
            }
          }, "image/jpeg", 0.95);
        }
      }
    }

    setActiveCropIndices((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const confirmAllCrops = () => {
    const activeIndices = Object.keys(activeCropIndices).filter(index => activeCropIndices[index]);
    
    if (activeIndices.length === 0) return;

    activeIndices.forEach(index => {
      const cropperInstance = cropperRefs.current[index]?.cropper;
      if (cropperInstance) {
        const canvas = cropperInstance.getCroppedCanvas();
        if (canvas) {
          canvas.toBlob((blob) => {
            if (blob) {
              const croppedUrl = URL.createObjectURL(blob);
              setCroppedImages((prevState) => {
                if (prevState[index]) URL.revokeObjectURL(prevState[index]);
                return { ...prevState, [index]: croppedUrl };
              });
            }
          }, "image/jpeg", 0.95);
        }
      }
    });

    // Close all croppers
    setActiveCropIndices({});
  };

  const loadImages = () => {
    return Promise.all(
      images.map((image, index) => {
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
              imageFile: image.file,
              imgElement: imgElement,
              width: width,
              height: height,
              isSquare: isAlmostSquare,
            });
          };
          img.src = croppedImages[index] || image.url;
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
      
      <div className="controls-row">
        <input
          type="file"
          id="project-upload"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="fileInput"
        />
        <label htmlFor="project-upload" className="upload-label">
          <span style={{marginRight: '8px'}}>📸</span> Upload Photos
        </label>
        
        {Object.values(activeCropIndices).some(Boolean) && (
          <button onClick={confirmAllCrops} className="button btn-confirm-crops" title="Apply crop to all open images">
            ✔️ Confirm All Crops
          </button>
        )}
      </div>

      <div className="controls-row desktop-actions action-buttons">
        <button onClick={generatePdf} className="button" disabled={isGenerating || images.length === 0}>
          {isGenerating ? "Generating..." : "Generate PDF"}
        </button>
        {pdf && (
          <button onClick={downloadPdf} className="button btn-preview">
            Preview PDF
          </button>
        )}
      </div>

      <div className="imagePreviewContainerProject">
        {images.map((image, index) => (
          <div key={index} className="imageContainer" style={{ position: "relative" }}>
            <button
              onClick={() => handleRemoveImage(index)}
              className="btn-remove"
              title="Remove image"
            >
              &times;
            </button>
            <button
              onClick={() => toggleCropMode(index)}
              className="btn-crop"
              title={activeCropIndices[index] ? "Done cropping" : "Crop image"}
            >
              {activeCropIndices[index] ? "✔️" : "✂️"}
            </button>
            {activeCropIndices[index] ? (
              <Cropper
                src={image.url}
                style={{ height: 300, width: "100%" }}
                aspectRatio={NaN} // Freesize crop
                autoCropArea={1}
                guides={true}
                background={false}
                viewMode={1}
                ref={(ref) => (cropperRefs.current[index] = ref)}
              />
            ) : (
              <img
                src={croppedImages[index] || image.url}
                alt={`Preview ${index + 1}`}
                className="imagePreviewProject"
                style={{ margin: 0, height: 300, width: "100%", objectFit: "contain" }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mobile-actions action-buttons">
        <button onClick={generatePdf} className="button" disabled={isGenerating || images.length === 0}>
          {isGenerating ? "Generating..." : "Generate PDF"}
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

export default Project;
