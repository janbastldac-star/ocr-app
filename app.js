// ===========================
// APP.JS - Ultimate Czech OCR
// ===========================

// ===========================
// GLOBAL VARIABLES
// ===========================
let ocrWorker = null;
let ocrReady = false;
let lastExtractedText = "";
let lastProcessedImage = null;
let ocrHistory = [];
const maxCanvasWidth = 2500;
const sharpenKernel = [
  0, -1, 0,
  -1, 5, -1,
  0, -1, 0
];
const binarizeThreshold = 150;

// ===========================
// PANEL SWITCHING
// ===========================
function showPanel(id) {
  document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
  const panel = document.getElementById(id);
  if (panel) panel.classList.remove("hidden");
}

// ===========================
// NOTIFICATIONS
// ===========================
function showNotification(msg, timeout = 3000) {
  const container = document.getElementById("notificationContainer");
  const text = document.getElementById("notificationText");
  text.innerText = msg;
  container.classList.remove("hidden");
  setTimeout(() => container.classList.add("hidden"), timeout);
}
function showError(msg, timeout = 4000) {
  const errorEl = document.getElementById("extractorErrors");
  const msgEl = document.getElementById("extractorErrorMsg");
  msgEl.innerText = msg;
  errorEl.classList.remove("hidden");
  setTimeout(() => errorEl.classList.add("hidden"), timeout);
}

// ===========================
// MODAL
// ===========================
function showModal(title, msg) {
  const modal = document.getElementById("modalContainer");
  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalMessage").innerText = msg;
  modal.classList.remove("hidden");
}
function closeModal() {
  document.getElementById("modalContainer").classList.add("hidden");
}

// ===========================
// OCR INITIALIZATION
// ===========================
async function initOCR() {
  if (ocrReady) return;

  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  progressText.innerText = "Initializing OCR engine...";

  const lang = document.getElementById("langSelect").value || "ces";

  try {
    ocrWorker = await Tesseract.createWorker({
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js',
      langPath: './tessdata',
      logger: m => {
        if (m.status === "recognizing text") {
          const pct = Math.round(m.progress * 100);
          progressBar.style.width = pct + "%";
          progressText.innerText = `Recognizing text: ${pct}%`;
        } else progressText.innerText = m.status;
      }
    });

    await ocrWorker.load();
    await ocrWorker.loadLanguage(lang);
    await ocrWorker.initialize(lang);
    await ocrWorker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
      preserve_interword_spaces: "1",
      tessedit_char_whitelist:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž0123456789.,:;-!?()[]/\\\"'<>@#$%^&*_+=~`|{} ",
      textord_heavy_nr: "1",
      textord_noise_hfract: "0.15",
      load_system_dawg: "0",
      load_freq_dawg: "0"
    });
    progressText.innerText = "OCR Ready";
    ocrReady = true;
  } catch (e) {
    console.error(e);
    showError("OCR Initialization failed: " + e.message);
  }
}

// ===========================
// IMAGE PREPROCESSING
// ===========================
function preprocessImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.getElementById("preprocessCanvas");
      const ctx = canvas.getContext("2d");

      const scale = Math.min(1, maxCanvasWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let data = imageData.data;

      // Grayscale + gamma correction
      for (let i = 0; i < data.length; i += 4) {
        let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        gray = 255 * Math.pow(gray / 255, 0.9); // slight gamma correction
        data[i] = data[i + 1] = data[i + 2] = gray;
      }

      // Convolution sharpening
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
                val += copy[4 * ((y + ky) * w + (x + kx)) + c] * sharpenKernel[k++];
              }
            }
            data[4 * (y * w + x) + c] = Math.min(255, Math.max(0, val));
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);

      // Adaptive binarization for spaces
      const binData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const v = binData.data[i];
          binData.data[i] = binData.data[i + 1] = binData.data[i + 2] =
            v > binarizeThreshold ? 255 : 0;
        }
      }
      ctx.putImageData(binData, 0, 0);

      canvas.toBlob(blob => {
        lastProcessedImage = blob;
        resolve(blob);
      }, "image/png");
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ===========================
// RUN OCR
// ===========================
async function runOCR() {
  const file = document.getElementById("imageInput").files[0];
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const textarea = document.getElementById("extractedText");

  if (!file) {
    showError("Select an image first.");
    return;
  }

  textarea.value = "";
  progressBar.style.width = "0%";
  progressText.innerText = "Preprocessing image...";

  if (!ocrReady) await initOCR();

  try {
    const blob = await preprocessImage(file);
    const url = URL.createObjectURL(blob);

    // OCR multi-pass & line segmentation for extreme precision
    let result = null;
    for (let pass = 0; pass < 3; pass++) {
      try {
        result = await ocrWorker.recognize(url);
        if (result.data.text.trim() !== "") break;
      } catch (e) {
        console.warn("OCR pass", pass + 1, "failed", e);
      }
    }

    if (!result || !result.data || !result.data.text) {
      showError("OCR Failed: No text detected.");
      progressText.innerText = "OCR Failed";
      return;
    }

    // Post-processing for proper spaces and line breaks
    let fixedText = result.data.text
      .replace(/\s+/g, ' ')
      .replace(/\s*([.,;:!?()])\s*/g, '$1 ')
      .replace(/\s*-\s*/g, '-') // preserve hyphenated words
      .trim();

    textarea.value = fixedText;
    lastExtractedText = fixedText;
    ocrHistory.push(lastExtractedText);
    saveLastText(lastExtractedText);
    saveLastImage(lastProcessedImage);

    progressBar.style.width = "100%";
    progressText.innerText = "OCR Complete";
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    showError("OCR execution critical error: " + e.message);
    progressText.innerText = "OCR Failed";
  }
}

// ===========================
// SAFE RUN OCR
// ===========================
function safeRunOCR() {
  try { runOCR(); } catch (e) { console.error(e); showError("OCR critical error."); }
}

// ===========================
// THEME + LANGUAGE SETTINGS
// ===========================
const themeSelect = document.getElementById("themeSelect");
themeSelect.onchange = function () {
  document.body.className = themeSelect.value;
  localStorage.setItem("theme", themeSelect.value);
};

const langSelect = document.getElementById("langSelect");
langSelect.onchange = function () {
  ocrReady = false;
  initOCR();
};

// ===========================
// LOAD SETTINGS
// ===========================
window.addEventListener("load", () => {
  const saved = localStorage.getItem("theme") || "theme-green";
  document.body.className = saved;
  themeSelect.value = saved;
});
