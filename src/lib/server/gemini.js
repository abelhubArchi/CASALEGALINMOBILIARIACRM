import { GoogleGenAI } from '@google/genai';
import { OAuth2Client, GoogleAuth } from 'google-auth-library';
import { execSync } from 'child_process';

let cachedClient = null;

export async function getGeminiClient() {
  if (cachedClient) return cachedClient;

  // 1. Verificar GEMINI_API_KEY o GOOGLE_API_KEY (Recomendado y estándar para Vercel / GCP)
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey && apiKey.trim()) {
    cachedClient = new GoogleGenAI({
      apiKey: apiKey.trim()
    });
    return cachedClient;
  }

  // 2. Si se proporcionó una clave de cuenta de servicio de Google Cloud en JSON (en Vercel / Servidor)
  const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.GCP_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson && serviceAccountJson.trim()) {
    try {
      const credentials = JSON.parse(serviceAccountJson.trim());
      const projectId = credentials.project_id || process.env.GOOGLE_CLOUD_PROJECT || 'casa-legal-bolivia';
      const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

      const auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
      const authClient = await auth.getClient();

      cachedClient = new GoogleGenAI({
        vertexai: true,
        project: projectId,
        location: location,
        googleAuthOptions: {
          authClient
        }
      });
      return cachedClient;
    } catch (errJson) {
      console.warn('Error al parsear GOOGLE_APPLICATION_CREDENTIALS_JSON:', errJson.message);
    }
  }

  // 3. Entorno de desarrollo local (Windows / Linux con gcloud CLI autenticado)
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'casa-legal-bolivia';
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

  try {
    let token = '';
    const gcloudPath = 'C:\\Program Files (x86)\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd';
    try {
      token = execSync(`"${gcloudPath}" auth print-access-token`).toString().trim();
    } catch {
      try {
        token = execSync('gcloud auth print-access-token').toString().trim();
      } catch {
        // gcloud CLI no disponible
      }
    }

    if (token) {
      const authClient = new OAuth2Client();
      authClient.setCredentials({ access_token: token });

      cachedClient = new GoogleGenAI({
        vertexai: true,
        project: projectId,
        location: location,
        googleAuthOptions: {
          authClient
        }
      });
      return cachedClient;
    }
  } catch (e) {
    // No disponible gcloud local
  }

  // 4. Entorno nativo Google Cloud (Cloud Run / App Engine con Service Account asignada)
  if (process.env.K_SERVICE || process.env.GAE_SERVICE || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      cachedClient = new GoogleGenAI({
        vertexai: true,
        project: projectId,
        location: location
      });
      return cachedClient;
    } catch (e) {
      // Continuar al error explícito
    }
  }

  // 5. Si ninguna credencial fue encontrada (ej. Vercel sin GEMINI_API_KEY configurada)
  throw new Error(
    'Configuración requerida en Vercel: Falta definir la variable GEMINI_API_KEY. ' +
    'Para solucionarlo: 1) Genera tu clave en https://aistudio.google.com/apikey ' +
    '2) En Vercel ve a Settings -> Environment Variables y agrega GEMINI_API_KEY con tu clave. ' +
    '3) Realiza un nuevo deploy.'
  );
}

/**
 * Función rápida para generar contenido
 * @param {string} prompt 
 * @param {string} [model] 
 */
export async function generateText(prompt, model = 'gemini-2.5-flash') {
  const ai = await getGeminiClient();
  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });
  return response.text;
}

/**
 * Extraer información estructurada de un carnet de identidad boliviano (anverso y/o reverso)
 * @param {Array<{ data: string, mimeType: string }>} images 
 */
