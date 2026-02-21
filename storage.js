// ===========================
// STORAGE.JS - Save Last Text/Image
// ===========================
function saveLastText(text) {
    if (!text) return;
    localStorage.setItem("lastExtractedText", text);
}
function loadLastText() {
    return localStorage.getItem("lastExtractedText") || "";
}

function saveLastImage(blob) {
    if (!blob) return;
    const reader = new FileReader();
    reader.onload = function() {
        localStorage.setItem("lastImageData", reader.result);
    };
    reader.readAsDataURL(blob);
}
function loadLastImage() {
    const data = localStorage.getItem("lastImageData");
    return data || null;
}
