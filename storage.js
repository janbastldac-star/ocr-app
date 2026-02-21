// ===========================
// STORAGE.JS
// ===========================
function saveLastText(text) {
    if (!text) return;
    localStorage.setItem("lastText", text);
}
function loadLastText() {
    return localStorage.getItem("lastText") || "";
}
