// This is a Vercel serverless function.
// It will be accessible at YOUR_SITE_URL/api/summarize

export default async function handler(request, response) {
  // 1. Check if the request is a POST request.
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    // 2. Get the abstract text from the body of the request from the frontend.
    const { abstractText } = request.body;
    if (!abstractText) {
      return response.status(400).json({ error: 'Abstract text is required.' });
    }

    // 3. Get your secret API key from environment variables.
    //    You will set this up on the Vercel website, NOT in your code.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return response.status(500).json({ error: 'API key is not configured.' });
    }

    // 4. Prepare the prompt for the Gemini API.
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

    // 5. Call the real Google Gemini API from your secure backend.
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!geminiResponse.ok) {
        const errorData = await geminiResponse.text();
        console.error("Gemini API Error:", errorData);
        return response.status(geminiResponse.status).json({ error: 'Failed to fetch summary from Gemini API.' });
    }

    const result = await geminiResponse.json();

    // 6. Extract the summary and send it back to your frontend.
    if (result.candidates && result.candidates.length > 0) {
      const summary = result.candidates[0].content.parts[0].text;
      return response.status(200).json({ summary: summary });
    } else {
      return response.status(500).json({ error: 'Invalid response from Gemini API.' });
    }

  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'An internal server error occurred.' });
  }
}