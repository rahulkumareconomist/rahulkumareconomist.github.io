// This is a Vercel serverless function for the dashboard analysis.
// It includes a dynamic CORS policy.

export default async function handler(request, response) {
  // Define the list of allowed website origins
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
    const { prompt } = request.body;

    if (!prompt) {
      return response.status(400).json({ error: 'A prompt is required in the request body.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return response.status(500).json({ error: 'API key is not configured on the server.' });
    }

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ "google_search": {} }],
        systemInstruction: {
            parts: [{ text: "You are an expert macroeconomic analyst. Your goal is to provide clear, structured, and insightful analysis based on the user's query. Use markdown for formatting, including headers, bold text, and lists." }]
        },
    };

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-preview-0514:generateContent?key=${apiKey}`, {
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
      const analysis = result.candidates[0].content.parts[0].text;
      return response.status(200).json({ analysis: analysis });
    } else {
      throw new Error('The AI service returned an empty or invalid analysis.');
    }

  } catch (error) {
    console.error('Internal Server Error:', error);
    return response.status(500).json({ error: error.message || 'An internal server error occurred.' });
  }
}
