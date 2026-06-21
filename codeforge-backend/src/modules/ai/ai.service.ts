import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(env.OPENAI_API_KEY);

export class AiService {
  static async translate(userId: string | undefined, englishContent: string, language: string) {
    let languageRules = '';
    if (language === 'mylang') {
      languageRules = `MyLang syntax rules:
- Functions use 'def' keyword.
- Variables use 'let' or 'const'.
- Print statements use 'print()'.
- Blocks are enclosed in braces {}.
- No semicolons required.`;
    } else {
      languageRules = `Ensure standard ${language} syntax.`;
    }

    const systemPrompt = `You are an expert programmer. Translate the following English logic description into ${language} code.
${languageRules}

Provide ONLY the code without any markdown formatting, no backticks, no explanations.`;

    let generatedCode = '';

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: englishContent }] }],
        generationConfig: {
          temperature: 0.2,
        }
      });

      generatedCode = result.response.text() || '';
    } catch (error: any) {
      console.error('Gemini Native API Error:', error?.message || error);
      // Fallback mock response so the UI doesn't crash for the user
      generatedCode = `// AI Generation failed. Here is a mock response:
function mockTranslatedCode() {
  console.log("This is a simulated AI response.");
  console.log("Your input was: ${englishContent}");
}`;
    }

    if (userId) {
      await prisma.etcHistory.create({
        data: {
          userId,
          englishText: englishContent,
          generatedCode: generatedCode,
          language: language,
        }
      });
    }

    return { englishContent, code: generatedCode, language };
  }

  static async getHistory(userId: string) {
    return prisma.etcHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }
}
