require('dotenv').config({ path: './.env', override: true });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function main() {
  const genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.OPENAI_API_KEY}`);
    const data = await response.json();
    console.log("Available models:");
    data.models.forEach(m => console.log(m.name));
  } catch (error) {
    console.error("ERROR:", error);
  }
}

main();
