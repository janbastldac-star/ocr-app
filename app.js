// ===========================
// APP.JS - Core Functions
// ===========================
let lastExtractedText = "";
let lastImageFile = null;
let ocrReady = false;

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
// MODAL
// ===========================
function showModal(title, msg) {
    const modal = document.getElementById("modalContainer");
    const modalTitle = document.getElementById("modalTitle");
    const modalMsg = document.getElementById("modalMessage");
    if (!modal || !modalTitle || !modalMsg) return;
    modalTitle.innerText = title;
    modalMsg.innerText = msg;
    modal.classList.remove("hidden");
}
function closeModal() {
    const modal = document.getElementById("modalContainer");
    if (!modal) return;
    modal.classList.add("hidden");
}

// ===========================
// OCR BUTTON HANDLER
// ===========================
async function onExtractTextClick() {
    const fileInput = document.getElementById("imageInput");
    const textarea = document.getElementById("extractedText");
    const progressBar = document.getElementById("progressBar");
    if (!textarea || !progressBar) return;
    textarea.value = "";
    progressBar.style.width = "0%";

    if (!fileInput || !fileInput.files[0]) {
        showError("Prosím, vyberte obrázek.");
        return;
    }
    const file = fileInput.files[0];
    lastImageFile = file;

    if (!ocrReady) {
        showError("OCR modul není připraven.");
        return;
    }

    try {
        showNotification("Spouštím OCR...");
        const text = await runOCR(file);
        lastExtractedText = text;
        textarea.value = text || "";
        progressBar.style.width = "100%";
        showNotification("OCR dokončeno!");
    } catch (e) {
        console.error(e);
        showError("OCR selhalo: " + e.message);
    }
}

// ===========================
// THEME & LANGUAGE
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
    document.getElementById("extractedText").value = "";
    const savedTheme = localStorage.getItem("theme") || "theme-green";
    document.body.className = savedTheme;
    document.getElementById("themeSelect").value = savedTheme;

    document.getElementById("panelExtractorBtn")?.addEventListener("click", () => showPanel("panelExtractor"));
    document.getElementById("panelQuizBtn")?.addEventListener("click", () => showPanel("panelQuiz"));
    document.getElementById("panelSettingsBtn")?.addEventListener("click", () => showPanel("panelSettings"));

    document.getElementById("extractBtn")?.addEventListener("click", onExtractTextClick);

    document.getElementById("modalCloseBtn")?.addEventListener("click", closeModal);

    document.getElementById("themeSelect")?.addEventListener("change", onThemeChange);
    document.getElementById("langSelect")?.addEventListener("change", onLangChange);
});
