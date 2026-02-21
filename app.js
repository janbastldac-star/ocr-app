// ===========================
// APP.JS - OCR & Theme Management
// ===========================

// ===========================
// GLOBAL VARIABLES
// ===========================
let ocrWorker = null;
let ocrReady = false;
let lastExtractedText = "";

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
function showNotification(msg){
    const container = document.getElementById("notificationContainer");
    const text = document.getElementById("notificationText");
    text.innerText = msg;
    container.classList.remove("hidden");
    setTimeout(()=>container.classList.add("hidden"),3000);
}
function showError(msg){
    const errorEl = document.getElementById("extractorErrors");
    const msgEl = document.getElementById("extractorErrorMsg");
    msgEl.innerText = msg;
    errorEl.classList.remove("hidden");
    setTimeout(()=>errorEl.classList.add("hidden"),4000);
}

// ===========================
// MODAL
// ===========================
function showModal(title,msg){
    const modal = document.getElementById("modalContainer");
    const modalTitle = document.getElementById("modalTitle");
    const modalMsg = document.getElementById("modalMessage");
    modalTitle.innerText = title;
    modalMsg.innerText = msg;
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
    progressText.innerText = "Initializing OCR engine...";

    const lang = document.getElementById("langSelect").value || "ces";

    try{
        ocrWorker = await Tesseract.createWorker({
            logger: m=>{
                if(m.status==="recognizing text"){
                    const pct=Math.round(m.progress*100);
                    progressBar.style.width=pct+"%";
                    progressText.innerText=`Recognizing text: ${pct}%`;
                } else{
                    progressText.innerText=m.status;
                }
            }
        });
        await ocrWorker.load();
        await ocrWorker.loadLanguage(lang);
        await ocrWorker.initialize(lang);
        await ocrWorker.setParameters({
            tessedit_pageseg_mode: Tesseract.PSM.AUTO,
            tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
            preserve_interword_spaces: "1",
            tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž",
            textord_heavy_nr: "1",
            textord_noise_hfract: "0.3"
        });
        progressText.innerText = "OCR Ready";
        ocrReady=true;
    }catch(e){
        console.error(e);
        showError("OCR Initialization failed.");
    }
}

// ===========================
// IMAGE PREPROCESSING
// ===========================
function preprocessImage(file){
    return new Promise((resolve,reject)=>{
        const img=new Image();
        img.onload=()=>{
            const canvas=document.getElementById("preprocessCanvas");
            const ctx=canvas.getContext("2d");
            const maxWidth=2000;
            const scale=Math.min(1,maxWidth/img.width);
            canvas.width=img.width*scale;
            canvas.height=img.height*scale;
            ctx.drawImage(img,0,0,canvas.width,canvas.height);

            let imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
            let data=imageData.data;
            for(let i=0;i<data.length;i+=4){
                let gray=0.299*data[i]+0.587*data[i+1]+0.114*data[i+2];
                gray=((gray-128)*2)+128;
                gray=Math.min(255,Math.max(0,gray));
                data[i]=data[i+1]=data[i+2]=gray;
            }
            ctx.putImageData(imageData,0,0);

            const binData=ctx.getImageData(0,0,canvas.width,canvas.height);
            for(let i=0;i<binData.data.length;i+=4){
                const v=binData.data[i]>128?255:0;
                binData.data[i]=binData.data[i+1]=binData.data[i+2]=v;
            }
            ctx.putImageData(binData,0,0);

            canvas.toBlob(blob=>resolve(blob),"image/png");
        };
        img.onerror=reject;
        img.src=URL.createObjectURL(file);
    });
}

// ===========================
// RUN OCR
// ===========================
async function runOCR(){
    const file=document.getElementById("imageInput").files[0];
    const progressBar=document.getElementById("progressBar");
    const progressText=document.getElementById("progressText");
    const textarea=document.getElementById("extractedText");

    if(!file){ showError("Select an image first."); return; }
    textarea.value="";
    progressBar.style.width="0%";
    progressText.innerText="Preprocessing image...";

    if(!ocrReady) await initOCR();

    try{
        const blob=await preprocessImage(file);
        const url=URL.createObjectURL(blob);
        const result=await ocrWorker.recognize(url);
        textarea.value=result.data.text;
        lastExtractedText=result.data.text;
        saveLastText(lastExtractedText);
        saveLastImage(blob);

        progressBar.style.width="100%";
        progressText.innerText="OCR Complete";
        URL.revokeObjectURL(url);
    }catch(e){
        console.error(e);
        showError("OCR Failed");
    }
}

// ===========================
// SAFE RUN OCR
// ===========================
function safeRunOCR(){ try{ runOCR(); } catch(e){ console.error(e); showError("OCR execution error."); } }

// ===========================
// THEME + LANGUAGE SETTINGS
// ===========================
const themeSelect=document.getElementById("themeSelect");
themeSelect.onchange=function(){
    document.body.className=themeSelect.value;
    localStorage.setItem("theme",themeSelect.value);
};
const langSelect=document.getElementById("langSelect");
langSelect.onchange=function(){ ocrReady=false; initOCR(); }

// ===========================
// LOAD SETTINGS
// ===========================
window.addEventListener("load",()=>{
    const saved=localStorage.getItem("theme")||"theme-green";
    document.body.className=saved;
    themeSelect.value=saved;
});
