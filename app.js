// ===========================
// APP.JS - OCR & UI Management
// ===========================

let ocrWorker = null;
let ocrReady = false;
let lastExtractedText = "";
let lastProcessedImage = null;

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
  progressText.innerText = "Initializing OCR...";

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
// RUN OCR
// ===========================
async function runOCR() {
  const file = document.getElementById("imageInput").files[0];
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const textarea = document.getElementById("extractedText");

  if (!file) { showError("Select an image first."); return; }

  textarea.value = "";
  progressBar.style.width = "0%";
  progressText.innerText = "Preparing image...";

  if (!ocrReady) await initOCR();

  try {
    // Use preparation.js to preprocess the image
    const preparedBlob = await window.prepareImageForOCR(file);
    lastProcessedImage = preparedBlob;

    progressText.innerText = "Running OCR...";

    const url = URL.createObjectURL(preparedBlob);
    const result = await ocrWorker.recognize(url);

    // Post-processing: normalize spaces, punctuation, and line breaks
    let fixedText = result.data.text
      .replace(/\s+/g, ' ')
      .replace(/\s*([.,;:!?()])\s*/g, '$1 ')
      .replace(/\s*-\s*/g, '-') 
      .trim();

    textarea.value = fixedText;
    lastExtractedText = fixedText;

    // Save for history
    saveLastText(lastExtractedText);
    saveLastImage(lastProcessedImage);

    progressBar.style.width = "100%";
    progressText.innerText = "OCR Complete";
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    showError("OCR Failed: " + e.message);
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
