async function runOCR() {

    const input = document.getElementById("imageInput");

    if (!input.files || input.files.length === 0) {
        alert("Please select an image first");
        return;
    }

    const file = input.files[0];

    const imageURL = URL.createObjectURL(file);

    try {

        document.getElementById("extractedText").value = "Processing OCR...";

        const result = await Tesseract.recognize(
            imageURL,
            "eng",
            {
                logger: m => console.log(m)
            }
        );

        document.getElementById("extractedText").value =
            result.data.text;

    } catch (err) {

        console.error(err);

        document.getElementById("extractedText").value =
            "OCR failed";

    }
}
