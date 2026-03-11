import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { Flow, FlowBlock } from "@/app/lib/collections";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * FlowAgent helper
 * Acts as a contextual bridge to Gemini for interpreting and generating API Flows.
 */
export async function getFlowChatResponse(
    flow: Flow,
    history: { role: 'user' | 'model', parts: Part[] }[],
    input: string
) {
    if (!API_KEY) {
        return "I need a Gemini API key to function. Please set `NEXT_PUBLIC_GEMINI_API_KEY` in your environment.";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        // Build system context
        const context = `You are "Protocol Assistant", a specialized AI agent for CosmoNaut, similar to Antigravity.
Your objective is to help the user design, debug, and optimize API Flows.
Current User Mission Protocol (Flow):
${JSON.stringify({
            name: flow.name,
            steps_count: flow.blocks.length,
            blocks: flow.blocks.map(b => ({
                id: b.id,
                name: b.name,
                method: b.method,
                url: b.url,
                status: b.status,
                error: b.error,
                order: b.order
            }))
        }, null, 2)}

Instructions:
1. Be technically precise but helpful, like a mission control specialist.
2. If a block has an error, analyze the 'error' and 'status' fields and suggest specific fixes (e.g., missing headers, bad JSON, authentication issues).
3. If the user asks to "add" a step, suggest a JSON structure for a new FlowBlock.
4. Keep responses concise and formatted with Markdown. Highlighting key terms like "Status 401" or "Auth Headers" is encouraged.
5. Refer to the user as "Commander" occasionally to maintain the space theme.

User Input: ${input}`;

        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(context);
        const responseText = result.response.text();

        return responseText;
    } catch (error: any) {
        console.error("Gemini AI Error:", error);
        return `I've encountered an anomaly in the neural link: ${error.message}. Please verify the protocol configuration.`;
    }
}
