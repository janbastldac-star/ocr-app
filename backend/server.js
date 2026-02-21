import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import Tesseract from 'tesseract.js';
import path from 'path';
import fs from 'fs';

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(express.json());
app.use(express.static('../frontend'));

app.post('/generate', async (req, res) => {
  const { imageBase64, numQuestions, questionType } = req.body;

  // Save uploaded image temporarily
  const imagePath = path.join('uploads', `temp_${Date.now()}.png`);
  fs.writeFileSync(imagePath, Buffer.from(imageBase64.split(',')[1], 'base64'));

  try {
    // Run OCR
    const { data: { text: recognizedText } } = await Tesseract.recognize(imagePath, 'ces', {
      langPath: path.join(__dirname, 'tessdata')
    });

    // Generate quiz from OCR text
    const prompt = `
Vytvoř kvíz z tohoto českého textu:
"${recognizedText}"
- Počet otázek: ${numQuestions}
- Typ otázek: ${questionType}
- Přidej i odpovědi.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }]
    });

    // Return quiz
    res.json({ quiz: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ quiz: 'Chyba při OCR nebo generování kvízu.' });
  } finally {
    fs.unlinkSync(imagePath); // delete temp file
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
