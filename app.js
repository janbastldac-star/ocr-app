// ===========================
// APP.JS - Core Functions (Debugged)
// ===========================

let lastExtractedText = "";
let lastImageFile = null;

// ===========================
// PANEL SWITCHING
// ===========================
function showPanel(id) {
    const panels = document.querySelectorAll(".panel");
    if (!panels) console.warn("No panels found");
    panels.forEach(p => p.classList.add("hidden"));
    const panel = document.getElementById(id);
    if (panel) panel.classList.remove("hidden");
    else console.warn(`Panel with ID "${id}" not found`);
}

// ===========================
// NOTIFICATIONS
// ===========================
function showNotification(msg, timeout = 3000) {
    const container = document.getElementById("notificationContainer");
    const text = document.getElementById("notificationText");
    if (!container || !text) { console.warn("Notification elements missing"); return; }
    text.innerText = msg;
    container.classList.remove("hidden");
    setTimeout(() => container.classList.add("hidden"), timeout);
}

function showError(msg, timeout = 5000) {
    const errorEl = document.getElementById("extractorErrors");
    const msgEl = document.getElementById("extractorErrorMsg");
    if (!errorEl || !msgEl) { console.error("Error container missing"); alert(msg); return; }
    msgEl.innerText = msg;
    errorEl.classList.remove("hidden");
    setTimeout(() => errorEl.classList.add("hidden"), timeout);
}

// ===========================
// OCR BUTTON HANDLER
// ===========================
async function onExtractTextClick() {
    const fileInput = document.getElementById("imageInput");
    const textarea = document.getElementById("extractedText");
    const progressBar = document.getElementById("progressBar");

    if (!fileInput) { showError("File input element not found"); return; }
    if (!textarea) { showError("Textarea element not found"); return; }
    if (!progressBar) { showError("Progress bar element not found"); return; }

    const file = fileInput.files[0];
    if (!file) { showError("Please select an image first."); return; }

    lastImageFile = file;
    textarea.value = "";
    progressBar.style.width = "0%";

    showNotification("Starting OCR...");

    if (typeof runOCR !== "function") {
        showError("OCR module not loaded. Make sure ocr.js is included.");
        return;
    }

    try {
        console.log("Running OCR...");
        const text = await runOCR(file);
        console.log("OCR finished:", text);

        if (!text || text.trim().length === 0) showError("OCR returned empty text.");
        lastExtractedText = text;
        textarea.value = text;

        progressBar.style.width = "100%";
        showNotification("OCR completed!");
    } catch (e) {
        console.error("OCR execution failed:", e);
        showError("OCR execution failed: " + e.message);
    }
}

// ===========================
// THEME & LANGUAGE
// ===========================
function onThemeChange() {
    const theme = document.getElementById("themeSelect")?.value;
    if (!theme) { console.warn("Theme select element not found"); return; }
    document.body.className = theme;
    localStorage.setItem("theme", theme);
}

function onLangChange() {
    const lang = document.getElementById("langSelect")?.value || "ces";
    ocrReady = false;
    if (typeof initOCR === "function") {
        initOCR(lang);
    } else {
        console.warn("initOCR function not found");
    }
}

// ===========================
// EVENT BINDING
// ===========================
window.addEventListener("load", () => {
    console.log("App loaded");

    const savedTheme = localStorage.getItem("theme") || "theme-green";
    document.body.className = savedTheme;
    const themeSelectEl = document.getElementById("themeSelect");
    if (themeSelectEl) themeSelectEl.value = savedTheme;

    const extractBtn = document.getElementById("extractBtn");
    if (extractBtn) extractBtn.addEventListener("click", onExtractTextClick);
    else console.warn("Extract button not found");

    themeSelectEl?.addEventListener("change", onThemeChange);
    document.getElementById("langSelect")?.addEventListener("change", onLangChange);

    // OCR Progress
    window.addEventListener('ocrProgress', e => {
        const progressBar = document.getElementById("progressBar");
        if (progressBar) progressBar.style.width = e.detail + "%";
    });
    window.addEventListener('ocrReady', () => showNotification("OCR Ready"));
    window.addEventListener('ocrError', e => showError("OCR Error: " + e.detail));
});
