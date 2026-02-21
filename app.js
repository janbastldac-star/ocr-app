async function runOCR() {

const file = document.getElementById("imageInput").files[0];

if (!file) return;

const result = await Tesseract.recognize(
file,
"eng"
);

document.getElementById("extractedText").value =
result.data.text;

}
