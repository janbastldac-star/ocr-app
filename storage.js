function saveQuiz(q, options, correct) {

let quizzes =
JSON.parse(localStorage.getItem("quizzes") || "[]");

quizzes.push({
q, options, correct
});

localStorage.setItem(
"quizzes",
JSON.stringify(quizzes)
);

}

function loadQuizzes() {

return JSON.parse(
localStorage.getItem("quizzes") || "[]"
);

}
