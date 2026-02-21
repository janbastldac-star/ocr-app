// ===========================
// OCR.JS
// ===========================
let ocrWorker = null;
let ocrReady = false;

async function initOCR(lang = "ces") {
    if (ocrReady) return;
    ocrWorker = await Tesseract.createWorker({
        logger: m => {
            const bar = document.getElementById("progressBar");
            const notification = document.getElementById("notification");
            if (!bar || !notification) return;
            if (m.status === "recognizing text") {
                const pct = Math.round(m.progress * 100);
                bar.style.width = pct + "%";
                notification.innerText = `Recognizing text: ${pct}%`;
            } else {
                notification.innerText = m.status;
            }
        }
    });
    await ocrWorker.load();
    await ocrWorker.loadLanguage(lang);
    await ocrWorker.initialize(lang);
    ocrReady = true;
}

async function runOCR(file) {
    if (!ocrWorker) throw new Error("OCR worker not initialized.");
    const url = URL.createObjectURL(file);
    const result = await ocrWorker.recognize(url);
    URL.revokeObjectURL(url);
    return result.data.text || "";
}
