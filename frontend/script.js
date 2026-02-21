const imageInput = document.getElementById('imageUpload');
const extractBtn = document.getElementById('extractText');
const ocrTextArea = document.getElementById('ocrText');
const generateBtn = document.getElementById('generateQuiz');
const quizOutput = document.getElementById('quizOutput');

extractBtn.addEventListener('click', () => {
  const file = imageInput.files[0];
  if (!file) return alert('Select an image first.');

  Tesseract.recognize(
    file,
    'ces',  // Czech language
    { logger: m => console.log(m) }
  ).then(({ data: { text } }) => {
    ocrTextArea.value = text;
  });
});

generateBtn.addEventListener('click', async () => {
  const recognizedText = ocrTextArea.value;
  const numQuestions = document.getElementById('numQuestions').value;
  const questionType = document.getElementById('questionType').value;

  const response = await fetch('/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recognizedText, numQuestions, questionType })
  });

  const data = await response.json();
  quizOutput.innerText = data.quiz;
});
Tesseract.recognize(
  file,
  'ces', // Czech language
  {
    logger: m => console.log(m),
    langPath: 'https://tessdata.projectnaptha.com/4.0.0_best', // CDN for traineddata
  }
).then(({ data: { text } }) => {
  ocrTextArea.value = text;
});
