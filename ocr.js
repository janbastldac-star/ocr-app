// ===========================
// OCR.JS - Czech OCR Core
// ===========================

let ocrWorker = null;
let ocrReady = false;

/**
 * Initialize the OCR engine
 */
async function initOCR(lang = "ces") {
    if (ocrReady) return;

    try {
        ocrWorker = await Tesseract.createWorker({
            workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js',
            langPath: './tessdata',
            logger: m => {
                if (m.status === "recognizing text") {
                    const pct = Math.round(m.progress * 100);
                    window.dispatchEvent(new CustomEvent('ocrProgress', {detail: pct}));
                }
            }
        });

        await ocrWorker.load();
        await ocrWorker.loadLanguage(lang);
        await ocrWorker.initialize(lang);

        await ocrWorker.setParameters({
            tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
            tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
            preserve_interword_spaces: "1",
            tessedit_char_whitelist:
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž0123456789.,:;-!?()[]/\\\"'<>@#$%^&*_+=~`|{} ",
            textord_heavy_nr: "1",
            textord_noise_hfract: "0.15",
        });

        ocrReady = true;
        window.dispatchEvent(new CustomEvent('ocrReady'));
    } catch (e) {
        console.error("OCR initialization error:", e);
        window.dispatchEvent(new CustomEvent('ocrError', {detail: e.message}));
    }
}

/**
 * Run OCR on a provided image file
 * @param {File} file - Image file
 * @returns {Promise<string>} - Extracted text
 */
async function runOCR(file) {
    if (!ocrReady) await initOCR();

    try {
        const url = URL.createObjectURL(file);
        const result = await ocrWorker.recognize(url);
        URL.revokeObjectURL(url);

        let text = result.data.text;

        // Preserve numbers at start of line if present
        text = text.split('\n').map(line => {
            line = line.trim();
            if (!line) return "";
            const match = line.match(/^(\d+\.)\s*(.*)$/);
            if (match) line = match[1] + " " + match[2];
            return line;
        }).filter(line => line.length > 0).join('\n');

        return text;
    } catch (e) {
        console.error("OCR failed:", e);
        window.dispatchEvent(new CustomEvent('ocrError', {detail: e.message}));
        return "";
    }
}
