const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const port = Number(process.env.PORT) || 3000;
const apiKey = process.env.GEMINI_API_KEY;
const chatModel = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
const imageModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const root = __dirname;
const requestLog = new Map();
const rateLimitWindow = 60_000;
const rateLimitMax = 8;

const profile = `Girisha Suri is a fashion and graphic design leader based in India. She is Head of Design & Merchandise at SUTI and Head of Design at Wings Lifestyle. At SUTI she led the full product lifecycle, contributed to 20% sales growth, launched the brand in Shoppers Stop, and modernized traditional ethnic collections. At Wings Lifestyle she onboarded Westside brands Utsa and Vark and led collection development, sampling, and production timelines. Previous work includes 224dot/Resourzburg, Manchester Metropolitan University's circular-design project The Archive, SmallOutside.co, and FabIndia. Her tools include Adobe Creative Cloud, Gerber, Clo3D, and Figma. She holds Adobe professional and Carbon Literacy certifications.`;

const chatInstruction = `You are Girisha Suri's professional portfolio representative. Be warm, precise, and concise (at most three short paragraphs). Speak about Girisha in the third person and rely only on this profile: ${profile} If a question is unrelated, politely bring the conversation back to her work and the value she can offer a brand. Never invent clients, dates, awards, or metrics.`;

const collectionInstruction = `Create a concise commercial fashion collection proposal using Markdown. Include these headings: Collection Name & Concept, Design & Styling Innovation, Assortment Range Plan, Fabric & Sustainability Specifications, and Retail Viability. Give concrete, retail-ready recommendations and ensure assortment percentages total 100%. Also generate one premium editorial catalog image of a contemporary Indian garment matching the brief, on a neutral stone studio background.`;

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16_384) throw new Error('Request is too large.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function callGemini(model, payload) {
  if (!apiKey) throw new Error('AI Studio is not configured yet. Add GEMINI_API_KEY to Replit Secrets.');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60_000)
  });
  const result = await response.json();
  if (!response.ok) {
    console.error('Gemini API error:', response.status, result?.error?.message);
    throw new Error('The AI service is temporarily unavailable. Please try again shortly.');
  }
  return result;
}

function extractParts(result) {
  const parts = result?.candidates?.[0]?.content?.parts || [];
  const text = parts.filter(part => part.text).map(part => part.text).join('\n').trim();
  const imagePart = parts.find(part => part.inlineData?.data);
  const image = imagePart
    ? `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`
    : null;
  return { text, image };
}

async function handleApi(request, response, pathname) {
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed.' });
  const forwarded = request.headers['x-forwarded-for'];
  const clientId = String(forwarded || request.socket.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const recent = (requestLog.get(clientId) || []).filter(timestamp => now - timestamp < rateLimitWindow);
  if (recent.length >= rateLimitMax) return sendJson(response, 429, { error: 'Too many AI requests. Please wait a minute and try again.' });
  recent.push(now);
  requestLog.set(clientId, recent);

  try {
    const body = await readJson(request);
    if (pathname === '/api/chat') {
      const question = String(body.question || '').trim().slice(0, 1000);
      if (!question) return sendJson(response, 400, { error: 'Please enter a question.' });
      const result = await callGemini(chatModel, {
        systemInstruction: { parts: [{ text: chatInstruction }] },
        contents: [{ role: 'user', parts: [{ text: question }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 500 }
      });
      const output = extractParts(result);
      if (!output.text) throw new Error('The AI service returned an empty response.');
      return sendJson(response, 200, { text: output.text });
    }

    const theme = String(body.theme || '').trim().slice(0, 200);
    const demographic = String(body.demographic || '').trim().slice(0, 200);
    const palette = String(body.palette || '').trim().slice(0, 100);
    if (!theme || !demographic || !palette) return sendJson(response, 400, { error: 'Please complete the collection brief.' });
    const prompt = `${collectionInstruction}\nTheme: ${theme}\nPalette: ${palette}\nTarget customer: ${demographic}\nReflect Girisha's contemporary ethnic design and commercial merchandising approach.`;
    const result = await callGemini(imageModel, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
    });
    const output = extractParts(result);
    if (!output.text) throw new Error('The AI service returned an empty collection brief.');
    if (!output.image) throw new Error('The AI service did not return a concept image. Please try again.');
    return sendJson(response, 200, output);
  } catch (error) {
    const publicMessage = error instanceof SyntaxError ? 'Invalid request.' : error.message;
    return sendJson(response, 500, { error: publicMessage });
  }
}

async function serveFile(response, pathname) {
  const requested = pathname === '/' ? 'cv.html' : pathname.replace(/^\/+/, '');
  const filePath = path.resolve(root, requested);
  if (!filePath.startsWith(`${root}${path.sep}`)) return sendJson(response, 403, { error: 'Forbidden.' });
  const extension = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };
  try {
    const file = await fs.readFile(filePath);
    response.writeHead(200, {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    response.end(file);
  } catch (error) {
    if (error.code === 'ENOENT') return sendJson(response, 404, { error: 'Not found.' });
    throw error;
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/api/chat' || url.pathname === '/api/collection') {
      return await handleApi(request, response, url.pathname);
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return sendJson(response, 405, { error: 'Method not allowed.' });
    }
    await serveFile(response, url.pathname);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: 'Internal server error.' });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Girisha's portfolio is running on port ${port}.`);
});
