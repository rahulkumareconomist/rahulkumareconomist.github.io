// This function verifies a single-use token from the Vercel KV store
// and returns the confidential data if the token is valid.
// File path: /api/get-confidential-data.js

import { createClient } from '@vercel/kv';

export default async function handler(request, response) {
  // --- Standard CORS and Method Check ---
  const allowedOrigins = [
    'https://rahulkumareconomist-github-io.vercel.app',
    'https://rahulkumareconomist.github.io'
    // You can add 'http://localhost:3000' for local testing if needed
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
    return response.status(405).json({ success: false, error: 'Only POST requests are allowed' });
  }

  try {
    const { token } = request.body;
    if (!token) {
      return response.status(400).json({ success: false, error: 'Token is required.' });
    }

    // Connect to your Vercel KV store
    const kv = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    
    // --- NEW: Securely define your confidential data ---
    // This data is NOT public and only lives on the server.
    const CONFIDENTIAL_DATA = {
        "confidential-sovereign-portfolio": "multi-billion USD",
        "confidential-lombard-portfolio": "multi-billion USD"
        // You can add more key-value pairs here.
        // The key must match the 'id' of the span in your resume.html
    };

    // Check if the token exists in the KV store.
    const storedToken = await kv.get(token);

    if (storedToken) {
      // --- MODIFIED: Return data on success ---
      // Success! Token is valid.
      // Now, delete the token to make it single-use.
      await kv.del(token);
      
      // Send a success response WITH the confidential data.
      return response.status(200).json({ 
        success: true, 
        data: CONFIDENTIAL_DATA 
      });

    } else {
      // Token is invalid or has already been used/expired.
      return response.status(401).json({ success: false, error: 'Invalid or expired token.' });
    }

  } catch (error) {
    console.error('Data Fetching Error:', error);
    return response.status(500).json({ success: false, error: 'An internal server error occurred.' });
  }
}
