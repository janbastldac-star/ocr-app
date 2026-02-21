// ===========================
// QUIZ.JS
// ===========================
function generateQuiz(text) {
    if (!text) return [];
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
    return lines.map((line, idx) => ({
        question: `Question ${idx+1}`,
        answer: line,
        options: [
            line,
            "Wrong option 1",
            "Wrong option 2",
            "Wrong option 3"
        ]
    }));
}

document.getElementById("generateQuizBtn")?.addEventListener("click", () => {
    const input = document.getElementById("quizInput")?.value;
    const output = document.getElementById("quizOutput");
    if (!input || !output) return;
    const quiz = generateQuiz(input);
    output.innerHTML = "";
    quiz.forEach((q, i) => {
        const div = document.createElement("div");
        div.className = "quiz-question";
        div.innerHTML = `<p>${i+1}. ${q.question}</p>`;
        q.options.forEach((opt, idx) => {
            div.innerHTML += `<input type="radio" name="q${i}" id="q${i}_${idx}">
            <label for="q${i}_${idx}">${opt}</label><br>`;
        });
        output.appendChild(div);
    });
});
