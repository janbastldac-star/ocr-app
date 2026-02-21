// ===========================
// PREPARATION.JS - Image Preparation for OCR
// ===========================

/**
 * Prepares the image for OCR:
 * - Resizes large images
 * - Converts to grayscale
 * - Enhances contrast
 * - Optional sharpening
 * - Binarizes for better OCR accuracy
 */
async function prepareImageForOCR(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.getElementById("preprocessCanvas");
            const ctx = canvas.getContext("2d");

            // Resize if too large
            const maxWidth = 2000;
            const scale = Math.min(1, maxWidth / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Get pixel data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Grayscale + Contrast
            for (let i = 0; i < data.length; i += 4) {
                let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                gray = ((gray - 128) * 1.8) + 128; // increase contrast
                gray = Math.min(255, Math.max(0, gray));
                data[i] = data[i + 1] = data[i + 2] = gray;
            }

            ctx.putImageData(imageData, 0, 0);

            // Optional: simple sharpening filter
            const sharpenData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const sData = sharpenData.data;
            const w = canvas.width;
            const h = canvas.height;
            const copy = new Uint8ClampedArray(sData);

            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    const i = (y * w + x) * 4;
                    for (let c = 0; c < 3; c++) {
                        sData[i + c] = Math.min(255, Math.max(0,
                            5 * copy[i + c]
                            - copy[i - 4 + c]
                            - copy[i + 4 + c]
                            - copy[i - w*4 + c]
                            - copy[i + w*4 + c]
                        ));
                    }
                }
            }

            ctx.putImageData(sharpenData, 0, 0);

            // Binarization
            const binData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < binData.data.length; i += 4) {
                const val = binData.data[i] > 128 ? 255 : 0;
                binData.data[i] = binData.data[i + 1] = binData.data[i + 2] = val;
            }
            ctx.putImageData(binData, 0, 0);

            canvas.toBlob(blob => resolve(blob), "image/png");
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// Make globally available
window.prepareImageForOCR = prepareImageForOCR;
