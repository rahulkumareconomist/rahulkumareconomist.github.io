// This is a Vercel serverless function.
// It will be accessible at YOUR_SITE_URL/api/summarize

export default async function handler(request, response) {
  // Set CORS headers to allow requests from your specific Vercel domain
  response.setHeader('Access-Control-Allow-Origin', 'https://rahulkumareconomist-github-io.vercel.app');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS requests for CORS
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Only POST requests are allowed' });
  }

  try {
    // FIX: Correctly parse the JSON body from the request
    const { abstractText } = await request.json();
    if (!abstractText) {
      return response.status(400).json({ error: 'Abstract text is required.' });
    }

    // Get your secret API key from environment variables on Vercel
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return response.status(500).json({ error: 'API key is not configured on the server.' });
    }

    // Prepare the prompt for the Gemini API.
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

    // Call the real Google Gemini API from your secure backend.
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
