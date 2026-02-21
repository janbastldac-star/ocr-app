const imageInput = document.getElementById('imageUpload');
const extractBtn = document.getElementById('extractText');
const ocrTextArea = document.getElementById('ocrText');
const generateBtn = document.getElementById('generateQuiz');
const quizOutput = document.getElementById('quizOutput');

extractBtn.addEventListener('click', async () => {
  const file = imageInput.files[0];
  if (!file) return alert('Select an image first.');

  ocrTextArea.value = 'Processing...';

  // Create a URL for Tesseract
  const imageURL = URL.createObjectURL(file);

  try {
    const worker = Tesseract.createWorker({
      logger: m => console.log(m)
    });

    await worker.load();
    await worker.loadLanguage('ces');          // Load Czech
    await worker.initialize('ces');            // Initialize Czech
    await worker.setParameters({ tessdata: './tessdata/' }); // Path to your traineddata folder

    const { data: { text } } = await worker.recognize(imageURL);

    ocrTextArea.value = text;
    await worker.terminate();
  } catch (err) {
    console.error(err);
    ocrTextArea.value = 'OCR failed. Check console for details.';
  }
});

generateBtn.addEventListener('click', async () => {
  const recognizedText = ocrTextArea.value;
  const numQuestions = document.getElementById('numQuestions').value;
  const questionType = document.getElementById('questionType').value;

  if (!recognizedText) return alert('No text to generate quiz from.');

  try {
    const response = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recognizedText, numQuestions, questionType })
    });

    const data = await response.json();
    quizOutput.innerText = data.quiz;
  } catch (err) {
    console.error(err);
    quizOutput.innerText = 'Quiz generation failed.';
  }
});
