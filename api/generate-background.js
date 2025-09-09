// This is a Vercel serverless function for generating the background image.
export default async function handler(request, response) {
  // CORS headers
  const allowedOrigins = [
    'https://rahulkumareconomist-github-io.vercel.app',
    'https://rahulkumareconomist.github.io'
  ];
  const origin = request.headers.origin;
  if (allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
  }
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Only POST requests are allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return response.status(500).json({ error: 'API key is not configured on the server.' });
    }

    const { prompt } = request.body;
    if (!prompt) {
      return response.status(400).json({ error: 'A prompt is required.' });
    }

    const payload = {
        instances: [{ prompt: prompt }],
        parameters: { "sampleCount": 1 }
    };

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API Error:", result);
      throw new Error(result.error?.message || 'Failed to get a valid response from the AI service.');
    }

    const base64Data = result.predictions?.[0]?.bytesBase64Encoded;
    if (base64Data) {
      return response.status(200).json({ image: base64Data });
    } else {
      throw new Error('The AI service returned no image data.');
    }

  } catch (error) {
    console.error('Internal Server Error:', error);
    return response.status(500).json({ error: error.message || 'An internal server error occurred.' });
  }
}
