import { json } from '@sveltejs/kit';
import { generateText } from '#lib/server/gemini.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  try {
    const text = await generateText('How does AI work? (Responde en español en 2 lineas)');
    return json({ success: true, text });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { prompt, model } = await request.json();
    const text = await generateText(prompt || 'How does AI work?', model || 'gemini-2.5-flash');
    return json({ success: true, text });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
