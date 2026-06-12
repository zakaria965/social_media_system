const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const geminiKey = process.env.GEMINI_API_KEY;
const zaiKey = process.env.ZAI_API_KEY;

async function testGemini() {
  console.log('\n--- Testing Gemini API Key ---');
  if (!geminiKey) {
    console.log('Gemini API key is missing.');
    return;
  }
  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Hello, respond with exactly "Gemini OK"' }] }],
      generationConfig: { maxOutputTokens: 20 }
    });
    console.log('Gemini Success response:', result.response.text().trim());
  } catch (err) {
    console.error('Gemini Failed with error:');
    console.error('Message:', err.message);
    console.error('Status/Code:', err.status || err.statusCode);
  }
}

async function testZai() {
  console.log('\n--- Testing Z.ai API Key ---');
  if (!zaiKey) {
    console.log('Z.ai API key is missing.');
    return;
  }
  try {
    const openai = new OpenAI({
      apiKey: zaiKey,
      baseURL: 'https://api.z.ai/api/paas/v4'
    });
    const response = await openai.chat.completions.create({
      model: 'glm-5-turbo',
      messages: [{ role: 'user', content: 'Hello, respond with exactly "Z.ai OK"' }],
      max_tokens: 20
    });
    console.log('Z.ai Success response:', response.choices[0]?.message?.content?.trim());
  } catch (err) {
    console.error('Z.ai Failed with error:');
    console.error('Message:', err.message);
    console.error('Status/Code:', err.status || err.statusCode);
  }
}

async function run() {
  await testGemini();
  await testZai();
}

run();
