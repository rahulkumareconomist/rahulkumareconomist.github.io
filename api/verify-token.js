// This function verifies a single-use token from the Vercel KV store.
import { createClient } from '@vercel/kv';

export default async function handler(request, response) {
  // --- Standard CORS and Method Check ---
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
    const { token } = request.body;
    if (!token) {
      return response.status(400).json({ error: 'Token is required.' });
    }

    const kv = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    // Check if the token exists in the KV store.
    const storedToken = await kv.get(token);

    if (storedToken) {
      // Success! Token is valid.
      // Now, delete the token to make it single-use.
      await kv.del(token);
      return response.status(200).json({ success: true });
    } else {
      // Token is invalid or has already been used/expired.
      return response.status(401).json({ error: 'Invalid or expired token.' });
    }

  } catch (error) {
    console.error('Token Verification Error:', error);
    return response.status(500).json({ error: 'An internal server error occurred.' });
  }
}
