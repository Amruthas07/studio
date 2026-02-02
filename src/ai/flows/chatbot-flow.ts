'use server';

/**
 * @fileOverview A Genkit flow for a helpful chatbot assistant.
 *
 * - chat - A function that handles the chatbot conversation.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {generate, MessageData} from 'genkit/ai';

const MessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() })),
});

const ChatInputSchema = z.object({
  history: z.array(MessageSchema).optional(),
  prompt: z.string().min(1, "Prompt cannot be empty."),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string(),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { history, prompt } = input;

    const systemPrompt = `You are a friendly and helpful assistant for the "Smart Institute" attendance management application. Your name is 'Smarty'.
    Your role is to guide users, answer questions about the app's features, and help them navigate the system.
    Be concise and professional. Stick to topics related to the application.
    If a question is outside your scope, politely decline to answer.
    
    Key Application Features:
    - Admins: Manage students & teachers, view enrollment analytics, and generate attendance reports.
    - Teachers: View student profiles within their department.
    - Students: View their own profile and detailed attendance history with analytics.`;

    const messages: MessageData[] = [
        { role: 'system', content: [{ text: systemPrompt }] },
        ...(history || []),
        { role: 'user', content: [{ text: prompt }] },
    ];
    
    const llmResponse = await generate({
        model: 'googleai/gemini-2.5-flash',
        messages: messages,
    });

    return {
      response: llmResponse.text,
    };
  }
);
