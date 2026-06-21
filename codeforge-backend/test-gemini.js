require('dotenv').config({ path: './.env' });
const OpenAI = require('openai');

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai"
  });

  try {
    const response = await openai.chat.completions.create({
      model: 'gemini-1.5-flash',
      messages: [{ role: 'user', content: 'Say hello' }],
    });
    console.log("SUCCESS:", response.choices[0].message.content);
  } catch (error) {
    console.error("ERROR:", error.message || error);
  }
}

main();
