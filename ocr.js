// ===========================
// OCR.JS - Image Extraction
// ===========================
let ocrWorker = null;
let ocrReady = false;

async function initOCR(lang="ces") {
    if (ocrReady) return;
    try {
        ocrWorker = await Tesseract.createWorker({
            logger: m => {
                const progressBar = document.getElementById("progressBar");
                const progressText = document.getElementById("notificationText");
                if (!progressBar || !progressText) return;
                if (m.status === "recognizing text") {
                    const pct = Math.round(m.progress * 100);
                    progressBar.style.width = pct + "%";
                    progressText.innerText = `Rozpoznávání textu: ${pct}%`;
                } else {
                    progressText.innerText = m.status;
                }
            }
        });
        await ocrWorker.load();
        await ocrWorker.loadLanguage(lang);
        await ocrWorker.initialize(lang);
        ocrReady = true;
    } catch (e) {
        console.error(e);
        const progressText = document.getElementById("notificationText");
        if (progressText) progressText.innerText = "OCR inicializace selhala";
    }
}

async function runOCR(file) {
    if (!ocrWorker) throw new Error("OCR není připraven");
    const imgUrl = URL.createObjectURL(file);
    const result = await ocrWorker.recognize(imgUrl);
    URL.revokeObjectURL(imgUrl);
    return result.data.text || "";
}
