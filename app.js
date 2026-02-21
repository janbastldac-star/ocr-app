// ===========================
// APP.JS - Advanced OCR for Czech
// ===========================

let ocrWorker = null;
let ocrReady = false;
let lastExtractedText = "";
let lastProcessedImage = null;

// ===========================
// PANEL SWITCHING
// ===========================
function showPanel(id){
    document.querySelectorAll(".panel").forEach(p=>p.classList.add("hidden"));
    const panel = document.getElementById(id);
    if(panel) panel.classList.remove("hidden");
}

// ===========================
// NOTIFICATIONS
// ===========================
function showNotification(msg, timeout=3000){
    const container = document.getElementById("notificationContainer");
    const text = document.getElementById("notificationText");
    text.innerText = msg;
    container.classList.remove("hidden");
    setTimeout(()=>container.classList.add("hidden"), timeout);
}
function showError(msg, timeout=4000){
    const errorEl = document.getElementById("extractorErrors");
    const msgEl = document.getElementById("extractorErrorMsg");
    msgEl.innerText = msg;
    errorEl.classList.remove("hidden");
    setTimeout(()=>errorEl.classList.add("hidden"), timeout);
}

// ===========================
// MODAL
// ===========================
function showModal(title, msg){
    const modal = document.getElementById("modalContainer");
    document.getElementById("modalTitle").innerText = title;
    document.getElementById("modalMessage").innerText = msg;
    modal.classList.remove("hidden");
}
function closeModal(){
    document.getElementById("modalContainer").classList.add("hidden");
}

// ===========================
// OCR INITIALIZATION
// ===========================
async function initOCR(){
    if(ocrReady) return;

    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    progressText.innerText = "Initializing OCR...";

    const lang = document.getElementById("langSelect").value || "ces";

    try{
        ocrWorker = await Tesseract.createWorker({
            workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js',
            langPath: './tessdata',
            logger: m=>{
                if(m.status==="recognizing text"){
                    const pct=Math.round(m.progress*100);
                    progressBar.style.width = pct+"%";
                    progressText.innerText = `Recognizing text: ${pct}%`;
                } else progressText.innerText = m.status;
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
            load_system_dawg: "0",
            load_freq_dawg: "0"
        });

        progressText.innerText = "OCR Ready";
        ocrReady = true;
    }catch(e){
        console.error(e);
        showError("OCR Initialization failed: "+e.message);
    }
}

// ===========================
// RUN OCR
// ===========================
async function runOCR(){
    const file = document.getElementById("imageInput").files[0];
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    const textarea = document.getElementById("extractedText");

    if(!file){ showError("Select an image first."); return; }

    textarea.value="";
    progressBar.style.width="0%";
    progressText.innerText="Preparing image...";

    if(!ocrReady) await initOCR();

    try{
        // Use preparation.js function
        const preparedBlob = await window.prepareImageForOCR(file);
        lastProcessedImage = preparedBlob;

        progressText.innerText = "Running OCR...";

        const url = URL.createObjectURL(preparedBlob);
        const result = await ocrWorker.recognize(url);

        let text = result.data.text;

        // ===========================
        // POST-PROCESSING
        // ===========================
        text = text.split('\n').map(line=>{
            line = line.trim();
            if(line.length===0) return "";
            
            // Fix diacritics
            line = line
                .replace(/Á/g,'Á').replace(/Č/g,'Č').replace(/Ď/g,'Ď')
                .replace(/É/g,'É').replace(/Ě/g,'Ě').replace(/Í/g,'Í')
                .replace(/Ň/g,'Ň').replace(/Ó/g,'Ó').replace(/Ř/g,'Ř')
                .replace(/Š/g,'Š').replace(/Ť/g,'Ť').replace(/Ú/g,'Ú')
                .replace(/Ů/g,'Ů').replace(/Ý/g,'Ý').replace(/Ž/g,'Ž')
                .replace(/á/g,'á').replace(/č/g,'č').replace(/ď/g,'ď')
                .replace(/é/g,'é').replace(/ě/g,'ě').replace(/í/g,'í')
                .replace(/ň/g,'ň').replace(/ó/g,'ó').replace(/ř/g,'ř')
                .replace(/š/g,'š').replace(/ť/g,'ť')
                .replace(/ú/g,'ú').replace(/ů/g,'ů')
                .replace(/ý/g,'ý').replace(/ž/g,'ž');

            // Fix common OCR confusions
            line = line.replace(/\|/g,'I').replace(/0/g,'0').replace(/1/g,'1').replace(/l/g,'l').replace(/O/g,'O');

            // Remove obvious gibberish
            line = line.replace(/\b[b-df-hj-np-tv-z]{4,}\b/gi,'');

            return line;
        }).filter(line=>line.length>0).join('\n');

        textarea.value = text;
        lastExtractedText = text;
        saveLastText(text);
        saveLastImage(preparedBlob);

        progressBar.style.width="100%";
        progressText.innerText="OCR Complete";
        URL.revokeObjectURL(url);
    }catch(e){
        console.error(e);
        showError("OCR Failed: "+e.message);
    }
}

// ===========================
// THEME + LANGUAGE SETTINGS
// ===========================
document.getElementById("themeSelect").onchange = function(){
    document.body.className = this.value;
    localStorage.setItem("theme",this.value);
};
document.getElementById("langSelect").onchange = function(){
    ocrReady=false;
    initOCR();
};

// ===========================
// LOAD SETTINGS
// ===========================
window.addEventListener("load",()=>{
    const saved=localStorage.getItem("theme")||"theme-green";
    document.body.className = saved;
    document.getElementById("themeSelect").value = saved;
});
