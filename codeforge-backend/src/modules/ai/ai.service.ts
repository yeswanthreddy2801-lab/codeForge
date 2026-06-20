import { prisma } from '../../config/database';
import { env } from '../../config/env';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export class AiService {
  static async translate(userId: string, englishContent: string) {
    const systemPrompt = `You are an expert translator from English to the custom programming language MyLang. 
MyLang syntax rules:
- Functions use 'def' keyword.
- Variables use 'let' or 'const'.
- Print statements use 'print()'.
- Blocks are enclosed in braces {}.
- No semicolons required.

Provide ONLY the code without any markdown formatting, no backticks, no explanations.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: englishContent }
      ],
      temperature: 0.2,
    });

    const mylangCode = response.choices[0].message.content || '';

    const translation = await prisma.etcHistory.create({
      data: {
        userId,
        englishText: englishContent,
        generatedCode: mylangCode,
        language: 'mylang',
      }
    });

    return { englishContent, mylangCode: translation.generatedCode };
  }

  static async getHistory(userId: string) {
    return prisma.etcHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }
}
