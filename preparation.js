// ===========================
// PREPARATION.JS - Advanced OCR Image Preparation
// ===========================

const prepConfig = {
  maxWidth: 2500,
  gamma: 0.9,
  binarizeThreshold: 150,
  sharpenKernel: [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ]
};

// ===========================
// Prepare Image for OCR
// ===========================
async function prepareImageForOCR(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const scale = Math.min(1, prepConfig.maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let data = imageData.data;

      // Grayscale + gamma correction
      for (let i = 0; i < data.length; i += 4) {
        let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        gray = 255 * Math.pow(gray / 255, prepConfig.gamma);
        data[i] = data[i + 1] = data[i + 2] = gray;
      }

      // Sharpen filter convolution
      const copy = new Uint8ClampedArray(data);
      const w = canvas.width;
      const h = canvas.height;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          for (let c = 0; c < 3; c++) {
            let val = 0;
            let k = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                val += copy[4 * ((y + ky) * w + (x + kx)) + c] * prepConfig.sharpenKernel[k++];
              }
            }
            data[4 * (y * w + x) + c] = Math.min(255, Math.max(0, val));
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);

      // Adaptive binarization
      const binData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const v = binData.data[i];
          binData.data[i] = binData.data[i + 1] = binData.data[i + 2] =
            v > prepConfig.binarizeThreshold ? 255 : 0;
        }
      }
      ctx.putImageData(binData, 0, 0);

      canvas.toBlob(blob => resolve(blob), "image/png");
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// Optional: download prepared image for verification
function downloadPreparedImage(blob, filename = "prepared.png") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Export globally for app.js
window.prepareImageForOCR = prepareImageForOCR;
window.downloadPreparedImage = downloadPreparedImage;
