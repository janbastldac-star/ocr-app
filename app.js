// ======================
// PANEL SWITCHING
// ======================
function showPanel(id){
    document.querySelectorAll(".panel").forEach(p=>p.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

// ======================
// OCR SYSTEM (Czech high-precision)
// ======================
let ocrWorker=null,ocrReady=false;

async function initOCR(){
    if(ocrReady)return;

    const progressBar=document.getElementById("progressBar");
    const progressText=document.getElementById("progressText");
    progressText.innerText="Loading high-precision OCR engine...";

    ocrWorker=await Tesseract.createWorker("ces+eng",1,{
        langPath:"./tessdata",
        logger:m=>{
            if(m.status==="recognizing text"){
                const percent=Math.round(m.progress*100);
                progressBar.style.width=percent+"%";
                progressText.innerText=`Recognizing text: ${percent}%`;
            }else progressText.innerText=m.status;
        }
    });

    await ocrWorker.setParameters({
        tessedit_pageseg_mode:Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode:Tesseract.OEM.LSTM_ONLY,
        preserve_interword_spaces:"1",
        tessedit_char_whitelist:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž",
        textord_heavy_nr:"1",
        textord_noise_hfract:"0.3"
    });

    progressText.innerText="OCR ready";
    ocrReady=true;
}

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
                gray=((gray-128)*1.5)+128;
                gray=Math.min(255,Math.max(0,gray));
                data[i]=data[i+1]=data[i+2]=gray;
            }
            ctx.putImageData(imageData,0,0);
            canvas.toBlob(blob=>resolve(blob),"image/png");
        };
        img.onerror=reject;
        img.src=URL.createObjectURL(file);
    });
}

async function runOCR(){
    const file=document.getElementById("imageInput").files[0];
    const progressBar=document.getElementById("progressBar");
    const progressText=document.getElementById("progressText");
    const textarea=document.getElementById("extractedText");

    if(!file){alert("Select image first"); return;}
    textarea.value="";
    progressBar.style.width="0%";
    progressText.innerText="Preprocessing image...";

    if(!ocrReady) await initOCR();

    try{
        const preprocessedBlob=await preprocessImage(file);
        const imageURL=URL.createObjectURL(preprocessedBlob);
        const result=await ocrWorker.recognize(imageURL);
        textarea.value=result.data.text;
        progressBar.style.width="100%";
        progressText.innerText="OCR Complete";
        URL.revokeObjectURL(imageURL);
    }catch(err){
        console.error(err);
        progressText.innerText="OCR failed";
    }
}

// ======================
// QUIZ SYSTEM
// ======================
let currentQuiz=null;

function createQuiz(){
    const text=document.getElementById("extractedText").value;
    const words=text.split(/\s+/).filter(w=>w.length>4);
    if(words.length<4){alert("Not enough text"); return;}
    const correct=random(words);
    const options=shuffle([correct,random(words),random(words),random(words)]);
    currentQuiz={question:"Select the correct word from text:",correct,options};
    displayQuiz();
    saveQuiz(currentQuiz);
}

function displayQuiz(){
    let html=`<div class="quiz-question">${currentQuiz.question}</div>`;
    currentQuiz.options.forEach(opt=>{
        html+=`<button onclick="answer('${opt}')">${opt}</button>`;
    });
    document.getElementById("quizArea").innerHTML=html;
}

function answer(selected){
    if(selected===currentQuiz.correct) alert("Correct");
    else alert("Wrong");
}

// ======================
// STORAGE
// ======================
function saveQuiz(quiz){
    let quizzes=JSON.parse(localStorage.getItem("quizzes")||"[]");
    quizzes.push(quiz);
    localStorage.setItem("quizzes",JSON.stringify(quizzes));
}

function loadHistory(){
    const quizzes=JSON.parse(localStorage.getItem("quizzes")||"[]");
    let html="";
    quizzes.forEach(q=>{
        html+=`<div class="history-item">Question: ${q.correct}</div>`;
    });
    document.getElementById("historyArea").innerHTML=html;
}

// ======================
// THEME SWITCHING
// ======================
const themeSelect=document.getElementById("themeSelect");
themeSelect.onchange=function(){
    document.body.className=themeSelect.value;
    localStorage.setItem("theme",themeSelect.value);
};

// ======================
// HELPERS
// ======================
function random(arr){return arr[Math.floor(Math.random()*arr.length)];}
function shuffle(arr){return arr.sort(()=>Math.random()-0.5);}

// ======================
// ON LOAD
// ======================
window.addEventListener("load",()=>{
    const saved=localStorage.getItem("theme")||"theme-green";
    document.body.className=saved;
    themeSelect.value=saved;
    loadHistory();
    initOCR();
});
