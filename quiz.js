// ===========================
// QUIZ.JS - Generate Quiz
// ===========================
function generateQuizFromText(text) {
    if (!text || text.trim().length === 0) return [];

    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    const quiz = [];

    lines.forEach((line, index) => {
        quiz.push({
            question: `Co platí pro následující větu? (${index + 1})`,
            answer: line,
            options: [
                line,
                "Nesprávná odpověď 1",
                "Nesprávná odpověď 2",
                "Nesprávná odpověď 3"
            ]
        });
    });

    return quiz;
}

document.getElementById("generateQuizBtn")?.addEventListener("click", () => {
    const input = document.getElementById("quizInput")?.value;
    const output = document.getElementById("quizOutput");
    if (!input || !output) return;

    const quiz = generateQuizFromText(input);
    output.innerHTML = "";
    quiz.forEach((q, i) => {
        const div = document.createElement("div");
        div.className = "quiz-question";
        div.innerHTML = `<p>${i + 1}. ${q.question}</p>`;
        q.options.forEach((opt, idx) => {
            div.innerHTML += `<input type="radio" name="q${i}" id="q${i}_${idx}">
            <label for="q${i}_${idx}">${opt}</label><br>`;
        });
        output.appendChild(div);
    });
});
