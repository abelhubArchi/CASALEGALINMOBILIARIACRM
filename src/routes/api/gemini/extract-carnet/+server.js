import { json } from '@sveltejs/kit';
import { extractCarnetFromImages } from '#lib/server/gemini.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { images } = await request.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return json({ success: false, error: 'Debes proporcionar al menos una imagen del carnet de identidad.' }, { status: 400 });
    }

    const data = await extractCarnetFromImages(images);

    return json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error en /api/gemini/extract-carnet:', error);
    return json({
      success: false,
      error: error.message || 'Error al procesar la cédula de identidad con Gemini 2.5.'
    }, { status: 500 });
  }
}
