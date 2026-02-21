// Persistent storage for quizzes and settings
function saveQuiz(quiz){
    const quizzes = JSON.parse(localStorage.getItem("quizzes")||"[]");
    quizzes.push(quiz);
    localStorage.setItem("quizzes", JSON.stringify(quizzes));
}

function loadQuizzes(){
    return JSON.parse(localStorage.getItem("quizzes")||"[]");
}

function loadHistoryUI(){
    const historyArea = document.getElementById("historyArea");
    const quizzes = loadQuizzes();
    historyArea.innerHTML = quizzes.map(q=>`<div class="history-item">${q.question}<br><b>Answer:</b> ${q.correct}</div>`).join("");
}

window.addEventListener("load", loadHistoryUI);
