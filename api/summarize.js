// This is a Vercel serverless function.
// It includes a dynamic CORS policy with corrected header access.

export default async function handler(request, response) {
  // Define the list of allowed website origins
  const allowedOrigins = [
    'https://rahulkumareconomist-github-io.vercel.app',
    'https://rahulkumareconomist.github.io'
  ];

  // *** THE FIX IS HERE ***
  // In Vercel's Node.js runtime, headers are on a plain object.
  const origin = request.headers.origin;
  
  // If the request's origin is in our allowed list, set the CORS header
  if (allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle the browser's preflight "OPTIONS" request for CORS
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  // We only want to handle POST requests for the actual summary
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Only POST requests are allowed' });
  }

  try {
    const { abstractText } = request.body;

    if (!abstractText) {
      return response.status(400).json({ error: 'Abstract text is required in the request body.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return response.status(500).json({ error: 'API key is not configured on the server.' });
    }

    const prompt = `Summarize the following research abstract for a non-expert audience, highlighting its key contributions in 3 simple bullet points. Use clear, accessible language.

Abstract:
---
${abstractText}
---
Summary:
`;
    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    };

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await geminiResponse.json();
    
    if (!geminiResponse.ok) {
        console.error("Gemini API Error:", result);
        throw new Error(result.error?.message || 'Failed to get a valid response from the AI service.');
    }

    if (result.candidates && result.candidates.length > 0) {
      const summary = result.candidates[0].content.parts[0].text;
      return response.status(200).json({ summary: summary });
    } else {
      throw new Error('The AI service returned an empty or invalid summary.');
    }

  } catch (error) {
    console.error('Internal Server Error:', error);
    return response.status(500).json({ error: error.message || 'An internal server error occurred.' });
  }
}
