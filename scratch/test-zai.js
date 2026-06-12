const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

let apiKey = '';
for (const line of envContent.split('\n')) {
  if (line.trim().startsWith('ZAI_API_KEY=')) {
    apiKey = line.split('=')[1].trim().replace(/['"]/g, '');
  }
}

const models = [
  'glm-4.5',
  'glm-4.5-air',
  'glm-4.6',
  'glm-4.7',
  'glm-5',
  'glm-5-turbo',
  'glm-5.1'
];

async function testAll() {
  for (const model of models) {
    try {
      const res = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });
      const data = await res.json();
      console.log(`Model ${model}: Status ${res.status}`);
      if (res.status === 200) {
        console.log(`Success response:`, JSON.stringify(data, null, 2));
      } else {
        console.log(`Error:`, data.error ? data.error.message : data);
      }
    } catch (err) {
      console.error(`Error for ${model}:`, err.message);
    }
  }
}

testAll();
