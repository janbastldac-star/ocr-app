// Quiz generator logic
let currentQuiz = null;

function createQuiz(){
    const text = document.getElementById("extractedText").value;
    if(!text || text.length < 10){ alert("Extract more text first."); return; }

    const lang = document.getElementById("langSelect").value;
    const sentences = text.split(/[.?!]\s+/).filter(s=>s.length>5);
    if(sentences.length<1){ alert("Not enough sentences."); return; }

    const correct = random(sentences);
    let question, answer;

    if(lang === "ces"){
        question = `Co je "${correct.split(" ")[0]}"?`;
        answer = `${correct}`;
    } else {
        question = `What is "${correct.split(" ")[0]}"?`;
        answer = `${correct}`;
    }

    const wrongs = shuffle(sentences.filter(s=>s!==correct)).slice(0,3);
    const options = shuffle([answer, ...wrongs]);

    currentQuiz = {question, options, correct: answer};
    displayQuiz();
    saveQuiz(currentQuiz);
    loadHistoryUI();
}

function displayQuiz(){
    const quizArea = document.getElementById("quizArea");
    let html = `<div class="quiz-question">${currentQuiz.question}</div>`;
    currentQuiz.options.forEach(opt=>{
        html += `<div class="quiz-options"><button onclick="answer('${opt.replace(/'/g,"\\'")}')">${opt}</button></div>`;
    });
    quizArea.innerHTML = html;
}

function answer(selected){
    if(selected===currentQuiz.correct) alert("Correct!");
    else alert("Wrong! Correct answer: " + currentQuiz.correct);
}

// Helpers
function random(arr){return arr[Math.floor(Math.random()*arr.length)];}
function shuffle(arr){return arr.sort(()=>Math.random()-0.5);}
