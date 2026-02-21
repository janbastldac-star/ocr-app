// ===========================
// APP.JS - Core
// ===========================
let lastText = "";
let ocrReady = false;

// ---------------------------
// PANEL SWITCHING
// ---------------------------
function showPanel(id) {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
    document.getElementById(id)?.classList.remove("hidden");
}

// ---------------------------
// NOTIFICATIONS
// ---------------------------
function notify(msg, duration = 3000) {
    const el = document.getElementById("notification");
    if (!el) return;
    el.innerText = msg;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), duration);
}

// ---------------------------
// ERROR DISPLAY
// ---------------------------
function showError(msg) {
    const el = document.getElementById("extractorError");
    if (!el) return;
    el.innerText = msg;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 4000);
}

// ---------------------------
// THEME & LANGUAGE
// ---------------------------
function applyTheme(theme) {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
}

function onThemeChange() {
    const sel = document.getElementById("themeSelect");
    if (!sel) return;
    applyTheme(sel.value);
}

function onLangChange() {
    const sel = document.getElementById("langSelect");
    if (!sel) return;
    if (typeof initOCR === "function") {
        ocrReady = false;
        initOCR(sel.value);
    }
}

// ---------------------------
// INITIALIZATION
// ---------------------------
window.addEventListener("DOMContentLoaded", () => {
    // Load theme
    const savedTheme = localStorage.getItem("theme") || "theme-green";
    applyTheme(savedTheme);
    document.getElementById("themeSelect").value = savedTheme;

    // Bind panel buttons
    document.getElementById("extractorBtn")?.addEventListener("click", () => showPanel("panelExtractor"));
    document.getElementById("quizBtn")?.addEventListener("click", () => showPanel("panelQuiz"));
    document.getElementById("settingsBtn")?.addEventListener("click", () => showPanel("panelSettings"));

    // Bind theme/lang selectors
    document.getElementById("themeSelect")?.addEventListener("change", onThemeChange);
    document.getElementById("langSelect")?.addEventListener("change", onLangChange);

    // Bind OCR button
    document.getElementById("runOCRBtn")?.addEventListener("click", async () => {
        const file = document.getElementById("imageInput").files[0];
        if (!file) { showError("Please select an image."); return; }
        if (!ocrReady) { showError("OCR not ready."); return; }
        try {
            const text = await runOCR(file);
            lastText = text;
            document.getElementById("extractedText").value = text;
            notify("Text extraction complete!");
            saveLastText(text);
        } catch (e) {
            console.error(e);
            showError("OCR failed.");
        }
    });
});
