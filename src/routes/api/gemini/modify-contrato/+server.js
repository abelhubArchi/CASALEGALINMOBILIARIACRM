import { json } from '@sveltejs/kit';
import { modifyContratoWithIA } from '#lib/server/gemini.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { clausulas, prompt, asesor } = await request.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return json({ success: false, error: 'Debes proporcionar una instrucción para modificar el contrato.' }, { status: 400 });
    }

    if (!clausulas || !Array.isArray(clausulas) || clausulas.length === 0) {
      return json({ success: false, error: 'No se encontraron las cláusulas base para modificar.' }, { status: 400 });
    }

    const result = await modifyContratoWithIA(clausulas, prompt.trim(), asesor || {});

    return json({
      success: true,
      resumenModificacion: result.resumenModificacion || 'Modificaciones aplicadas con éxito.',
      clausulas: result.clausulas || clausulas
    });
  } catch (error) {
    console.error('Error en /api/gemini/modify-contrato:', error);
    return json({
      success: false,
      error: error.message || 'Error al modificar el contrato con Gemini 2.5 Flash.'
    }, { status: 500 });
  }
}
