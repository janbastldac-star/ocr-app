import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(express.json());

app.post('/generate', async (req, res) => {
  const { recognizedText, numQuestions, questionType } = req.body;

  const prompt = `
Generate a quiz from this Czech text:
"${recognizedText}"
- Number of questions: ${numQuestions}
- Question type: ${questionType}
- Include the answers.
`;

  const quiz = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [{ role: 'user', content: prompt }]
  });

  res.json({ quiz: quiz.choices[0].message.content });
});

app.listen(3000, () => console.log('Server running on port 3000'));
