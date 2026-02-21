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
// MODAL HANDLING
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
// OCR HANDLER PLACEHOLDER
// ===========================
async function onExtractTextClick() {
    const fileInput = document.getElementById("imageInput");
    const textarea = document.getElementById("extractedText");
    const progressBar = document.getElementById("progressBar");

    if (!textarea || !progressBar) return;

    textarea.value = ""; // clear on click
    progressBar.style.width = "0%";

    if (!fileInput || !fileInput.files[0]) {
        showError("Prosím, vyberte obrázek.");
        return;
    }

    const file = fileInput.files[0];
    lastImageFile = file;

    // Placeholder: real OCR function to be added later
    showNotification("OCR would run here...");
    setTimeout(() => {
        textarea.value = "Tady se zobrazí text po extrakci (OCR).";
        progressBar.style.width = "100%";
    }, 1000);
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
    // Placeholder: reload OCR language when OCR added
    showNotification("Language switched to " + lang);
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

    // Bind sidebar buttons
    document.getElementById("panelExtractorBtn")?.addEventListener("click", () => showPanel("panelExtractor"));
    document.getElementById("panelQuizBtn")?.addEventListener("click", () => showPanel("panelQuiz"));
    document.getElementById("panelSettingsBtn")?.addEventListener("click", () => showPanel("panelSettings"));

    // Bind extract button
    document.getElementById("extractBtn")?.addEventListener("click", onExtractTextClick);

    // Bind modal close button
    document.getElementById("modalCloseBtn")?.addEventListener("click", closeModal);

    // Bind theme and language
    themeSelectEl?.addEventListener("change", onThemeChange);
    document.getElementById("langSelect")?.addEventListener("change", onLangChange);
});
