// ===========================
// APP.JS - Core Functions
// ===========================

let lastExtractedText = "";
let lastImageFile = null;

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
// OCR BUTTON HANDLER
// ===========================
async function onExtractTextClick() {
    const fileInput = document.getElementById("imageInput");
    const textarea = document.getElementById("extractedText");
    const progressBar = document.getElementById("progressBar");

    const file = fileInput.files[0];
    if (!file) { showError("Please select an image first."); return; }

    lastImageFile = file;
    textarea.value = "";
    progressBar.style.width = "0%";

    showNotification("Starting OCR...");

    try {
        const text = await runOCR(file);
        lastExtractedText = text;
        textarea.value = text;
        progressBar.style.width = "100%";
        showNotification("OCR completed!");
    } catch (e) {
        showError("OCR execution failed: " + e.message);
    }
}

// ===========================
// THEME & LANGUAGE HANDLERS
// ===========================
function onThemeChange() {
    const theme = document.getElementById("themeSelect").value;
    document.body.className = theme;
    localStorage.setItem("theme", theme);
}

function onLangChange() {
    const lang = document.getElementById("langSelect").value;
    // Reinitialize OCR for new language
    ocrReady = false;
    initOCR(lang);
}

// ===========================
// EVENT BINDING
// ===========================
window.addEventListener("load", () => {
    // Restore theme
    const savedTheme = localStorage.getItem("theme") || "theme-green";
    document.body.className = savedTheme;
    document.getElementById("themeSelect").value = savedTheme;

    // Bind buttons
    document.getElementById("extractBtn").addEventListener("click", onExtractTextClick);
    document.getElementById("themeSelect").addEventListener("change", onThemeChange);
    document.getElementById("langSelect").addEventListener("change", onLangChange);

    // Listen for OCR progress
    window.addEventListener('ocrProgress', e => {
        const progressBar = document.getElementById("progressBar");
        progressBar.style.width = e.detail + "%";
    });
    window.addEventListener('ocrReady', () => showNotification("OCR Ready"));
    window.addEventListener('ocrError', e => showError("OCR Error: " + e.detail));
});