export async function extractCarnetFromImages(images) {
  const ai = await getGeminiClient();

  const promptText = `
Eres un asistente experto en reconocimiento de Cédulas de Identidad de Bolivia (SEGIP).
Analiza la(s) imagen(es) adjunta(s) (anverso y/o reverso de la cédula de identidad boliviana del asesor).

Extrae con máxima precisión los siguientes datos del ciudadano:
- nombres: Nombres de pila (ej: "Miguel Angel")
- apellidos: Apellidos paterno y materno (ej: "Magne Luna")
- nombreCompleto: Nombre completo en orden natural (ej: "Miguel Angel Magne Luna")
- ci: Número de documento (solo dígitos, ej: "8463889")
- expedido: Código de dos letras de la extensión (ej: "LP", "SC", "CB", "OR", "PT", "TJ", "CH", "BE", "PD")
- ciCompleto: CI con expedido (ej: "8463889 LP")
- fechaNacimiento: Fecha de nacimiento en formato "YYYY-MM-DD" (si la cédula dice 14/05/1990, devolver "1990-05-14")
- nacionalidad: Generalmente "Boliviana"
- estadoCivil: "Soltero", "Casado", "Divorciado", "Viudo" o "" si no se distingue
- profesion: Ocupación o profesión si figura en el documento
- direccion: Domicilio o calle/zona que aparezca en el reverso o texto
- departamento: Nombre del departamento boliviano correspondiente al expedido ("Santa Cruz", "La Paz", "Cochabamba", "Tarija", "Chuquisaca", "Potosí", "Oruro", "Beni", "Pando")
- ciudad: Ciudad sugerida ("Santa Cruz de la Sierra", "La Paz", "El Alto", "Cochabamba", etc.)

Devuelve ÚNICAMENTE un objeto JSON con las claves indicadas:
{
  "nombres": "",
  "apellidos": "",
  "nombreCompleto": "",
  "ci": "",
  "expedido": "",
  "ciCompleto": "",
  "fechaNacimiento": "",
  "nacionalidad": "",
  "estadoCivil": "",
  "profesion": "",
  "direccion": "",
  "departamento": "",
  "ciudad": ""
}
`;

  const contents = [
    ...images.map(img => ({
      inlineData: {
        mimeType: img.mimeType || 'image/jpeg',
        data: img.data
      }
    })),
    { text: promptText }
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
    config: {
      responseMimeType: 'application/json'
    }
  });

  const rawJson = response.text || '{}';
  return JSON.parse(rawJson);
}

/**
 * Modificar o adaptar cláusulas de un contrato usando un prompt de lenguaje natural
 * @param {Array<{ num: string, titulo: string, contenido: string }>} clausulas
 * @param {string} promptUsuario
 * @param {Object} asesorData
 */
export async function modifyContratoWithIA(clausulas, promptUsuario, asesorData = {}) {
  const ai = await getGeminiClient();

  const promptText = `
Eres un abogado corporativo y asesor legal inmobiliario de CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L. en Bolivia.
Tienes el siguiente conjunto de cláusulas del Contrato Privado de Prestación de Servicios (Agencia Inmobiliaria).

DATOS DEL ASESOR:
- Nombre: ${asesorData.nombreCompleto || 'EL ASESOR'}
- C.I.: ${asesorData.ciAsesor || asesorData.ci || 'S/N'}
- Domicilio: ${asesorData.direccionAsesor || asesorData.direccion || 'Bolivia'}
- Ciudad de firma: ${asesorData.ciudadFirma || asesorData.ciudad || 'El Alto'}

INSTRUCCIÓN O PETICIÓN DEL USUARIO:
"${promptUsuario}"

TAREA:
1. Aplica la instrucción solicitada por el usuario (ej: hacer el contrato más flexible, ajustar cuotas o comisiones, agregar nuevas cláusulas, cambiar plazos de preaviso, etc.).
2. Si la instrucción pide añadir cláusulas, agrégalas con su título y numeración correlativa correspondiente.
3. Mantén la validez y formalidad jurídica mercantil boliviana (Código Civil Art. 1297, Código de Comercio Art. 1247-1260).
4. No elimines información clave a menos que el usuario lo solicite expresamente.

Devuelve ÚNICAMENTE un objeto JSON con:
{
  "resumenModificacion": "Resumen claro en 1-2 oraciones de qué se modificó o añadió",
  "clausulas": [
    {
      "num": "PRIMERA",
      "titulo": "DE LAS PARTES",
      "contenido": "texto de la cláusula..."
    }
  ]
}

CLÁUSULAS ACTUALES:
${JSON.stringify(clausulas, null, 2)}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: promptText,
    config: {
      responseMimeType: 'application/json'
    }
  });

  const rawJson = response.text || '{}';
  return JSON.parse(rawJson);
}


