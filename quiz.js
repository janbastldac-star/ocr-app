function generateQuiz() {

const text =
document.getElementById("extractedText").value;

const words = text.split(" ");

let questionWord =
words[Math.floor(Math.random()*words.length)];

let options = shuffle([
questionWord,
randomWord(words),
randomWord(words),
randomWord(words)
]);

let correctIndex =
options.indexOf(questionWord);

displayQuiz(questionWord, options, correctIndex);

saveQuiz(questionWord, options, correctIndex);

}

function randomWord(words) {
return words[Math.floor(Math.random()*words.length)];
}

function shuffle(array) {
return array.sort(() => Math.random() - 0.5);
}

function displayQuiz(question, options, correct) {

let html = `<h3>Select the correct word:</h3>`;

options.forEach((opt, i) => {

html += `
<button onclick="checkAnswer(${i},${correct})">
${opt}
</button><br>
`;

});

document.getElementById("quizContainer").innerHTML = html;

}

function checkAnswer(selected, correct) {

if(selected === correct)
alert("Correct!");
else
alert("Wrong!");

}
