// =====================
// QUIZ GENERATOR
// =====================
let currentQuiz=null;

function createQuiz(){
  const text=document.getElementById("extractedText").value;
  if(!text || text.length<10){alert("Extract more text first"); return;}

  const lang=document.getElementById("langSelect").value;

  // Split text into sentences
  let sentences=text.split(/[.?!]\s+/).filter(s=>s.length>5);
  if(sentences.length<1){alert("Not enough sentences"); return;}

  const correct=random(sentences);
  let question,answer;

  if(lang==="ces"){
    question=`Co je "${correct.split(" ")[0]}"?`;
    answer=`${correct}`;
  } else {
    question=`What is "${correct.split(" ")[0]}"?`;
    answer=`${correct}`;
  }

  // Generate 3 wrong options
  let wrongs=shuffle(sentences.filter(s=>s!==correct)).slice(0,3);
  const options=shuffle([answer,...wrongs]);

  currentQuiz={question,options,correct:answer};
  displayQuiz();
  saveQuiz(currentQuiz);
}

function displayQuiz(){
  let html=`<div class="quiz-question">${currentQuiz.question}</div>`;
  currentQuiz.options.forEach(opt=>{
    html+=`<div class="quiz-options"><button onclick="answer('${opt.replace(/'/g,"\\'")}')">${opt}</button></div>`;
  });
  document.getElementById("quizArea").innerHTML=html;
}

function answer(selected){
  if(selected===currentQuiz.correct) alert("Correct!");
  else alert("Wrong! Correct answer: "+currentQuiz.correct);
}

// =====================
// QUIZ STORAGE
// =====================
function saveQuiz(quiz){
  let quizzes=JSON.parse(localStorage.getItem("quizzes")||"[]");
  quizzes.push(quiz);
  localStorage.setItem("quizzes",JSON.stringify(quizzes));
}

function loadHistory(){
  const quizzes=JSON.parse(localStorage.getItem("quizzes")||"[]");
  let html="";
  quizzes.forEach(q=>{
    html+=`<div class="history-item">${q.question}<br><b>Answer:</b> ${q.correct}</div>`;
  });
  document.getElementById("historyArea").innerHTML=html;
}

window.addEventListener("load",loadHistory);

// =====================
// HELPERS
// =====================
function random(arr){return arr[Math.floor(Math.random()*arr.length)];}
function shuffle(arr){return arr.sort(()=>Math.random()-0.5);}
