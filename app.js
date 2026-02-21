// ======================
// PANEL SWITCHING
// ======================
function showPanel(id){
    document.querySelectorAll(".panel").forEach(p=>p.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

// ======================
// OCR WORKER
// ======================
let ocrWorker = null;
let ocrReady = false;
let currentLang = "ces";

async function initOCR(lang = "ces"){
    if(ocrReady && currentLang === lang) return;

    currentLang = lang;
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");

    progressText.innerText = "Loading OCR engine...";
    progressBar.style.width = "0%";

    if(ocrWorker) await ocrWorker.terminate();
    ocrWorker = await Tesseract.createWorker(lang, 1, {
        langPath: "./tessdata",
        logger: m => {
            if(m.status === "recognizing text"){
                const percent = Math.round(m.progress * 100);
                progressBar.style.width = percent + "%";
                progressText.innerText = `Recognizing text: ${percent}%`;
            } else if(m.status !== "initialized"){
                progressText.innerText = m.status;
            }
        }
    });

    await ocrWorker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        preserve_interword_spaces: "1",
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž",
        textord_heavy_nr: "1",
        textord_noise_hfract: "0.3"
    });

    progressText.innerText = "OCR Ready";
    progressBar.style.width = "100%";
    ocrReady = true;
}

// ======================
// IMAGE PREPROCESSING
// ======================
async function preprocessImage(file){
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.getElementById("preprocessCanvas");
            const ctx = canvas.getContext("2d");

            // Resize large images proportionally
            const maxWidth = 2000;
            const scale = Math.min(1, maxWidth / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let data = imageData.data;

            // Convert to grayscale and enhance contrast
            for(let i=0; i<data.length; i+=4){
                let gray = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
                gray = ((gray - 128) * 2) + 128; // contrast boost
                gray = Math.min(255, Math.max(0, gray));
                data[i] = data[i+1] = data[i+2] = gray;
            }
            ctx.putImageData(imageData,0,0);

            // Optional: adaptive threshold / binarization
            const binData = ctx.getImageData(0,0,canvas.width,canvas.height);
            for(let i=0;i<binData.data.length;i+=4){
                const val = binData.data[i] > 128 ? 255 : 0;
                binData.data[i] = binData.data[i+1] = binData.data[i+2] = val;
            }
            ctx.putImageData(binData,0,0);

            canvas.toBlob(blob => resolve(blob), "image/png");
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// ======================
// RUN OCR
// ======================
async function runOCR(){
    const file = document.getElementById("imageInput").files[0];
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    const textarea = document.getElementById("extractedText");

    if(!file){ alert("Select an image first."); return; }
    textarea.value = "";
    progressBar.style.width = "0%";
    progressText.innerText = "Preprocessing image...";

    const lang = document.getElementById("langSelect").value || "ces";
    await initOCR(lang);

    try{
        const blob = await preprocessImage(file);
        const url = URL.createObjectURL(blob);

        const result = await ocrWorker.recognize(url);
        textarea.value = result.data.text;

        progressBar.style.width = "100%";
        progressText.innerText = "OCR Complete";

        URL.revokeObjectURL(url);
    }catch(err){
        console.error(err);
        progressText.innerText = "OCR Failed";
    }
}

// ======================
// THEME + LANGUAGE SETTINGS
// ======================
const themeSelect = document.getElementById("themeSelect");
themeSelect.onchange = function(){
    document.body.className = themeSelect.value;
    localStorage.setItem("theme", themeSelect.value);
};

const langSelect = document.getElementById("langSelect");
langSelect.onchange = function(){
    ocrReady = false; // reset OCR worker for new language
};

// ======================
// LOAD SETTINGS ON START
// ======================
window.addEventListener("load", ()=>{
    const saved = localStorage.getItem("theme") || "theme-green";
    document.body.className = saved;
    themeSelect.value = saved;
});
