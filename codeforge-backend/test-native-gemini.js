require('dotenv').config({ path: './.env', override: true });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function main() {
  console.log("Key length:", process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
  const genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY);

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: "Be nice" });
    const result = await model.generateContent("Say hello");
    console.log("SUCCESS:", result.response.text());
  } catch (error) {
    console.error("ERROR:", error.message || error);
  }
}

main();
