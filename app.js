// PANEL SWITCHING

function showPanel(id) {

    document.querySelectorAll(".panel")
        .forEach(p => p.classList.add("hidden"));

    document.getElementById(id)
        .classList.remove("hidden");

}



// OCR FUNCTION

async function runOCR() {

    const file =
        document.getElementById("imageInput").files[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    const result =
        await Tesseract.recognize(url, "eng");

    document.getElementById("extractedText").value =
        result.data.text;

}



// QUIZ GENERATOR (IMPROVED)

let currentQuiz = null;


function createQuiz() {

    const text =
        document.getElementById("extractedText").value;

    const words =
        text.split(/\s+/)
        .filter(w => w.length > 4);

    if (words.length < 4) {

        alert("Not enough text");

        return;

    }

    const correct =
        random(words);

    const options =
        shuffle([
            correct,
            random(words),
            random(words),
            random(words)
        ]);

    currentQuiz = {
        question:
            "Select the correct word from text:",
        correct,
        options
    };

    displayQuiz();

    saveQuiz(currentQuiz);

}


function displayQuiz() {

    let html =
        `<div class="quiz-question">
        ${currentQuiz.question}
        </div>`;

    currentQuiz.options.forEach(opt => {

        html += `
        <button onclick="answer('${opt}')">
            ${opt}
        </button>
        `;

    });

    document.getElementById("quizArea").innerHTML =
        html;

}


function answer(selected) {

    if (selected === currentQuiz.correct)
        alert("Correct");

    else
        alert("Wrong");

}



// STORAGE

function saveQuiz(quiz) {

    let quizzes =
        JSON.parse(localStorage.getItem("quizzes") || "[]");

    quizzes.push(quiz);

    localStorage.setItem(
        "quizzes",
        JSON.stringify(quizzes)
    );

}


function loadHistory() {

    const quizzes =
        JSON.parse(localStorage.getItem("quizzes") || "[]");

    let html = "";

    quizzes.forEach(q => {

        html += `<div>
        Question: ${q.correct}
        </div>`;

    });

    document.getElementById("historyArea").innerHTML =
        html;

}



// THEME SWITCHING (FIXED)

const themeSelect =
    document.getElementById("themeSelect");


themeSelect.onchange = function () {

    document.body.className =
        themeSelect.value;

    localStorage.setItem(
        "theme",
        themeSelect.value
    );

};


window.onload = function () {

    const saved =
        localStorage.getItem("theme")
        || "theme-green";

    document.body.className =
        saved;

    themeSelect.value =
        saved;

    loadHistory();

};



// HELPERS

function random(arr) {

    return arr[
        Math.floor(Math.random() * arr.length)
    ];

}

function shuffle(arr) {

    return arr.sort(() =>
        Math.random() - 0.5);

}
