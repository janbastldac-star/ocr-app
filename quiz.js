// ===========================
// QUIZ.JS - Full Quiz System
// ===========================

// ===========================
// GLOBAL VARIABLES
// ===========================
let quizData=[];
let pastQuizzes=[];
let currentQuestionIndex=0;
let currentLang="ces";

// ===========================
// QUIZ TYPES
// ===========================
const QUIZ_TYPES={ ABCD:"ABCD", TF:"TF", FIB:"FIB" };

// ===========================
// SIDE PANEL BUTTONS
// ===========================
function createQuiz(type){
    if(!lastExtractedText || !lastExtractedText.trim()){
        showError("No text available for quiz.");
        return;
    }
    currentLang=document.getElementById("langSelect").value||"ces";

    switch(type){
        case QUIZ_TYPES.ABCD: generateABCDQuiz(lastExtractedText); break;
        case QUIZ_TYPES.TF: generateTFQuiz(lastExtractedText); break;
        case QUIZ_TYPES.FIB: generateFIBQuiz(lastExtractedText); break;
        default: showError("Unknown quiz type: "+type);
    }
}

// ===========================
// ABCD QUIZ
// ===========================
function generateABCDQuiz(text){
    clearQuizArea(); quizData=[];
    const sentences=splitSentences(text);
    if(sentences.length===0){ showError("Text too short."); return; }

    sentences.forEach(s=>{
        const question=createQuestionFromSentence(s);
        const options=createABCDOptions(question.correctAnswer);
        quizData.push({ question:question.text, options:options, correct:question.correctAnswer });
    });
    currentQuestionIndex=0;
    renderQuiz(); saveCurrentQuiz(); showNotification("ABCD quiz generated "+quizData.length+" questions");
}

// ===========================
// TRUE/FALSE QUIZ
// ===========================
function generateTFQuiz(text){
    clearQuizArea(); quizData=[];
    const sentences=splitSentences(text);
    if(sentences.length===0){ showError("Text too short."); return; }

    sentences.forEach(s=>{
        const correct=s;
        const fake=scrambleSentence(s);
        const isTrue=Math.random()>0.5;
        const answer=isTrue?correct:fake;
        quizData.push({ question:"True or False: "+answer, options:["True","False"], correct:isTrue?"True":"False" });
    });
    currentQuestionIndex=0; renderQuiz(); saveCurrentQuiz(); showNotification("True/False quiz generated "+quizData.length+" questions");
}

// ===========================
// FILL-IN-THE-BLANK QUIZ
// ===========================
function generateFIBQuiz(text){
    clearQuizArea(); quizData=[];
    const words=text.split(/\s+/);
    if(words.length<5){ showError("Text too short."); return; }

    for(let i=0;i<Math.min(10,words.length);i++){
        const word=words[i];
        const blank=text.replace(word,new Array(word.length+1).join("_"));
        quizData.push({ question:blank, options:[word], correct:word });
    }
    currentQuestionIndex=0; renderQuiz(); saveCurrentQuiz(); showNotification("FIB quiz generated "+quizData.length+" questions");
}

// ===========================
// HELPER FUNCTIONS
// ===========================
function createQuestionFromSentence(sentence){ return { text:"What is: "+sentence.split(" ")[0]+"?", correctAnswer:sentence }; }
function createABCDOptions(correct){
    const options=[correct];
    while(options.length<4){ const fake=shuffleString(correct); if(!options.includes(fake)) options.push(fake); }
    return shuffleArray(options);
}
function renderQuiz(){
    const quizArea=document.getElementById("quizArea"); if(!quizArea) return;
    quizArea.innerHTML="";
    quizData.forEach((q,idx)=>{
        const container=document.createElement("div"); container.className="quiz-item";
        const questionEl=document.createElement("div"); questionEl.className="quiz-question"; questionEl.innerText=q.question;
        container.appendChild(questionEl);
        const optionsEl=document.createElement("div"); optionsEl.className="quiz-options";
        q.options.forEach(opt=>{
            const btn=document.createElement("button"); btn.innerText=opt;
            btn.onclick=()=>checkAnswer(idx,opt); optionsEl.appendChild(btn);
        });
        container.appendChild(optionsEl); quizArea.appendChild(container);
    });
}

// ===========================
// ANSWER CHECK
// ===========================
function checkAnswer(qIdx,selected){
    const question=quizData[qIdx]; const quizStatus=document.getElementById("quizStatus");
    if(selected===question.correct){ quizStatus.innerText="Correct!"; quizStatus.style.color="var(--success)"; }
    else{ quizStatus.innerText="Wrong! Correct: "+question.correct; quizStatus.style.color="var(--error)"; }
}

// ===========================
// UTILS
// ===========================
function shuffleString(str){ return str.split("").sort(()=>Math.random()-0.5).join(""); }
function shuffleArray(arr){ return arr.sort(()=>Math.random()-0.5); }
function splitSentences(text){ return text.split(/(?<=[.!?])\s+/).filter(s=>s.trim().length>3); }
function scrambleSentence(str){ const words=str.split(" "); return shuffleArray(words).join(" "); }

// ===========================
// QUIZ AREA HELPERS
// ===========================
function clearQuizArea(){ const quizArea=document.getElementById("quizArea"); if(quizArea) quizArea.innerHTML=""; }

// ===========================
// STORAGE CONNECTION
// ===========================
function saveCurrentQuiz(){
    if(!quizData.length) return; pastQuizzes.push(JSON.parse(JSON.stringify(quizData))); savePastQuizzes(pastQuizzes);
}
function loadPastQuizzes(){ pastQuizzes=getPastQuizzes()||[]; renderPastQuizzes(); }
function renderPastQuizzes(){
    const historyArea=document.getElementById("historyArea"); if(!historyArea) return;
    historyArea.innerHTML=""; pastQuizzes.forEach((quiz,idx)=>{
        const div=document.createElement("div"); div.className="history-item"; div.innerText="Quiz "+(idx+1)+" - "+quiz.length+" questions";
        div.onclick=()=>showModal("Past Quiz "+(idx+1),JSON.stringify(quiz,null,2)); historyArea.appendChild(div);
    });
}

// ===========================
// EXPORT & RESET
// ===========================
function exportHistory(){ if(!pastQuizzes.length){ showError("No past quizzes"); return; }
    const data=JSON.stringify(pastQuizzes,null,2); const blob=new Blob([data],{type:"application/json"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="past_quizzes.json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); showNotification("Exported past quizzes");
}
function resetHistory(){ pastQuizzes=[]; savePastQuizzes(pastQuizzes); renderPastQuizzes(); showNotification("All past quizzes cleared"); }

// ===========================
// SAFE WRAPPERS
// ===========================
function safeCreateQuiz(type){ try{ createQuiz(type); } catch(e){ console.error(e); showError("Quiz generation error."); } }

// ===========================
// INIT
// ===========================
window.addEventListener("load",()=>{ loadPastQuizzes(); });
