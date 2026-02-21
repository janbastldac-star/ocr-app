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
    if (!container || !text) return;
    text.innerText = msg;
    container.classList.remove("hidden");
    setTimeout(() => container.classList.add("hidden"), timeout);
}

function showError(msg, timeout = 5000) {
    const errorEl = document.getElementById("extractorErrors");
    const msgEl = document.getElementById("extractorErrorMsg");
    if (!errorEl || !msgEl) return;
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

    if (!textarea || !progressBar) return;

    textarea.value = "";          // clear on button click
    progressBar.style.width = "0%";

    if (!fileInput || !fileInput.files[0]) {
        showError("Prosím, vyberte obrázek.");
        return;
    }

    const file = fileInput.files[0];
    lastImageFile = file;

    if (typeof runOCR !== "function") {
        showError("OCR modul není načten. Ujistěte se, že ocr.js je zahrnut a načten před app.js.");
        return;
    }

    showNotification("Spouštím OCR...");
    try {
        const text = await runOCR(file);
        lastExtractedText = text;
        textarea.value = text || "";
        if (!text || text.trim().length === 0) showError("OCR vrátil prázdný text.");
        else showNotification("OCR dokončeno!");
        progressBar.style.width = "100%";
    } catch (e) {
        console.error("OCR selhalo:", e);
        showError("OCR selhalo: " + e.message);
    }
}

// ===========================
// THEME & LANGUAGE HANDLERS
// ===========================
function onThemeChange() {
    const themeSelect = document.getElementById("themeSelect");
    if (!themeSelect) return;
    const theme = themeSelect.value;
    document.body.className = theme;
    localStorage.setItem("theme", theme);
}

function onLangChange() {
    const langSelect = document.getElementById("langSelect");
    const lang = langSelect?.value || "ces";
    if (typeof initOCR === "function") {
        ocrReady = false;
        initOCR(lang);
    }
}

// ===========================
// WINDOW LOAD
// ===========================
window.addEventListener("DOMContentLoaded", () => {
    // Clear textarea on load
    const textarea = document.getElementById("extractedText");
    if (textarea) textarea.value = "";

    // Restore saved theme
    const savedTheme = localStorage.getItem("theme") || "theme-green";
    document.body.className = savedTheme;
    const themeSelectEl = document.getElementById("themeSelect");
    if (themeSelectEl) themeSelectEl.value = savedTheme;

    // Bind buttons
    const extractBtn = document.getElementById("extractBtn");
    if (extractBtn) extractBtn.addEventListener("click", onExtractTextClick);

    themeSelectEl?.addEventListener("change", onThemeChange);
    document.getElementById("langSelect")?.addEventListener("change", onLangChange);
});
