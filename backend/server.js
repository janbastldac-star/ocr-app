import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(express.json());
app.use(express.static('../frontend')); // Serve frontend files

app.post('/generate', async (req, res) => {
  const { recognizedText, numQuestions, questionType } = req.body;

  const prompt = `
Vytvoř kvíz z tohoto českého textu:
"${recognizedText}"
- Počet otázek: ${numQuestions}
- Typ otázek: ${questionType}
- Přidej i odpovědi.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }]
    });

    res.json({ quiz: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ quiz: 'Chyba při generování kvízu.' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
