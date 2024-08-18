import {
    Message as VercelChatMessage,
    StreamingTextResponse,
    createStreamDataTransformer
} from 'ai';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { HttpResponseOutputParser } from 'langchain/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { formatDocumentsAsString } from 'langchain/util/document';

interface Pokemon {
    name: string;
    url: string;
}

interface PokemonAPIResponse {
    results: Pokemon[];
    next: string | null;
}

const POKEAPI_URL = 'https://pokeapi.co/api/v2/pokemon';

async function fetchAllPokeAPIData(): Promise<Pokemon[]> {
    let allData: Pokemon[] = [];
    let nextUrl: string | null = `${POKEAPI_URL}?limit=100`;

    while (nextUrl) {
        try {
            const response = await fetch(nextUrl);
            const data: PokemonAPIResponse = await response.json();
            allData = allData.concat(data.results);
            nextUrl = data.next;
        } catch (error) {
            console.error("Error fetching data from PokeAPI:", error);
            break;
        }
    }

    return allData;
}

export const dynamic = 'force-dynamic';

const formatMessage = (message: VercelChatMessage) => {
    return `${message.role}: ${message.content}`;
};

// Updated prompt template
const TEMPLATE = `
Got questions about Pokémon? I’m here to assist! Whether you need guidance on building a team, exploring Pokémon lore, or refining your competitive strategies, just ask.

==============================
Context: {context}
==============================
Previous Conversations:
{chat_history}

Your Question:
{question}

Your Response:
Answer the question immediately.
If you’re asking about an evolution line: "This Pokémon is preceded by [X] and evolves by [method]. After that, it evolves to [Y] by [method]."
For team-based questions: "Consider Pokémon with [type coverage] and roles like [roles]. Make it short"
For subjective questions: "I checked Bulbapedia for information on [subject]. [If available: The information is that [details].] If there's no specific answer, it's considered subjective and open to interpretation."
`;


export async function POST(req: Request): Promise<Response> {
    try {
        const { messages }: { messages: VercelChatMessage[] } = await req.json();

        const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
        const currentMessageContent = messages[messages.length - 1].content;

        const docs: Pokemon[] = await fetchAllPokeAPIData();
        const formattedDocs = docs.map(pokemon => ({
            name: pokemon.name,
            url: pokemon.url
        }));

        const prompt = PromptTemplate.fromTemplate(TEMPLATE);

        const model = new ChatOpenAI({
            apiKey: process.env.OPENAI_API_KEY!,
            model: 'gpt-4o-mini',
            temperature: 0,
            streaming: true,
            verbose: true,
        });

        const parser = new HttpResponseOutputParser();

        const chain = RunnableSequence.from([
            {
                question: (input: { question: string }) => input.question,
                chat_history: (input: { chat_history: string }) => input.chat_history,
                context: () => formatDocumentsAsString(formattedDocs),
            },
            prompt,
            model,
            parser,
        ]);

        const stream = await chain.stream({
            chat_history: formattedPreviousMessages.join('\n'),
            question: currentMessageContent,
        });

        return new StreamingTextResponse(
            stream.pipeThrough(createStreamDataTransformer()),
        );
    } catch (e: any) {
        return Response.json({ error: e.message }, { status: e.status ?? 500 });
    }
}
